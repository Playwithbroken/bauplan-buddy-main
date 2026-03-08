import React, { useState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Calculator, FileText, Save, Send, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { InvoiceFormData } from '@/types/invoice';
import { InvoiceService } from '@/services/enhancedInvoiceService';
import { InvoiceTemplatesService, type InvoiceTemplate } from '@/services/invoiceTemplatesService';
import { DraftService } from '@/services/draftService';

// Validation schema
const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Beschreibung ist erforderlich'),
  quantity: z.number().min(0.01, 'Menge muss größer als 0 sein'),
  unit: z.string().min(1, 'Einheit ist erforderlich'),
  unitPrice: z.number().min(0, 'Preis muss positiv sein'),
  taxRate: z.number().min(0).max(100, 'Steuersatz muss zwischen 0 und 100% liegen'),
  discount: z.number().min(0).max(100).optional(),
  discountType: z.enum(['percentage', 'fixed']).optional(),
});

const invoiceSchema = z.object({
  type: z.enum(['invoice', 'credit_note', 'proforma']),
  issueDate: z.string().min(1, 'Rechnungsdatum ist erforderlich'),
  dueDate: z.string().min(1, 'Fälligkeitsdatum ist erforderlich'),
  serviceDate: z.string().optional(),
  
  recipient: z.object({
    company: z.string().optional(),
    name: z.string().min(1, 'Name ist erforderlich'),
    street: z.string().min(1, 'Straße ist erforderlich'),
    postalCode: z.string().min(1, 'PLZ ist erforderlich'),
    city: z.string().min(1, 'Stadt ist erforderlich'),
    country: z.string().min(1, 'Land ist erforderlich'),
    vatNumber: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }),
  
  projectId: z.string().optional(),
  customerRef: z.string().optional(),
  orderNumber: z.string().optional(),
  quoteNumber: z.string().optional(),
  
  items: z.array(invoiceItemSchema).min(1, 'Mindestens eine Position ist erforderlich'),
  
  currency: z.string().min(1, 'Währung ist erforderlich'),
  language: z.enum(['de', 'en']),
  template: z.string().min(1, 'Vorlage ist erforderlich'),
  
  paymentTerms: z.object({
    paymentDueDays: z.number().min(0, 'Zahlungsziel muss positiv sein'),
    paymentMethod: z.enum(['bank_transfer', 'cash', 'card', 'check']),
    bankDetails: z.object({
      accountHolder: z.string().optional(),
      iban: z.string().optional(),
      bic: z.string().optional(),
      bankName: z.string().optional(),
    }).optional(),
    earlyPaymentDiscount: z.object({
      percentage: z.number().min(0).max(100),
      daysLimit: z.number().min(0),
    }).optional(),
  }),
  
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  
  recurring: z.object({
    enabled: z.boolean(),
    interval: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
    endDate: z.string().optional(),
    count: z.number().min(1).optional(),
  }).optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface EnhancedInvoiceFormProps {
  initialData?: Partial<InvoiceFormData>;
  onSubmit: (data: InvoiceFormData, action: 'save' | 'send' | 'preview') => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const EnhancedInvoiceForm: React.FC<EnhancedInvoiceFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState('general');
  const [totals, setTotals] = useState({ net: 0, tax: 0, gross: 0 });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      type: 'invoice',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      serviceDate: new Date().toISOString().split('T')[0],
      currency: 'EUR',
      language: 'de',
      template: 'standard',
      paymentTerms: {
        paymentDueDays: 30,
        paymentMethod: 'bank_transfer',
      },
      items: [
        {
          description: '',
          quantity: 1,
          unit: 'Stk',
          unitPrice: 0,
          taxRate: 19,
          discount: 0,
          discountType: 'percentage',
        },
      ],
      ...initialData,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');
  const DRAFT_KEY = 'bauplan.draft.enhancedInvoiceForm';
  const [history, setHistory] = useState<InvoiceFormValues[]>([]);
  const [redoStack, setRedoStack] = useState<InvoiceFormValues[]>([]);
  React.useEffect(() => {
    setHistory([getValues()]);
  }, [getValues]);
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isCtrl = (e.ctrlKey || e.metaKey);
      if (!isCtrl) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        if (history.length > 1) {
          e.preventDefault();
          const prevSnapshot = history[history.length - 2];
          setRedoStack(rs => [history[history.length - 1], ...rs]);
          setHistory(h => h.slice(0, h.length - 1));
          reset(prevSnapshot);
        }
      } else if (key === 'y' || (key === 'z' && e.shiftKey)) {
        if (redoStack.length > 0) {
          e.preventDefault();
          const nextSnapshot = redoStack[0];
          setRedoStack(rs => rs.slice(1));
          setHistory(h => [...h, nextSnapshot]);
          reset(nextSnapshot);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [history, redoStack, reset]);
  React.useEffect(() => {
    const draft = DraftService.load<InvoiceFormValues>(DRAFT_KEY);
    if (draft) {
      reset(draft);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  React.useEffect(() => {
    const subscription = watch((value) => {
      const snapshot = value as InvoiceFormValues;
      DraftService.save(DRAFT_KEY, snapshot);
      setHistory(prev => {
        const last = prev[prev.length - 1];
        if (last && JSON.stringify(last) === JSON.stringify(snapshot)) return prev;
        const next = [...prev, snapshot];
        return next.length > 50 ? next.slice(next.length - 50) : next;
      });
      setRedoStack([]);
    });
    return () => subscription.unsubscribe();
  }, [watch]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const invoiceTemplatesService = InvoiceTemplatesService.getInstance();
  const templates: InvoiceTemplate[] = invoiceTemplatesService.listTemplates();
  const applyTemplate = useCallback(() => {
    const tpl = templates.find(t => t.id === selectedTemplateId);
    if (!tpl) return;
    const mappedItems = tpl.positions.map(pos => ({
      description: pos.description,
      quantity: pos.quantity,
      unit: pos.unit,
      unitPrice: pos.unitPrice,
      taxRate: 19,
      discount: 0,
      discountType: 'percentage' as const,
    }));
    setValue('items', mappedItems);
    if (tpl.paymentTerms) {
      setValue('paymentTerms.paymentDueDays', tpl.paymentTerms);
    }
    if (tpl.description) {
      setValue('notes', tpl.description);
    }
  }, [selectedTemplateId, templates, setValue]);

  // Calculate totals when items change
  React.useEffect(() => {
    const calculateTotals = () => {
      let net = 0;
      let tax = 0;
      let gross = 0;

      watchedItems.forEach((item) => {
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unitPrice) || 0;
        const discount = Number(item.discount) || 0;
        const taxRate = Number(item.taxRate) || 0;

        let itemNet = quantity * unitPrice;
        
        // Apply discount
        if (discount > 0) {
          if (item.discountType === 'percentage') {
            itemNet = itemNet * (1 - discount / 100);
          } else {
            itemNet = Math.max(0, itemNet - discount);
          }
        }

        const itemTax = itemNet * (taxRate / 100);
        const itemGross = itemNet + itemTax;

        net += itemNet;
        tax += itemTax;
        gross += itemGross;
      });

      setTotals({ net, tax, gross });
    };

    calculateTotals();
  }, [watchedItems]);

  const addItem = useCallback(() => {
    append({
      description: '',
      quantity: 1,
      unit: 'Stk',
      unitPrice: 0,
      taxRate: 19,
      discount: 0,
      discountType: 'percentage',
    });
  }, [append]);

  const removeItem = useCallback((index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  }, [remove, fields.length]);

  const handleFormSubmit = (action: 'save' | 'send' | 'preview') => {
    return handleSubmit((data) => {
      onSubmit(data as InvoiceFormData, action);
      DraftService.clear(DRAFT_KEY);
    })();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {initialData ? 'Rechnung bearbeiten' : 'Neue Rechnung'}
          </h1>
          <p className="text-gray-600 mt-1">
            Erstellen Sie eine neue Rechnung mit allen erforderlichen Details
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Abbrechen
          </Button>
          <Button
            variant="outline"
            onClick={() => handleFormSubmit('preview')}
            disabled={isSubmitting || isLoading}
          >
            <Eye className="h-4 w-4 mr-2" />
            Vorschau
          </Button>
          <Button
            onClick={() => handleFormSubmit('save')}
            disabled={isSubmitting || isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            Speichern
          </Button>
          <Button
            onClick={() => handleFormSubmit('send')}
            disabled={isSubmitting || isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="h-4 w-4 mr-2" />
            Senden
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Allgemein</TabsTrigger>
          <TabsTrigger value="items">Positionen</TabsTrigger>
          <TabsTrigger value="payment">Zahlung</TabsTrigger>
          <TabsTrigger value="options">Optionen</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Invoice Information */}
            <Card>
              <CardHeader>
                <CardTitle>Rechnungsinformationen</CardTitle>
                <CardDescription>
                  Grundlegende Informationen zur Rechnung
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Typ</Label>
                    <Select {...register('type')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Typ wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="invoice">Rechnung</SelectItem>
                        <SelectItem value="credit_note">Gutschrift</SelectItem>
                        <SelectItem value="proforma">Proforma</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Währung</Label>
                    <Select {...register('currency')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Währung" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="CHF">CHF - Schweizer Franken</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issueDate">Rechnungsdatum</Label>
                    <Input
                      type="date"
                      {...register('issueDate')}
                      className={errors.issueDate ? 'border-red-500' : ''}
                    />
                    {errors.issueDate && (
                      <p className="text-sm text-red-600">{errors.issueDate.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Fälligkeitsdatum</Label>
                    <Input
                      type="date"
                      {...register('dueDate')}
                      className={errors.dueDate ? 'border-red-500' : ''}
                    />
                    {errors.dueDate && (
                      <p className="text-sm text-red-600">{errors.dueDate.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceDate">Leistungsdatum (optional)</Label>
                  <Input
                    type="date"
                    {...register('serviceDate')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerRef">Kundenreferenz</Label>
                    <Input
                      {...register('customerRef')}
                      placeholder="Ihre Referenz"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orderNumber">Auftragsnummer</Label>
                    <Input
                      {...register('orderNumber')}
                      placeholder="Auftragsnummer"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Rechnungsempfänger</CardTitle>
                <CardDescription>
                  Adresse und Kontaktdaten des Rechnungsempfängers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient.company">Firma (optional)</Label>
                  <Input
                    {...register('recipient.company')}
                    placeholder="Firmenname"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipient.name">Name *</Label>
                  <Input
                    {...register('recipient.name')}
                    placeholder="Vor- und Nachname"
                    className={errors.recipient?.name ? 'border-red-500' : ''}
                  />
                  {errors.recipient?.name && (
                    <p className="text-sm text-red-600">{errors.recipient.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipient.street">Straße *</Label>
                  <Input
                    {...register('recipient.street')}
                    placeholder="Straße und Hausnummer"
                    className={errors.recipient?.street ? 'border-red-500' : ''}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipient.postalCode">PLZ *</Label>
                    <Input
                      {...register('recipient.postalCode')}
                      placeholder="PLZ"
                      className={errors.recipient?.postalCode ? 'border-red-500' : ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipient.city">Stadt *</Label>
                    <Input
                      {...register('recipient.city')}
                      placeholder="Stadt"
                      className={errors.recipient?.city ? 'border-red-500' : ''}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipient.country">Land *</Label>
                  <Input
                    {...register('recipient.country')}
                    placeholder="Land"
                    defaultValue="Deutschland"
                    className={errors.recipient?.country ? 'border-red-500' : ''}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipient.email">E-Mail</Label>
                    <Input
                      type="email"
                      {...register('recipient.email')}
                      placeholder="email@beispiel.de"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipient.vatNumber">USt-IdNr.</Label>
                    <Input
                      {...register('recipient.vatNumber')}
                      placeholder="DE123456789"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="items" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Rechnungspositionen</CardTitle>
                  <CardDescription>
                    Fügen Sie die zu berechnenden Positionen hinzu
                  </CardDescription>
                </div>
                <Button onClick={addItem} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Position hinzufügen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Label>Vorlage</Label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Vorlage wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={applyTemplate} disabled={!selectedTemplateId}>
                  Vorlage anwenden
                </Button>
              </div>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <Card key={field.id} className="relative">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-5">
                          <Label htmlFor={`items.${index}.description`}>
                            Beschreibung *
                          </Label>
                          <Textarea
                            {...register(`items.${index}.description`)}
                            placeholder="Beschreibung der Leistung/Ware"
                            className="min-h-[60px]"
                          />
                        </div>
                        
                        <div className="col-span-1">
                          <Label htmlFor={`items.${index}.quantity`}>
                            Menge *
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                            placeholder="1"
                          />
                        </div>
                        
                        <div className="col-span-1">
                          <Label htmlFor={`items.${index}.unit`}>
                            Einheit *
                          </Label>
                          <Input
                            {...register(`items.${index}.unit`)}
                            placeholder="Stk"
                          />
                        </div>
                        
                        <div className="col-span-2">
                          <Label htmlFor={`items.${index}.unitPrice`}>
                            Einzelpreis *
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                            placeholder="0.00"
                          />
                        </div>
                        
                        <div className="col-span-1">
                          <Label htmlFor={`items.${index}.taxRate`}>
                            MwSt. %
                          </Label>
                          <Select {...register(`items.${index}.taxRate`, { valueAsNumber: true })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">0%</SelectItem>
                              <SelectItem value="7">7%</SelectItem>
                              <SelectItem value="19">19%</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="col-span-1">
                          <Label htmlFor={`items.${index}.discount`}>
                            Rabatt
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            {...register(`items.${index}.discount`, { valueAsNumber: true })}
                            placeholder="0"
                          />
                        </div>
                        
                        <div className="col-span-1 flex items-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeItem(index)}
                            disabled={fields.length === 1}
                            className="h-10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Separator className="my-6" />

              {/* Totals Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Zwischensumme (netto):</span>
                  <span className="text-sm">{totals.net.toFixed(2)} EUR</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">MwSt.:</span>
                  <span className="text-sm">{totals.tax.toFixed(2)} EUR</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center">
                  <span className="font-bold">Gesamt (brutto):</span>
                  <span className="font-bold text-lg">{totals.gross.toFixed(2)} EUR</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Zahlungsbedingungen</CardTitle>
              <CardDescription>
                Konfigurieren Sie die Zahlungsoptionen und -bedingungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentTerms.paymentDueDays">Zahlungsziel (Tage)</Label>
                  <Input
                    type="number"
                    {...register('paymentTerms.paymentDueDays', { valueAsNumber: true })}
                    placeholder="30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentTerms.paymentMethod">Zahlungsart</Label>
                  <Select {...register('paymentTerms.paymentMethod')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Banküberweisung</SelectItem>
                      <SelectItem value="cash">Barzahlung</SelectItem>
                      <SelectItem value="card">Kartenzahlung</SelectItem>
                      <SelectItem value="check">Scheck</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Bankverbindung</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms.bankDetails.accountHolder">Kontoinhaber</Label>
                    <Input
                      {...register('paymentTerms.bankDetails.accountHolder')}
                      placeholder="Firmenname"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms.bankDetails.bankName">Bank</Label>
                    <Input
                      {...register('paymentTerms.bankDetails.bankName')}
                      placeholder="Deutsche Bank"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms.bankDetails.iban">IBAN</Label>
                    <Input
                      {...register('paymentTerms.bankDetails.iban')}
                      placeholder="DE12 1234 1234 1234 1234 12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms.bankDetails.bic">BIC</Label>
                    <Input
                      {...register('paymentTerms.bankDetails.bic')}
                      placeholder="DEUTDEFF"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="options" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Notizen</CardTitle>
                <CardDescription>
                  Zusätzliche Informationen zur Rechnung
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Notizen (für Kunde sichtbar)</Label>
                  <Textarea
                    {...register('notes')}
                    placeholder="Zusätzliche Informationen für den Kunden..."
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="internalNotes">Interne Notizen</Label>
                  <Textarea
                    {...register('internalNotes')}
                    placeholder="Interne Notizen (nicht auf der Rechnung sichtbar)..."
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Wiederkehrende Rechnung</CardTitle>
                <CardDescription>
                  Automatische Rechnungserstellung konfigurieren
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="recurring.enabled"
                    {...register('recurring.enabled')}
                  />
                  <Label htmlFor="recurring.enabled">Wiederkehrende Rechnung aktivieren</Label>
                </div>

                {watch('recurring.enabled') && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="recurring.interval">Intervall</Label>
                      <Select {...register('recurring.interval')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Intervall wählen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monatlich</SelectItem>
                          <SelectItem value="quarterly">Vierteljährlich</SelectItem>
                          <SelectItem value="yearly">Jährlich</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="recurring.endDate">Enddatum (optional)</Label>
                      <Input
                        type="date"
                        {...register('recurring.endDate')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="recurring.count">Anzahl Wiederholungen (optional)</Label>
                      <Input
                        type="number"
                        {...register('recurring.count', { valueAsNumber: true })}
                        placeholder="Unbegrenzt"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedInvoiceForm;