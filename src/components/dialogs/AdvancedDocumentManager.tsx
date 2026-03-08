import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Upload, Search, Filter, FileText, Image,
  Eye, Download, Star, Trash2, Tag, Calendar,
  Loader2, CheckCircle
} from 'lucide-react';
import AdvancedDocumentService, {
  DocumentMetadata,
  DocumentSearchFilters,
  DocumentCategory,
  DocumentType
} from '../../services/advancedDocumentService';
import ProcurementService from '@/services/procurementService';
import { parseISO } from 'date-fns';
import { useToast } from '../../hooks/use-toast';
import { MultiWindowDialog } from '@/components/ui/dialog';
import { ProjectTemplateService } from '@/services/projectTemplateService';
import { useNavigate } from 'react-router-dom';
import { DialogFrame } from '../ui/dialog-frame';

interface AdvancedDocumentManagerProps {
  projectId?: string;
  customerId?: string;
  workflowType?: 'angebot' | 'bestellung' | 'lieferschein' | 'rechnung';
  workflowId?: string;
  counterpartyType?: 'kunde' | 'lieferant';
  counterpartyId?: string;
}

export function AdvancedDocumentManager({
  projectId,
  customerId,
  workflowType,
  workflowId,
  counterpartyType,
  counterpartyId
}: AdvancedDocumentManagerProps) {
  const { toast } = useToast();
  const documentService = AdvancedDocumentService;
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | ''>('');
  const [selectedWorkflowType, setSelectedWorkflowType] = useState<'' | 'angebot' | 'bestellung' | 'lieferschein' | 'rechnung'>(() => workflowType ?? '');
  const [selectedCounterpartyType, setSelectedCounterpartyType] = useState<'' | 'kunde' | 'lieferant'>(() => counterpartyType ?? '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [sendToProcurement, setSendToProcurement] = useState(true);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignDoc, setAssignDoc] = useState<DocumentMetadata | null>(null);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const categories: { value: DocumentCategory | ''; label: string }[] = [
    { value: '', label: 'Alle Kategorien' },
    { value: 'contracts', label: 'Vertraege' },
    { value: 'invoices', label: 'Rechnungen' },
    { value: 'quotes', label: 'Angebote' },
    { value: 'plans', label: 'Plaene' },
    { value: 'photos', label: 'Fotos' },
    { value: 'reports', label: 'Berichte' },
    { value: 'permits', label: 'Genehmigungen' },
    { value: 'certificates', label: 'Zertifikate' }
  ];

  useEffect(() => {
    setSelectedWorkflowType(workflowType ?? '');
  }, [workflowType]);

  useEffect(() => {
    setSelectedCounterpartyType(counterpartyType ?? '');
  }, [counterpartyType]);

  const loadDocuments = useCallback(() => {
    const filters: DocumentSearchFilters = {};
    if (projectId) filters.projectId = projectId;
    if (customerId) filters.customerId = customerId;
    if (selectedCategory) filters.category = selectedCategory;
    if (selectedWorkflowType || workflowType) filters.workflowType = selectedWorkflowType || workflowType;
    if (selectedCounterpartyType || counterpartyType) filters.counterpartyType = selectedCounterpartyType || counterpartyType;
    if (workflowId) filters.workflowId = workflowId;
    if (counterpartyId) filters.counterpartyId = counterpartyId;

    const results = documentService.searchDocuments(searchQuery, filters, 100);
    setDocuments(results);
  }, [searchQuery, selectedCategory, selectedWorkflowType, selectedCounterpartyType, workflowType, workflowId, counterpartyType, counterpartyId, projectId, customerId, documentService]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const loadProjects = useCallback(() => {
    try {
      const list = ProjectTemplateService.getAllProjects();
      setProjects(list.map(p => ({ id: p.id, name: p.name })));
    } catch {
      setProjects([]);
    }
  }, []);

  const linkDocumentToProcurement = (document: DocumentMetadata, options: { projectId?: string; supplierId?: string; supplierName?: string }) => {
    if (!sendToProcurement || !options.projectId) return;

    const supplierId = options.supplierId || 'unknown';
    const supplierName = options.supplierName || document.autoDetectedInfo?.containsNames?.[0] || 'Unbekannter Lieferant';
    const documentNumber = document.autoDetectedInfo?.documentNumber || document.name;
    const etaCandidate = document.autoDetectedInfo?.containsDates?.[0] || document.uploadDate;
    const eta = (() => {
      try {
        return parseISO(etaCandidate);
      } catch {
        return new Date();
      }
    })().toISOString();

    try {
      const existing = ProcurementService.getPurchaseOrders().find((po) => {
        const matchesProject = po.projectId === options.projectId;
        const matchesSupplier = po.supplierId === supplierId || po.supplierName === supplierName;
        const matchesNumber = po.orderNumber === documentNumber || po.notes?.includes(documentNumber ?? '');
        return matchesProject && matchesSupplier && matchesNumber;
      });

      if (existing) {
        return;
      }

      const inventory = ProcurementService.getInventory();
      const fallbackItem = inventory[0];
      if (!fallbackItem) return;

      ProcurementService.createPurchaseOrder({
        supplierId,
        supplierName,
        projectId: options.projectId,
        projectName: document.projectName || options.projectId,
        requestedBy: 'current-user',
        expectedDelivery: eta,
        priority: 'medium',
        notes: `Automatisch aus Dokument ${document.name} (${documentNumber})`,
        lines: [
          {
            inventoryId: fallbackItem.id,
            quantity: 1,
            unitPrice: fallbackItem.unitPrice,
            requiredDate: eta,
            requestedBy: 'current-user',
            targetProjectId: options.projectId,
            targetProjectName: document.projectName || options.projectId,
          },
        ],
      });

      toast({
        title: 'Beschaffung vorbereitet',
        description: 'Bestellung automatisch im Beschaffungsmodul angelegt.',
      });
    } catch (err) {
      console.warn('Procurement auto-link failed', err);
    }
  };

  const stats = useMemo(() => {
    const totalSize = documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0);
    const starred = documents.filter(doc => doc.isStarred).length;
    const withProjects = documents.filter(doc => doc.projectId).length;
    const lastUpload = documents
      .slice()
      .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())[0];

    const categoryCounts = documents.reduce<Record<string, number>>((acc, doc) => {
      acc[doc.category] = (acc[doc.category] || 0) + 1;
      return acc;
    }, {});

    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    return {
      total: documents.length,
      totalSize,
      starred,
      withProjects,
      lastUpload,
      topCategory
    };
  }, [documents]);

  const quickFilters: { label: string; category: DocumentCategory }[] = [
    { label: 'Rechnungen', category: 'invoices' },
    { label: 'Vertraege', category: 'contracts' },
    { label: 'Plaene', category: 'plans' },
  ];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress((i / files.length) * 100);

        const effectiveWorkflowType = workflowType ?? (selectedWorkflowType || undefined);
        const effectiveCounterpartyType = counterpartyType ?? (selectedCounterpartyType || undefined);

        const document = await documentService.uploadDocument(
          file,
          {
            uploadedBy: 'current-user',
            workflowType: effectiveWorkflowType,
            workflowId,
            counterpartyType: effectiveCounterpartyType,
            counterpartyId
          },
          {
            projectId,
            customerId,
            workflowType: effectiveWorkflowType,
            workflowId,
            counterpartyType: effectiveCounterpartyType,
            counterpartyId,
            performOCR: true,
            autoDetectCategory: true
          }
        );

        toast({
          title: 'Dokument hochgeladen',
          description: `${document.name} wurde erfolgreich verarbeitet.`,
        });

        if (sendToProcurement && projectId && effectiveCounterpartyType === 'lieferant') {
          linkDocumentToProcurement(document, {
            projectId,
            supplierId: counterpartyId,
            supplierName: document.autoDetectedInfo?.containsNames?.[0],
          });
        }
      }

      setUploadProgress(100);
      loadDocuments();
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: 'Upload fehlgeschlagen',
        description: 'Das Dokument konnte nicht hochgeladen werden.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      event.target.value = '';
    }
  };

  const getTypeIcon = (type: DocumentType) => {
    switch (type) {
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: DocumentCategory) => {
    const colors: Record<DocumentCategory, string> = {
      contracts: 'bg-blue-100 text-blue-800',
      invoices: 'bg-green-100 text-green-800',
      quotes: 'bg-yellow-100 text-yellow-800',
      plans: 'bg-purple-100 text-purple-800',
      photos: 'bg-pink-100 text-pink-800',
      reports: 'bg-gray-100 text-gray-800',
      permits: 'bg-red-100 text-red-800',
      certificates: 'bg-indigo-100 text-indigo-800',
      correspondence: 'bg-orange-100 text-orange-800',
      specifications: 'bg-teal-100 text-teal-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.other;
  };

  const handleView = (doc: DocumentMetadata) => {
    try {
      const win = window.open('', '_blank', 'noopener,noreferrer');
      if (win) {
        win.location.href = doc.filePath;
      } else {
        const a = document.createElement('a');
        a.href = doc.filePath;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (e) {
      toast({ title: 'Vorschau fehlgeschlagen', variant: 'destructive' });
    }
  };

  const handleDownload = (doc: DocumentMetadata) => {
    try {
      const link = document.createElement('a');
      link.href = doc.filePath;
      link.download = doc.originalName || doc.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      toast({ title: 'Download fehlgeschlagen', variant: 'destructive' });
    }
  };

  const handleDelete = (doc: DocumentMetadata) => {
    const ok = documentService.deleteDocument(doc.id);
    if (ok) {
      toast({ title: 'Dokument geloescht', description: doc.name });
      loadDocuments();
    } else {
      toast({ title: 'Loeschen fehlgeschlagen', variant: 'destructive' });
    }
  };

  const handleAssignToProject = (doc: DocumentMetadata) => {
    if (projectId) {
      const updated = documentService.updateDocument(doc.id, { projectId });
      if (updated) {
        toast({ title: 'Projektzuordnung aktualisiert', description: `${doc.name} -> Projekt ${projectId}` });
        loadDocuments();
      }
      return;
    }
    setAssignDoc(doc);
    loadProjects();
    setSelectedProjectId('');
    setAssignOpen(true);
  };

  const confirmAssign = () => {
    if (!assignDoc || !selectedProjectId) return;
    const updated = documentService.updateDocument(assignDoc.id, { projectId: selectedProjectId });
    if (updated) {
      toast({ title: 'Projektzuordnung aktualisiert', description: `${assignDoc.name} -> Projekt ${selectedProjectId}` });
      setAssignOpen(false);
      setAssignDoc(null);
      loadDocuments();
    } else {
      toast({ title: 'Zuordnung fehlgeschlagen', variant: 'destructive' });
    }
  };

  const activeFilterCount = useMemo(() => {
    return [
      searchQuery.trim(),
      selectedCategory,
      selectedWorkflowType,
      selectedCounterpartyType
    ].filter(Boolean).length;
  }, [searchQuery, selectedCategory, selectedWorkflowType, selectedCounterpartyType]);

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-primary/15 shadow-lg">
        <CardContent className="py-6">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 pointer-events-none" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <Badge variant="secondary" className="w-fit">Neues Dokumenten Hub Layout</Badge>
              <div>
                <h2 className="text-2xl font-semibold leading-tight">Dokumente zentral verwalten</h2>
                <p className="text-sm text-muted-foreground">
                  Upload, OCR, Workflow-Kontext und Zuordnung laufen jetzt in einem fokussierten Arbeitsbereich zusammen.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline" className="gap-1">
                  <FileText className="h-3 w-3" />
                  {stats.total} Dokumente
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Star className="h-3 w-3" />
                  {stats.starred} Favoriten
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Tag className="h-3 w-3" />
                  {stats.withProjects} mit Projektbezug
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Calendar className="h-3 w-3" />
                  {stats.lastUpload ? `Aktualisiert ${new Date(stats.lastUpload.uploadDate).toLocaleDateString('de-DE')}` : 'Keine Uploads'}
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-start lg:justify-end">
              {quickFilters.map(({ label, category }) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(prev => prev === category ? '' : category)}
                >
                  <Filter className="h-3 w-3 mr-1" />
                  {label}
                </Button>
              ))}
              <Button size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Schnell hochladen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Suche und Smart-Filter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Textsuche, Projekt, Kunde oder Dateiname"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as DocumentCategory | '')}
                  className="px-3 py-2 border rounded-md bg-background"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedWorkflowType}
                  onChange={(e) => setSelectedWorkflowType(e.target.value as '' | 'angebot' | 'bestellung' | 'lieferschein' | 'rechnung')}
                  className="px-3 py-2 border rounded-md bg-background"
                >
                  <option value="">Alle Schritte</option>
                  <option value="angebot">Angebot</option>
                  <option value="bestellung">Bestellung</option>
                  <option value="lieferschein">Lieferschein</option>
                  <option value="rechnung">Rechnung</option>
                </select>
                <select
                  value={selectedCounterpartyType}
                  onChange={(e) => setSelectedCounterpartyType(e.target.value as '' | 'kunde' | 'lieferant')}
                  className="px-3 py-2 border rounded-md bg-background"
                >
                  <option value="">Alle Gegenparteien</option>
                  <option value="kunde">Kunde</option>
                  <option value="lieferant">Lieferant</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedCategory('')}>
                Filter zuruecksetzen
              </Button>
              {stats.topCategory && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Meistgenutzt: {categories.find(c => c.value === stats.topCategory)?.label ?? stats.topCategory}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload & OCR
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.xlsm"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-muted-foreground/30 rounded-lg p-5 text-center hover:border-primary/50 transition-colors"
            >
              {isUploading ? (
                <div className="space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  <div className="text-sm text-muted-foreground">
                    Dokumente werden verarbeitet... {Math.round(uploadProgress)}%
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <div className="text-sm text-muted-foreground">
                    Dateien hier ablegen oder klicken zum Auswaehlen
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Unterstuetzte Formate: PDF, JPG, PNG, DOC, XLS (inkl. OCR & automatische Kategorisierung)
                  </div>
                </div>
              )}
            </button>
            <div className="flex items-center gap-2 text-xs">
              <input
                id="send-to-procurement"
                type="checkbox"
                checked={sendToProcurement}
                onChange={(e) => setSendToProcurement(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <label htmlFor="send-to-procurement" className="text-muted-foreground">
                Automatisch in Beschaffung als Bestellung vormerken (Projekt + Lieferant).
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-muted/60 px-3 py-2">
                <div className="text-muted-foreground">Gesamtgroesse</div>
                <div className="font-medium">{(stats.totalSize / 1024 / 1024).toFixed(1)} MB</div>
              </div>
              <div className="rounded-lg bg-muted/60 px-3 py-2">
                <div className="text-muted-foreground">Letzter Upload</div>
                <div className="font-medium">
                  {stats.lastUpload ? new Date(stats.lastUpload.uploadDate).toLocaleDateString('de-DE') : 'Noch keiner'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {documents.length > 0 ? (
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'grid' | 'list')} className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <TabsList className="h-12 bg-muted/60">
              <TabsTrigger value="grid" className="px-4">Kachelansicht</TabsTrigger>
              <TabsTrigger value="list" className="px-4">Listenansicht</TabsTrigger>
            </TabsList>
            <div className="flex gap-2 text-sm text-muted-foreground">
              <span>Aktive Filter: {activeFilterCount}</span>
            </div>
          </div>

          <TabsContent value="grid">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <Card key={doc.id} className="hover:-translate-y-[1px] hover:shadow-md transition">
                  <CardHeader className="pb-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {getTypeIcon(doc.type)}
                        <div className="font-medium text-sm truncate">{doc.name}</div>
                      </div>
                      {doc.isStarred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      <Badge variant="outline" className={getCategoryColor(doc.category)}>
                        {categories.find(c => c.value === doc.category)?.label || doc.category}
                      </Badge>
                      {doc.projectId && (
                        <Badge variant="secondary" className="text-xs">
                          Projekt {doc.projectId}
                        </Badge>
                      )}
                      {doc.ocrConfidence && (
                        <Badge variant="outline" className="text-xs">
                          OCR {Math.round(doc.ocrConfidence * 100)}%
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Groesse: {(doc.fileSize / 1024).toFixed(1)} KB</div>
                      <div>Upload: {new Date(doc.uploadDate).toLocaleDateString('de-DE')}</div>
                      {doc.extractedText && (
                        <div className="bg-muted p-2 rounded text-xs">
                          {doc.extractedText.substring(0, 100)}...
                        </div>
                      )}
                    </div>
                    
                    {doc.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {doc.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {doc.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{doc.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="outline" className="flex-1 min-w-[110px]" onClick={() => handleView(doc)}>
                        <Eye className="h-3 w-3 mr-1" />
                        Ansehen
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDownload(doc)}>
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleAssignToProject(doc)}>
                        Projekt
                      </Button>
                      {doc.projectId && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate('/projects', { state: { openProjectId: doc.projectId } })}
                        >
                          Im Projekt oeffnen
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleDelete(doc)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="list">
            <Card>
              <CardContent className="p-0 divide-y">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="rounded-md bg-muted p-2 h-10 w-10 flex items-center justify-center">
                        {getTypeIcon(doc.type)}
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium truncate">{doc.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {categories.find(c => c.value === doc.category)?.label || doc.category}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
                          <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                          <span>{new Date(doc.uploadDate).toLocaleDateString('de-DE')}</span>
                          {doc.projectId && <span>Projekt {doc.projectId}</span>}
                          {doc.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-[10px]">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleView(doc)}>
                        <Eye className="h-3 w-3 mr-1" /> Oeffnen
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDownload(doc)}>
                        <Download className="h-3 w-3 mr-1" /> Download
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleAssignToProject(doc)}>
                        Projekt
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(doc)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <div className="text-lg font-medium mb-2">Keine Dokumente gefunden</div>
            <div className="text-muted-foreground">
              {searchQuery || selectedCategory 
                ? 'Versuchen Sie andere Suchbegriffe oder Filter'
                : 'Laden Sie Ihr erstes Dokument hoch'}
            </div>
          </CardContent>
        </Card>
      )}

      <MultiWindowDialog open={assignOpen} onOpenChange={setAssignOpen} modal={false}>
        <DialogFrame
          title="Dokument einem Projekt zuordnen"
          defaultFullscreen
          showFullscreenToggle
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAssignOpen(false)}>Abbrechen</Button>
              <Button onClick={confirmAssign} disabled={!selectedProjectId}>Zuordnen</Button>
            </div>
          }
        >
          <div className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="assign-project" className="text-sm">Projekt auswaehlen</label>
              <select
                id="assign-project"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                <option value="">Bitte auswaehlen</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                ))}
              </select>
            </div>
          </div>
        </DialogFrame>
      </MultiWindowDialog>
    </div>
  );
}
