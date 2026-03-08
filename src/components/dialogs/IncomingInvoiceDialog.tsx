import React, { useState, useEffect } from 'react';
import { MultiWindowDialog } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  ArrowLeft,
  Upload,
  Calendar,
  Euro,
  FileText,
  User,
  Hash,
  AlertCircle,
  Check,
  X
} from 'lucide-react';
import DocumentNumberingService from '../../services/documentNumberingService';
import IncomingInvoiceService from '../../services/incomingInvoiceService';
import { DraftService } from '../../services/draftService';
import { useToast } from '../../hooks/use-toast';
import { DialogFrame } from '../ui/dialog-frame';

interface IncomingInvoice {
  id: string;
  internalNumber: string; // Our internal ER- number
  supplierNumber?: string; // Supplier's invoice number
  supplierName: string;
  supplierAddress?: string;
  contactPerson?: string;
  amount: number;
  netAmount: number;
  taxAmount: number;
  taxRate: number;
  invoiceDate: string;
  dueDate: string;
  receivedDate: string;
  category: 'materials' | 'services' | 'subcontractor' | 'utilities' | 'office' | 'other';
  status: 'received' | 'verified' | 'approved' | 'paid' | 'disputed';
  projectId?: string;
  description: string;
  notes?: string;
  attachments: string[];
}

interface IncomingInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: IncomingInvoice;
  onSave?: (invoice: IncomingInvoice) => void;
}

export function IncomingInvoiceDialog({
  open,
  onOpenChange,
  invoice,
  onSave
}: IncomingInvoiceDialogProps) {
  const { toast } = useToast();
  const numberingService = DocumentNumberingService;
  const DRAFT_KEY = 'bauplan.draft.incomingInvoiceDialog';

  const [formData, setFormData] = useState<Partial<IncomingInvoice>>({
    internalNumber: '',
    supplierName: '',
    contactPerson: '',
    amount: 0,
    netAmount: 0,
    taxAmount: 0,
    taxRate: 19,
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    receivedDate: new Date().toISOString().split('T')[0],
    category: 'materials',
    status: 'received',
    description: '',
    attachments: []
  });
  const [history, setHistory] = useState<Partial<IncomingInvoice>[]>([]);
  const [redoStack, setRedoStack] = useState<Partial<IncomingInvoice>[]>([]);
  const [navigatingHistory, setNavigatingHistory] = useState(false);

  // Initialize form data when dialog opens (with draft restore)
  useEffect(() => {
    if (!open) return;
    if (invoice) {
      setFormData(invoice);
      setHistory([invoice]);
      return;
    }
    const draft = DraftService.load<IncomingInvoice>(DRAFT_KEY);
    if (draft) {
      setFormData(draft);
      setHistory([draft]);
      return;
    }
    // Generate new internal number for incoming invoice
    const newNumber = numberingService.generateNumber('incoming_invoice');
    const initial: Partial<IncomingInvoice> = {
      internalNumber: newNumber.number,
      id: Date.now().toString()
    };
    setFormData(prev => ({
      ...prev,
      ...initial
    }));
    // Initialize history with the initial snapshot
    setHistory([initial]);
  }, [open, invoice, numberingService, DRAFT_KEY]);

  // Autosave draft and snapshot history when formData changes
  useEffect(() => {
    DraftService.save(DRAFT_KEY, formData as IncomingInvoice);
    if (!navigatingHistory) {
      setHistory(prev => {
        const last = prev[prev.length - 1];
        const normalize = (s: Partial<IncomingInvoice>) => {
          const { taxAmount, amount, ...rest } = s;
          return rest;
        };
        if (last && JSON.stringify(normalize(last)) === JSON.stringify(normalize(formData))) return prev;
        const next = [...prev, formData];
        return next.length > 50 ? next.slice(next.length - 50) : next;
      });
      setRedoStack([]);
    }
  }, [formData, navigatingHistory]);

  // Keyboard undo/redo: Ctrl+Z / Ctrl+Y (Shift+Ctrl+Z)
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
          setNavigatingHistory(true);
          setFormData(prevSnapshot);
        }
      } else if (key === 'y' || (key === 'z' && e.shiftKey)) {
        if (redoStack.length > 0) {
          e.preventDefault();
          const nextSnapshot = redoStack[0]!;
          setRedoStack(rs => rs.slice(1));
          setHistory(h => [...h, nextSnapshot]);
          setNavigatingHistory(true);
          setFormData(nextSnapshot);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [history, redoStack]);

  // Reset navigation flag after formData changes due to undo/redo
  useEffect(() => {
    if (navigatingHistory) {
      setNavigatingHistory(false);
    }
  }, [formData, navigatingHistory]);

  // Calculate totals when amounts change
  useEffect(() => {
    const netAmount = formData.netAmount || 0;
    const taxRate = formData.taxRate || 19;
    const taxAmount = netAmount * (taxRate / 100);
    const totalAmount = netAmount + taxAmount;

    setFormData(prev => ({
      ...prev,
      taxAmount: Math.round(taxAmount * 100) / 100,
      amount: Math.round(totalAmount * 100) / 100
    }));
  }, [formData.netAmount, formData.taxRate]);

  const handleSave = () => {
    // Validation
    if (!formData.supplierName || !formData.description || !(formData.netAmount && formData.netAmount > 0)) {
      toast({
        title: 'Unvollständige Angaben',
        description: 'Bitte füllen Sie alle Pflichtfelder aus.',
        variant: 'destructive'
      });
      return;
    }

    try {
      let persisted: import('../../services/incomingInvoiceService').IncomingInvoice | null = null;

      // If editing existing and present in service, update; else create
      const existing = formData.id ? IncomingInvoiceService.getIncomingInvoiceById(formData.id) : null;

      const payload = {
        supplierName: formData.supplierName!,
        description: formData.description!,
        netAmount: formData.netAmount!,
        taxRate: formData.taxRate!,
        supplierNumber: formData.supplierNumber,
        supplierAddress: formData.supplierAddress,
        contactPerson: formData.contactPerson,
        invoiceDate: formData.invoiceDate,
        dueDate: formData.dueDate,
        receivedDate: formData.receivedDate,
        category: formData.category,
        projectId: formData.projectId,
        notes: formData.notes,
        attachments: formData.attachments,
        items: []
      };

      if (existing) {
        persisted = IncomingInvoiceService.updateIncomingInvoice(existing.id, payload);
      } else {
        persisted = IncomingInvoiceService.createIncomingInvoice(payload);
      }

      // Apply desired status using guardrails if it differs
      const desiredStatus = formData.status!;
      if (persisted && desiredStatus && persisted.status !== desiredStatus) {
        const pathByTarget: Record<string, import('../../services/incomingInvoiceService').IncomingInvoice['status'][]> = {
          verified: ['verified'],
          approved: ['verified', 'approved'],
          paid: ['verified', 'approved', 'paid'],
          disputed: ['disputed'],
          received: ['received']
        };
        const path = pathByTarget[desiredStatus] || [];
        for (const step of path) {
          if (persisted.status === step) continue;
          const updated = IncomingInvoiceService.updateIncomingInvoiceStatus(persisted.id, step);
          if (!updated) break;
          persisted = updated;
        }
      }

      // Fallback savedInvoice for onSave consumers
      const savedInvoice: IncomingInvoice = {
        id: persisted?.id ?? formData.id!,
        internalNumber: persisted?.internalNumber ?? formData.internalNumber!,
        supplierNumber: persisted?.supplierNumber ?? formData.supplierNumber,
        supplierName: persisted?.supplierName ?? formData.supplierName!,
        supplierAddress: persisted?.supplierAddress ?? formData.supplierAddress,
        contactPerson: persisted?.contactPerson ?? formData.contactPerson,
        amount: persisted?.amount ?? formData.amount!,
        netAmount: persisted?.netAmount ?? formData.netAmount!,
        taxAmount: persisted?.taxAmount ?? formData.taxAmount!,
        taxRate: persisted?.taxRate ?? formData.taxRate!,
        invoiceDate: persisted?.invoiceDate ?? formData.invoiceDate!,
        dueDate: persisted?.dueDate ?? formData.dueDate!,
        receivedDate: persisted?.receivedDate ?? formData.receivedDate!,
        category: persisted?.category ?? formData.category!,
        status: persisted?.status ?? formData.status!,
        projectId: persisted?.projectId ?? formData.projectId,
        description: persisted?.description ?? formData.description!,
        notes: persisted?.notes ?? formData.notes,
        attachments: persisted?.attachments ?? formData.attachments!
      };

      if (onSave) {
        onSave(savedInvoice);
      }

      toast({
        title: 'Eingangsrechnung gespeichert',
        description: `Rechnung ${savedInvoice.internalNumber} wurde erfolgreich gespeichert.`,
      });

      DraftService.clear(DRAFT_KEY);
      onOpenChange(false);
    } catch (err) {
      toast({
        title: 'Speichern fehlgeschlagen',
        description: (err as Error).message,
        variant: 'destructive'
      });
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      materials: 'Material & Bausto​ffe',
      services: 'Dienstleistungen',
      subcontractor: 'Subunternehmer',
      utilities: 'Nebenkosten',
      office: 'Büroausstattung',
      other: 'Sonstiges'
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      received: 'Eingegangen',
      verified: 'Geprüft',
      approved: 'Freigegeben',
      paid: 'Bezahlt',
      disputed: 'Strittig'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'secondary';
      case 'verified': return 'outline';
      case 'approved': return 'secondary';
      case 'paid': return 'default';
      case 'disputed': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <MultiWindowDialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogFrame
        title={
          <span className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5 text-purple-600" />
            {invoice ? 'Eingangsrechnung bearbeiten' : 'Neue Eingangsrechnung'}
          </span>
        }
        width="fit-content"
        minWidth={900}
        maxWidth={1600}
        preventOutsideClose={true}
        resizable={true}
        defaultFullscreen
        showFullscreenToggle
        footer={
          <div className="flex-shrink-0">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave}>
              <Check className="h-4 w-4 mr-2" />
              Speichern
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Invoice Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rechnungsdaten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="internalNumber">Interne Nummer *</Label>
                  <Input id="internalNumber" value={formData.internalNumber || ''} readOnly className="bg-gray-50 dark:bg-gray-800" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplierNumber">Lieferanten-Rechnungsnummer</Label>
                  <Input id="supplierNumber" value={formData.supplierNumber || ''} onChange={(e) => setFormData(prev => ({ ...prev, supplierNumber: e.target.value }))} placeholder="Rechnung Nr. des Lieferanten" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoiceDate">Rechnungsdatum *</Label>
                    <Input id="invoiceDate" type="date" value={formData.invoiceDate || ''} onChange={(e) => setFormData(prev => ({ ...prev, invoiceDate: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Fälligkeitsdatum</Label>
                    <Input id="dueDate" type="date" value={formData.dueDate || ''} onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receivedDate">Eingangsdatum</Label>
                  <Input id="receivedDate" type="date" value={formData.receivedDate || ''} onChange={(e) => setFormData(prev => ({ ...prev, receivedDate: e.target.value }))} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lieferantendaten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplierName">Lieferant / Firma *</Label>
                  <Input id="supplierName" value={formData.supplierName || ''} onChange={(e) => setFormData(prev => ({ ...prev, supplierName: e.target.value }))} placeholder="Name des Lieferanten" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Ansprechpartner</Label>
                  <Input id="contactPerson" value={formData.contactPerson || ''} onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))} placeholder="Name des Ansprechpartners" />
                </div>
              </div>
                <div className="space-y-2">
                  <Label htmlFor="supplierAddress">Adresse</Label>
                  <Textarea id="supplierAddress" value={formData.supplierAddress || ''} onChange={(e) => setFormData(prev => ({ ...prev, supplierAddress: e.target.value }))} placeholder="Vollständige Adresse des Lieferanten" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Kategorie</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as IncomingInvoice['category'] }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="materials">Material & Baustoffe</SelectItem>
                        <SelectItem value="services">Dienstleistungen</SelectItem>
                        <SelectItem value="subcontractor">Subunternehmer</SelectItem>
                        <SelectItem value="utilities">Nebenkosten</SelectItem>
                        <SelectItem value="office">Büroausstattung</SelectItem>
                        <SelectItem value="other">Sonstiges</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => {
                      const from = formData.status as IncomingInvoice['status'];
                      const to = value as IncomingInvoice['status'];
                      const allowed: Record<IncomingInvoice['status'], IncomingInvoice['status'][]> = {
                        received: ['verified', 'disputed'],
                        verified: ['approved', 'disputed'],
                        approved: ['paid', 'disputed'],
                        paid: [],
                        disputed: ['verified', 'approved']
                      };
                      const isAllowed = from ? (allowed[from] || []).includes(to) || from === to : true;
                      if (!isAllowed || (to === 'paid' && from === 'disputed')) {
                        toast({
                          title: 'Ungültiger Statuswechsel',
                          description: `Von "${from}" nach "${to}" ist nicht erlaubt.`,
                          variant: 'destructive'
                        });
                        return;
                      }
                      setFormData(prev => ({ ...prev, status: to }));
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="received">Eingegangen</SelectItem>
                        <SelectItem value="verified">Geprüft</SelectItem>
                        <SelectItem value="approved">Freigegeben</SelectItem>
                        <SelectItem value="paid">Bezahlt</SelectItem>
                        <SelectItem value="disputed">Strittig</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Amount Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Betrag und Steuern</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="netAmount">Nettobetrag (€) *</Label>
                  <Input id="netAmount" type="number" step="0.01" value={formData.netAmount || ''} onChange={(e) => setFormData(prev => ({ ...prev, netAmount: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxRate">MwSt. Satz (%)</Label>
                  <Select value={formData.taxRate?.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, taxRate: parseFloat(value) }))}>
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
                <div className="space-y-2">
                  <Label htmlFor="taxAmount">MwSt. Betrag (€)</Label>
                  <Input id="taxAmount" type="number" step="0.01" value={formData.taxAmount?.toFixed(2) || '0.00'} readOnly className="bg-gray-50 dark:bg-gray-800" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Gesamtbetrag (€)</Label>
                  <Input id="amount" type="number" step="0.01" value={formData.amount?.toFixed(2) || '0.00'} readOnly className="bg-gray-50 dark:bg-gray-800 font-semibold" />
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Description and Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Beschreibung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Leistungsbeschreibung *</Label>
                  <Textarea id="description" value={formData.description || ''} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Beschreibung der erbrachten Leistung oder gelieferten Waren" rows={4} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectId">Zugeordnetes Projekt</Label>
                  <Select value={formData.projectId || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value || undefined }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Projekt auswählen (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRJ-2024-001">Wohnhaus Familie Müller</SelectItem>
                      <SelectItem value="PRJ-2024-002">Bürogebäude TechCorp</SelectItem>
                      <SelectItem value="PRJ-2024-003">Dachsanierung Hamburg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Zusätzliche Informationen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Interne Notizen</Label>
                  <Textarea id="notes" value={formData.notes || ''} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} placeholder="Interne Notizen zur Rechnung" rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Anhänge</Label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Rechnung oder Belege hier hochladen</p>
                    <Button variant="outline" size="sm" className="mt-2">Dateien auswählen</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Summary */}
          <Card className="bg-gray-50 dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-base">Zusammenfassung</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Interne Nummer:</span>
                  <div className="font-mono font-medium">{formData.internalNumber}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Lieferant:</span>
                  <div className="font-medium">{formData.supplierName || '-'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Kategorie:</span>
                  <div>
                    <Badge variant="outline">{getCategoryLabel(formData.category || '')}</Badge>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <div>
                    <Badge variant={getStatusColor(formData.status || '')}>{getStatusLabel(formData.status || '')}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogFrame>
    </MultiWindowDialog>
  );
}
