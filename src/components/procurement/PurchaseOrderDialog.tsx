import React, { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Dialog,
  MultiWindowDialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/use-toast';
import { ProcurementService, InventoryItem, ProcurementOrder } from '@/services/procurementService';
import { PresetService, type ProductPreset } from '@/services/presetService';
import { DraftService } from '@/services/draftService';
import { CalendarIcon, Plus, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

import { DialogFrame } from '@/components/ui/dialog-frame';

const purchaseOrderLineSchema = z.object({
  inventoryId: z.string().min(1, 'Bitte Artikel auswählen'),
  quantity: z.coerce.number().min(1, 'Menge muss größer als 0 sein'),
  unitPrice: z.coerce.number().min(0, 'Preis muss positiv sein').optional(),
  requiredDate: z.date({
    required_error: 'Benötigungsdatum erforderlich',
  }),
  targetProjectId: z.string().optional(),
  targetProjectName: z.string().optional(),
});

const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'Bitte Lieferant auswählen'),
  supplierName: z.string().min(1, 'Lieferantenname erforderlich'),
  requestedBy: z.string().min(1, 'Anforderer erforderlich'),
  expectedDelivery: z.date({
    required_error: 'Lieferdatum erforderlich',
  }),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  projectId: z.string().optional(),
  projectName: z.string().optional(),
  costCentre: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(purchaseOrderLineSchema).min(1, 'Mindestens eine Position erforderlich'),
});

type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;

interface PurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (order: ProcurementOrder) => void;
  prefilledInventoryId?: string;
}

const mockSuppliers = [
  { id: 'SUP-001', name: 'Baustoff Weber GmbH' },
  { id: 'SUP-002', name: 'Holz & Mehr AG' },
  { id: 'SUP-003', name: 'Elektro Schmidt' },
  { id: 'SUP-004', name: 'Zementwerke Süd AG' },
  { id: 'SUP-009', name: 'KlimaTech Solutions' },
];

const mockProjects = [
  { id: 'PRJ-001', name: 'Wohnquartier München' },
  { id: 'PRJ-002', name: 'Büropark Frankfurt' },
  { id: 'PRJ-003', name: 'Schulerweiterung Hamburg' },
  { id: 'PRJ-004', name: 'Logistikzentrum Leipzig' },
  { id: 'PRJ-005', name: 'Krankenhaus Stuttgart' },
];

export const PurchaseOrderDialog: React.FC<PurchaseOrderDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  prefilledInventoryId,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productPresets, setProductPresets] = useState<ProductPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const inventory = useMemo(() => ProcurementService.getInventory(), []);
  useEffect(() => {
    setProductPresets(PresetService.listProductPresets());
  }, []);

  const form = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      supplierId: '',
      supplierName: '',
      requestedBy: 'Admin User',
      expectedDelivery: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      priority: 'medium',
      projectId: '',
      projectName: '',
      costCentre: '',
      notes: '',
      lines: prefilledInventoryId
        ? [
            {
              inventoryId: prefilledInventoryId,
              quantity: 1,
              requiredDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
            },
          ]
        : [],
    },
  });

  const DRAFT_KEY = 'bauplan.draft.purchaseOrderDialog';
  const [history, setHistory] = useState<PurchaseOrderFormValues[]>([]);
  const [redoStack, setRedoStack] = useState<PurchaseOrderFormValues[]>([]);
  useEffect(() => {
    const draft = DraftService.load<PurchaseOrderFormValues>(DRAFT_KEY);
    if (draft) {
      form.reset(draft);
      setHistory([draft]);
    } else {
      setHistory([form.getValues()]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const subscription = form.watch((value) => {
      const snapshot = value as PurchaseOrderFormValues;
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
  }, [form]);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      if (!isCtrl) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        if (history.length > 1) {
          e.preventDefault();
          const prevSnapshot = history[history.length - 2]!;
          setRedoStack(rs => [history[history.length - 1]!, ...rs]);
          setHistory(h => h.slice(0, h.length - 1));
          form.reset(prevSnapshot);
        }
      } else if (key === 'y' || (key === 'z' && e.shiftKey)) {
        if (redoStack.length > 0) {
          e.preventDefault();
          const nextSnapshot = redoStack[0]!;
          setRedoStack(rs => rs.slice(1));
          setHistory(h => [...h, nextSnapshot]);
          form.reset(nextSnapshot);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [history, redoStack, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lines',
  });

  const totalAmount = useMemo(() => {
    return fields.reduce((total, field, index) => {
      const inventoryId = form.watch(`lines.${index}.inventoryId`);
      const quantity = form.watch(`lines.${index}.quantity`) || 0;
      const unitPrice = form.watch(`lines.${index}.unitPrice`);

      const item = inventory.find((inv) => inv.id === inventoryId);
      const price = unitPrice !== undefined ? unitPrice : item?.unitPrice || 0;

      return total + quantity * price;
    }, 0);
  }, [fields, form, inventory]);

  const handleSupplierChange = (supplierId: string) => {
    const supplier = mockSuppliers.find((s) => s.id === supplierId);
    if (supplier) {
      form.setValue('supplierId', supplier.id);
      form.setValue('supplierName', supplier.name);
    }
  };

  const handleProjectChange = (projectId: string) => {
    const project = mockProjects.find((p) => p.id === projectId);
    if (project) {
      form.setValue('projectId', project.id);
      form.setValue('projectName', project.name);
    }
  };

  const onSubmit = async (data: PurchaseOrderFormValues) => {
    setIsSubmitting(true);
    try {
      const order = ProcurementService.createPurchaseOrder({
        supplierId: data.supplierId,
        supplierName: data.supplierName,
        requestedBy: data.requestedBy,
        expectedDelivery: data.expectedDelivery.toISOString(),
        priority: data.priority,
        projectId: data.projectId,
        projectName: data.projectName,
        costCentre: data.costCentre,
        notes: data.notes,
        lines: data.lines.map((line) => ({
          inventoryId: line.inventoryId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          requiredDate: line.requiredDate.toISOString(),
          requestedBy: data.requestedBy,
          targetProjectId: line.targetProjectId,
          targetProjectName: line.targetProjectName,
        })),
      });

      toast({
        title: 'Bestellung erstellt',
        description: `Bestellnummer ${order.orderNumber} wurde erfolgreich angelegt.`,
        variant: 'default',
      });

      onSuccess?.(order);
      DraftService.clear(DRAFT_KEY);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Bestellung konnte nicht erstellt werden.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addLine = () => {
    append({
      inventoryId: '',
      quantity: 1,
      requiredDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    });
  };

  const applyPresetToNewLine = () => {
    if (!selectedPresetId) return;
    const preset = productPresets.find(p => p.id === selectedPresetId);
    if (!preset) return;
    const inv = inventory.find(i => (preset.sku && i.sku === preset.sku) || (preset.name && i.name === preset.name));
    append({
      inventoryId: inv?.id ?? '',
      quantity: 1,
      unitPrice: preset.defaultUnitPrice ?? inv?.unitPrice,
      requiredDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    });
    if (preset.supplierId && preset.supplierName) {
      form.setValue('supplierId', preset.supplierId);
      form.setValue('supplierName', preset.supplierName);
    }
  };

  const saveProductPresetFromFirstLine = () => {
    const firstId = form.getValues('lines.0.inventoryId');
    if (!firstId) return;
    const inv = inventory.find(i => i.id === firstId);
    if (!inv) return;
    const unitPrice = form.getValues('lines.0.unitPrice') ?? inv.unitPrice;
    const supplierId = form.getValues('supplierId');
    const supplierName = form.getValues('supplierName');
    const created = PresetService.createProductPreset({
      name: inv.name,
      sku: inv.sku,
      unit: inv.unit,
      defaultUnitPrice: unitPrice,
      category: inv.category,
      supplierId,
      supplierName,
      currency: 'EUR',
    });
    setProductPresets((prev) => [created, ...prev]);
    setSelectedPresetId(created.id);
  };

  return (
    <MultiWindowDialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogFrame
        showFullscreenToggle
        defaultFullscreen
        width="fit-content"
        minWidth={800}
        maxWidth={1400}
        preventOutsideClose={true}
        title={<span>Neue Bestellung erstellen</span>}
        description={<DialogDescription>Erstellen Sie eine Bestellung für Materialien oder Dienstleistungen.</DialogDescription>}
        footer={
          <div className="flex items-center justify-between sm:justify-between w-full">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">Gesamtsumme</p>
              <p className="text-2xl font-bold">{totalAmount.toFixed(2)} EUR</p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Abbrechen
              </Button>
              <Button type="submit" form="purchase-order-form" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Wird erstellt...' : 'Bestellung anlegen'}
              </Button>
            </div>
          </div>
        }
      >
        <Form {...form}>
          <form id="purchase-order-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-6">
              {/* Supplier and Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lieferant *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleSupplierChange(value);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Lieferant auswählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {mockSuppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requestedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anforderer *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Name des Anforderers" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="expectedDelivery"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Lieferdatum *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'dd.MM.yyyy', { locale: de })
                              ) : (
                                <span>Datum wählen</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priorität</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Niedrig</SelectItem>
                          <SelectItem value="medium">Normal</SelectItem>
                          <SelectItem value="high">Hoch</SelectItem>
                          <SelectItem value="critical">Kritisch</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="costCentre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kostenstelle</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="z.B. CC-BAU-01" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Project Selection */}
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Projekt (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleProjectChange(value);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Projekt auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockProjects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Ordnen Sie die Bestellung einem Projekt zu
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Order Lines */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Bestellpositionen</h3>
                    <p className="text-sm text-muted-foreground">
                      Fügen Sie Artikel zur Bestellung hinzu
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <Select value={selectedPresetId} onValueChange={setSelectedPresetId}>
                      <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="Produkt-Preset wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {productPresets.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}{p.sku ? ` (${p.sku})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" size="sm" onClick={applyPresetToNewLine} disabled={!selectedPresetId}>
                      Preset hinzufügen
                    </Button>
                    <Button type="button" size="sm" onClick={saveProductPresetFromFirstLine}>
                      Aus Position 1 speichern
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={addLine}>
                      <Plus className="mr-2 h-4 w-4" />
                      Position hinzufügen
                    </Button>
                  </div>
                </div>

                {fields.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                    <AlertCircle className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Keine Positionen vorhanden. Klicken Sie auf "Position hinzufügen".
                    </p>
                  </div>
                )}

                {fields.map((field, index) => {
                  const selectedInventoryId = form.watch(`lines.${index}.inventoryId`);
                  const selectedItem = inventory.find((inv) => inv.id === selectedInventoryId);
                  const quantity = form.watch(`lines.${index}.quantity`) || 0;
                  const unitPrice =
                    form.watch(`lines.${index}.unitPrice`) ?? selectedItem?.unitPrice ?? 0;
                  const lineTotal = quantity * unitPrice;

                  return (
                    <div
                      key={field.id}
                      className="space-y-4 rounded-lg border bg-card p-4"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-medium">Position {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.inventoryId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Artikel *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Artikel auswählen" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {inventory.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>
                                      <div className="flex flex-col">
                                        <span>{item.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {item.sku} - {item.unitPrice.toFixed(2)} EUR
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`lines.${index}.requiredDate`}
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Benötigt am *</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        'pl-3 text-left font-normal',
                                        !field.value && 'text-muted-foreground'
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, 'dd.MM.yyyy', { locale: de })
                                      ) : (
                                        <span>Datum wählen</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date < new Date()}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Menge *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  step="1"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              {selectedItem && (
                                <FormDescription className="text-xs">
                                  Einheit: {selectedItem.unit}
                                </FormDescription>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`lines.${index}.unitPrice`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Stückpreis (EUR)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder={selectedItem?.unitPrice.toFixed(2) ?? '0.00'}
                                  {...field}
                                  value={field.value ?? ''}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value ? parseFloat(e.target.value) : undefined
                                    )
                                  }
                                />
                              </FormControl>
                              <FormDescription className="text-xs">
                                Optional - Standard: {selectedItem?.unitPrice.toFixed(2) ?? '0.00'} EUR
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex flex-col justify-end">
                          <FormLabel>Gesamt</FormLabel>
                          <div className="flex h-10 items-center rounded-md border bg-muted px-3">
                            <Badge variant="secondary" className="text-sm font-semibold">
                              {lineTotal.toFixed(2)} EUR
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notizen</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Zusätzliche Informationen zur Bestellung..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </DialogFrame>
    </MultiWindowDialog>
  );
};
