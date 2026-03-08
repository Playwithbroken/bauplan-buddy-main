import React, { useEffect, useMemo, useState } from 'react';
import { MultiWindowDialog } from '../ui/dialog';
import { DialogFrame } from '../ui/dialog-frame';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Plus,
  Trash2,
  FileText,
  Download,
  Calculator,
  Eye,
  Send,
  Loader2
} from 'lucide-react';
import invoiceGenerationService, {
  InvoiceData,
  InvoicePosition
} from '../../services/invoiceGenerationService';
import { useToast } from '../../hooks/use-toast';
import {
  createProjectInvoice,
  InvoiceRecord,
  InvoiceLineItemRequest
} from '@/services/api/invoiceWorkflowApi';
import { getEnvVar } from '@/utils/env';

const USE_API = (getEnvVar('VITE_USE_API', 'false')) === 'true';
const DEFAULT_SECTION_TITLE = 'Leistungen';

const generateSectionId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `section-${crypto.randomUUID()}`;
  }
  return `section-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const generatePositionId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `invoice-pos-${crypto.randomUUID()}`;
  }
  return `invoice-pos-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const normalizeInvoicePositions = (source?: InvoicePosition[]): InvoicePosition[] => {
  if (!source || source.length === 0) {
    return [];
  }

  const sectionMap = new Map<string, string>();

  return source.map((item, index) => {
    const titleCandidate = item.sectionTitle?.trim() || item.category?.trim() || DEFAULT_SECTION_TITLE;
    const sectionTitle = titleCandidate || DEFAULT_SECTION_TITLE;

    let sectionId = item.sectionId?.trim();
    if (sectionId) {
      if (!sectionMap.has(sectionTitle)) {
        sectionMap.set(sectionTitle, sectionId);
      }
    } else if (sectionMap.has(sectionTitle)) {
      sectionId = sectionMap.get(sectionTitle);
    } else {
      sectionId = generateSectionId();
      sectionMap.set(sectionTitle, sectionId);
    }

    const quantity = Number(item.quantity ?? 0);
    const unitPrice = Number(item.unitPrice ?? 0);
    const total = Number.isFinite(item.total)
      ? Number(item.total)
      : Math.round(quantity * unitPrice * 100) / 100;
    const taxRate = Number.isFinite(Number(item.taxRate)) ? Number(item.taxRate) : 0;

    const positionId = item.id?.toString().trim() || generatePositionId();

    return {
      ...item,
      id: positionId,
      quantity,
      unitPrice,
      total,
      taxRate,
      sectionId,
      sectionTitle,
      sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : index
    };
  });
};

interface SectionGroup {
  sectionId: string;
  title: string;
  items: InvoicePosition[];
}

interface InvoiceGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectData?: {
    id: string;
    name: string;
    customer: string;
    customerId: string;
    customerEmail?: string;
    customerAddress?: string;
  };
  quoteData?: {
    id: string;
    positions: InvoicePosition[];
    customer: string;
    customerId: string;
    amount: number;
  };
}
export function InvoiceGenerationDialog({
  open,
  onOpenChange,
  projectData,
  quoteData
}: InvoiceGenerationDialogProps) {
  const { toast } = useToast();
  const invoiceService = invoiceGenerationService;

  const [activeTab, setActiveTab] = useState('details');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [persistedInvoice, setPersistedInvoice] = useState<InvoiceRecord | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [invoiceData, setInvoiceData] = useState<Partial<InvoiceData>>({
    number: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    customerId: '',
    customerName: '',
    customerAddress: '',
    customerEmail: '',
    projectId: '',
    projectName: '',
    positions: [],
    paymentTerms: 'Zahlbar innerhalb von 30 Tagen ohne Abzug.',
    notes: '',
    status: 'draft'
  });

  const [newPosition, setNewPosition] = useState<Partial<InvoicePosition>>({
    description: '',
    quantity: 1,
    unit: 'Stk.',
    unitPrice: 0,
    taxRate: 19,
    sectionTitle: DEFAULT_SECTION_TITLE
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    let initialData: Partial<InvoiceData> = {
      number: invoiceService.generateInvoiceNumber(),
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      positions: [],
      paymentTerms: 'Zahlbar innerhalb von 30 Tagen ohne Abzug.',
      status: 'draft'
    };

    if (quoteData) {
      initialData = {
        ...initialData,
        ...invoiceService.createInvoiceFromQuote(quoteData)
      };
    } else if (projectData) {
      initialData = {
        ...initialData,
        customerId: projectData.customerId,
        customerName: projectData.customer,
        customerEmail: projectData.customerEmail || '',
        customerAddress: projectData.customerAddress || '',
        projectId: projectData.id,
        projectName: projectData.name
      };
    }

    initialData.positions = normalizeInvoicePositions(initialData.positions);

    setInvoiceData(initialData);
    setPersistedInvoice(null);
    setPdfBlob(null);
    setPreviewUrl(null);
    setActiveTab('details');
    setNewPosition({
      description: '',
      quantity: 1,
      unit: 'Stk.',
      unitPrice: 0,
      taxRate: 19,
      sectionTitle: DEFAULT_SECTION_TITLE
    });
  }, [open, projectData, quoteData, invoiceService]);

  useEffect(() => {
    if (pdfBlob) {
      setActiveTab('preview');
    }
  }, [pdfBlob]);

  const positions = useMemo<InvoicePosition[]>(() => invoiceData.positions ?? [], [invoiceData.positions]);

  const sections = useMemo<SectionGroup[]>(() => {
    if (!positions.length) {
      return [];
    }

    const sorted = [...positions].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const map = new Map<string, SectionGroup>();

    sorted.forEach(position => {
      const sectionId = position.sectionId || `section-${position.id}`;
      const title = position.sectionTitle?.trim() || DEFAULT_SECTION_TITLE;

      if (!map.has(sectionId)) {
        map.set(sectionId, {
          sectionId,
          title,
          items: []
        });
      }
      const entry = map.get(sectionId)!;
      if (title && title !== entry.title) {
        entry.title = title;
      }
      entry.items.push(position);
    });

    return Array.from(map.values());
  }, [positions]);

  const updatePositions = (updater: (current: InvoicePosition[]) => InvoicePosition[]) => {
    setInvoiceData(prev => {
      const current = prev.positions ? [...prev.positions] : [];
      const next = normalizeInvoicePositions(updater(current));
      return {
        ...prev,
        positions: next.map((item, index) => ({
          ...item,
          sortOrder: index
        }))
      };
    });
  };

  const handleAddPosition = () => {
    const description = newPosition.description?.trim();
    const quantity = Number(newPosition.quantity ?? 0);
    const unitPrice = Number(newPosition.unitPrice ?? 0);
    const taxRate = Number(newPosition.taxRate ?? 0);
    const sectionTitle = (newPosition.sectionTitle ?? '').trim() || DEFAULT_SECTION_TITLE;

    if (!description || quantity <= 0 || unitPrice < 0) {
      toast({
        title: 'Unvollstaendige Position',
        description: 'Bitte fuellen Sie Beschreibung, Menge und Preis aus.',
        variant: 'destructive'
      });
      return;
    }

    const matchingSection = sections.find(section => section.title.toLowerCase() === sectionTitle.toLowerCase());
    const sectionId = matchingSection?.sectionId ?? generateSectionId();

    const position: InvoicePosition = {
      id: generatePositionId(),
      description,
      quantity,
      unit: newPosition.unit || 'Stk.',
      unitPrice,
      total: Math.round(quantity * unitPrice * 100) / 100,
      taxRate,
      category: newPosition.category,
      sectionId,
      sectionTitle,
      sortOrder: positions.length
    };

    updatePositions(current => [...current, position]);

    setNewPosition(prev => ({
      ...prev,
      description: '',
      quantity: 1,
      unit: prev.unit || 'Stk.',
      unitPrice: 0,
      taxRate,
      sectionTitle
    }));
  };

  const handleRemovePosition = (positionId: string) => {
    updatePositions(current => current.filter(position => position.id !== positionId));
  };

  const handleRemoveSection = (sectionId: string) => {
    updatePositions(current => current.filter(position => position.sectionId !== sectionId));
  };

  const handleSectionTitleChange = (sectionId: string, title: string) => {
    const normalizedTitle = title.trim() || DEFAULT_SECTION_TITLE;
    updatePositions(current =>
      current.map(position =>
        position.sectionId === sectionId
          ? { ...position, sectionTitle: normalizedTitle }
          : position
      )
    );
  };
  const buildLineItemsForApi = (): InvoiceLineItemRequest[] => {
    if (!positions.length) {
      return [];
    }

    const sectionOrderMap = new Map<string, number>();
    sections.forEach((section, index) => {
      sectionOrderMap.set(section.sectionId, index);
    });

    return positions.map(position => {
      const payload: InvoiceLineItemRequest = {
        description: position.description,
        quantity: position.quantity,
        unit: position.unit,
        unitPrice: position.unitPrice,
        taxRate: position.taxRate,
        sectionId: position.sectionId,
        sectionTitle: position.sectionTitle,
        sortOrder: position.sortOrder
      };

      const metadata: Record<string, unknown> = {};

      if (position.sectionId || position.sectionTitle) {
        metadata.section = {
          id: position.sectionId,
          title: position.sectionTitle,
          sortOrder: sectionOrderMap.get(position.sectionId ?? '') ?? position.sortOrder
        };
      }

      if (position.category) {
        metadata.category = position.category;
      }

      if (Object.keys(metadata).length > 0) {
        payload.metadata = metadata;
      }

      return payload;
    });
  };

  const calculateTotals = () => {
    if (!positions.length) {
      return { subtotal: 0, taxAmount: 0, total: 0, taxBreakdown: [] };
    }
    return invoiceService.calculateInvoiceTotals(positions);
  };

  const handleGeneratePDF = async () => {
    if (!positions.length) {
      toast({
        title: 'Keine Positionen',
        description: 'Bitte fuegen Sie mindestens eine Position hinzu.',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    try {
      let latestRecord = persistedInvoice;

      if (
        USE_API &&
        invoiceData.projectId &&
        invoiceData.customerId &&
        invoiceData.date &&
        invoiceData.dueDate &&
        positions.length > 0 &&
        !persistedInvoice
      ) {
        try {
          const created = await createProjectInvoice(invoiceData.projectId, {
            customerId: invoiceData.customerId,
            issueDate: invoiceData.date,
            dueDate: invoiceData.dueDate,
            currency: 'EUR',
            lineItems: buildLineItemsForApi()
          });
          latestRecord = created;
          setPersistedInvoice(created);
          setInvoiceData(prev => ({
            ...prev,
            id: created.id,
            number: created.number,
            status: created.status as InvoiceData['status']
          }));
        } catch (error) {
          console.error('Failed to persist invoice:', error);
          toast({
            title: 'Rechnung konnte nicht gespeichert werden',
            description: 'Die Daten wurden nicht an den Server uebermittelt.',
            variant: 'destructive'
          });
        }
      } else if (USE_API && !invoiceData.projectId) {
        toast({
          title: 'Projekt erforderlich',
          description: 'Bitte verknuepfen Sie die Rechnung mit einem Projekt, um sie im Backend zu speichern.',
          variant: 'destructive'
        });
      }

      const totals = calculateTotals();
      const effectiveStatus = (latestRecord?.status as InvoiceData['status']) ?? (invoiceData.status as InvoiceData['status']);
      const effectiveNumber = latestRecord?.number ?? invoiceData.number!;
      const effectiveId = latestRecord?.id ?? invoiceData.id ?? Date.now().toString();

      const completeInvoiceData: InvoiceData = {
        id: effectiveId,
        number: effectiveNumber,
        date: invoiceData.date!,
        dueDate: invoiceData.dueDate!,
        customerId: invoiceData.customerId!,
        customerName: invoiceData.customerName!,
        customerAddress: invoiceData.customerAddress!,
        customerEmail: invoiceData.customerEmail,
        projectId: invoiceData.projectId,
        projectName: invoiceData.projectName,
        positions,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        total: totals.total,
        paymentTerms: invoiceData.paymentTerms!,
        notes: invoiceData.notes,
        status: effectiveStatus,
        createdBy: 'current-user',
        createdAt: new Date().toISOString()
      };

      const blob = await invoiceService.generateInvoicePDF(completeInvoiceData);
      setPdfBlob(blob);

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);

      setActiveTab('preview');

      toast({
        title: 'PDF erstellt',
        description: 'Die Rechnung wurde erfolgreich als PDF generiert.'
      });
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast({
        title: 'Fehler beim Erstellen',
        description: 'Das PDF konnte nicht erstellt werden.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!pdfBlob) {
      return;
    }

    const url = URL.createObjectURL(pdfBlob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Rechnung_${invoiceData.number}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleSendEmail = async () => {
    if (!pdfBlob || !invoiceData.customerEmail) {
      toast({
        title: 'E-Mail kann nicht gesendet werden',
        description: 'PDF oder E-Mail-Adresse fehlt.',
        variant: 'destructive'
      });
      return;
    }

    setIsSending(true);
    try {
      const totals = calculateTotals();
      const completeInvoiceData: InvoiceData = {
        ...invoiceData,
        id: invoiceData.id || Date.now().toString(),
        number: invoiceData.number!,
        customerId: invoiceData.customerId!,
        customerName: invoiceData.customerName!,
        customerAddress: invoiceData.customerAddress!,
        positions,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        total: totals.total,
        paymentTerms: invoiceData.paymentTerms!,
        status: 'sent',
        createdBy: 'current-user',
        createdAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        date: invoiceData.date!,
        dueDate: invoiceData.dueDate!
      } as InvoiceData;

      const success = await invoiceService.sendInvoiceEmail(completeInvoiceData, pdfBlob);

      if (success) {
        toast({
          title: 'E-Mail gesendet',
          description: `Die Rechnung wurde an ${invoiceData.customerEmail} gesendet.`
        });
        setInvoiceData(prev => ({ ...prev, status: 'sent' }));
      } else {
        throw new Error('Email sending failed');
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      toast({
        title: 'E-Mail Fehler',
        description: 'Die E-Mail konnte nicht gesendet werden.',
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
    }
  };

  const totals = calculateTotals();
  return (
    <MultiWindowDialog open={open} onOpenChange={onOpenChange} modal={false}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
        <DialogFrame
          title={
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Rechnung erstellen
            </span>
          }
          width="fit-content"
          minWidth={900}
          maxWidth={1600}
          preventOutsideClose={true}
          resizable={true}
          showFullscreenToggle
          headerActions={
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="positions">Positionen</TabsTrigger>
              <TabsTrigger value="preview">Vorschau</TabsTrigger>
            </TabsList>
          }
          footer={
            <div className="flex justify-between w-full">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Abbrechen
              </Button>
              {activeTab !== 'preview' && (
                <Button onClick={handleGeneratePDF} disabled={isGenerating || !positions.length}>
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4 mr-2" />
                  )}
                  PDF erstellen
                </Button>
              )}
            </div>
          }
        >
          <div className="flex-1 overflow-auto">
            <TabsContent value="details" className="space-y-6 mt-4">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Rechnungsdetails</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="number">Rechnungsnummer</Label>
                      <Input
                        id="number"
                        value={invoiceData.number || ''}
                        onChange={event =>
                          setInvoiceData(prev => ({ ...prev, number: event.target.value }))
                        }
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="date">Rechnungsdatum</Label>
                        <Input
                          id="date"
                          type="date"
                          value={invoiceData.date || ''}
                          onChange={event =>
                            setInvoiceData(prev => ({ ...prev, date: event.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dueDate">Faelligkeitsdatum</Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={invoiceData.dueDate || ''}
                          onChange={event =>
                            setInvoiceData(prev => ({ ...prev, dueDate: event.target.value }))
                          }
                        />
                      </div>
                    </div>
                    {projectData && (
                      <div className="space-y-2">
                        <Label>Projekt</Label>
                        <div className="p-2 bg-muted rounded-md">
                          <Badge variant="secondary">{projectData.name}</Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Kundendetails</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerName">Kundenname</Label>
                      <Input
                        id="customerName"
                        value={invoiceData.customerName || ''}
                        onChange={event =>
                          setInvoiceData(prev => ({ ...prev, customerName: event.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerAddress">Adresse</Label>
                      <Textarea
                        id="customerAddress"
                        rows={3}
                        value={invoiceData.customerAddress || ''}
                        onChange={event =>
                          setInvoiceData(prev => ({ ...prev, customerAddress: event.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerEmail">E-Mail</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={invoiceData.customerEmail || ''}
                        onChange={event =>
                          setInvoiceData(prev => ({ ...prev, customerEmail: event.target.value }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Zahlungsbedingungen und Anmerkungen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms">Zahlungsbedingungen</Label>
                    <Textarea
                      id="paymentTerms"
                      rows={2}
                      value={invoiceData.paymentTerms || ''}
                      onChange={event =>
                        setInvoiceData(prev => ({ ...prev, paymentTerms: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Anmerkungen (optional)</Label>
                    <Textarea
                      id="notes"
                      rows={3}
                      placeholder="Zusaetzliche Informationen..."
                      value={invoiceData.notes || ''}
                      onChange={event =>
                        setInvoiceData(prev => ({ ...prev, notes: event.target.value }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="positions" className="space-y-6 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Position hinzufuegen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
                    <div className="md:col-span-3 space-y-2">
                      <Label htmlFor="newSectionTitle">Abschnittstitel</Label>
                      <Input
                        id="newSectionTitle"
                        value={newPosition.sectionTitle ?? ''}
                        onChange={event =>
                          setNewPosition(prev => ({ ...prev, sectionTitle: event.target.value }))
                        }
                        placeholder="z.B. Rohbau, Innenausbau"
                      />
                    </div>
                    <div className="md:col-span-3 space-y-2">
                      <Label htmlFor="newDescription">Beschreibung</Label>
                      <Textarea
                        id="newDescription"
                        rows={2}
                        value={newPosition.description || ''}
                        onChange={event =>
                          setNewPosition(prev => ({ ...prev, description: event.target.value }))
                        }
                        placeholder="Beschreibung der Position"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="newQuantity">Menge</Label>
                      <Input
                        id="newQuantity"
                        type="number"
                        min="0"
                        step="0.01"
                        value={newPosition.quantity ?? 0}
                        onChange={event =>
                          setNewPosition(prev => ({
                            ...prev,
                            quantity: Number(event.target.value) || 0
                          }))
                        }
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="newUnit">Einheit</Label>
                      <Input
                        id="newUnit"
                        value={newPosition.unit || 'Stk.'}
                        onChange={event =>
                          setNewPosition(prev => ({ ...prev, unit: event.target.value }))
                        }
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="newUnitPrice">Einzelpreis (EUR)</Label>
                      <Input
                        id="newUnitPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={newPosition.unitPrice ?? 0}
                        onChange={event =>
                          setNewPosition(prev => ({
                            ...prev,
                            unitPrice: Number(event.target.value) || 0
                          }))
                        }
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="newTaxRate">MwSt. %</Label>
                      <Input
                        id="newTaxRate"
                        type="number"
                        min="0"
                        step="0.1"
                        value={newPosition.taxRate ?? 0}
                        onChange={event =>
                          setNewPosition(prev => ({
                            ...prev,
                            taxRate: Number(event.target.value) || 0
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button type="button" onClick={handleAddPosition}>
                      <Plus className="h-4 w-4 mr-2" />
                      Hinzufuegen
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Erfasste Positionen</CardTitle>
                </CardHeader>
                <CardContent>
                  {sections.length > 0 ? (
                    <div className="space-y-6">
                      {sections.map(section => (
                        <div
                          key={section.sectionId}
                          className="space-y-4 rounded-lg border border-border/60 p-4"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex-1 space-y-2">
                              <Label htmlFor={`invoice-section-${section.sectionId}`}>
                                Abschnittstitel
                              </Label>
                              <Input
                                id={`invoice-section-${section.sectionId}`}
                                value={section.title}
                                onChange={event =>
                                  handleSectionTitleChange(section.sectionId, event.target.value)
                                }
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveSection(section.sectionId)}
                                disabled={sections.length === 1}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Abschnitt entfernen
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {section.items.map(position => (
                              <div
                                key={position.id}
                                className="flex flex-col gap-3 rounded-lg border border-dashed border-border/60 bg-card/60 p-4 md:flex-row md:items-center md:justify-between"
                              >
                                <div className="flex-1">
                                  <div className="font-medium">{position.description}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {position.quantity} {position.unit} x EUR {position.unitPrice.toFixed(2)} = EUR {position.total.toFixed(2)}
                                  </div>
                                  {position.category ? (
                                    <div className="mt-1 text-xs uppercase text-muted-foreground">
                                      Kategorie: {position.category}
                                    </div>
                                  ) : null}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{position.taxRate}% MwSt</Badge>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemovePosition(position.id)}
                                    aria-label="Position entfernen"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Noch keine Positionen hinzugefuegt
                    </div>
                  )}
                </CardContent>
              </Card>

              {positions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Rechnungssumme
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Zwischensumme:</span>
                        <span>EUR {totals.subtotal.toFixed(2)}</span>
                      </div>
                      {totals.taxBreakdown.map((tax, index) => (
                        <div key={index} className="flex justify-between">
                          <span>MwSt. {tax.rate}%:</span>
                          <span>EUR {tax.amount.toFixed(2)}</span>
                        </div>
                      ))}
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Gesamtbetrag:</span>
                        <span>EUR {totals.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              {previewUrl ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">PDF Vorschau</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleDownloadPDF}>
                        <Download className="h-4 w-4 mr-2" />
                        PDF herunterladen
                      </Button>
                      {invoiceData.customerEmail && (
                        <Button onClick={handleSendEmail} disabled={isSending}>
                          {isSending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          Per E-Mail senden
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="border rounded-lg overflow-hidden h-[70vh] min-h-[480px]">
                    <iframe src={previewUrl} className="w-full h-full" title="Invoice Preview" />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Keine Vorschau verfuegbar. Bitte erstellen Sie zuerst das PDF.
                </div>
              )}
            </TabsContent>
          </div>
        </DialogFrame>
      </Tabs>
    </MultiWindowDialog>
  );
}














