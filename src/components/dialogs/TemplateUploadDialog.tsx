import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MultiWindowDialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { DialogFrame } from '@/components/ui/dialog-frame';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  FileText,
  FileUp,
  Info,
  Trash2,
  UploadCloud
} from 'lucide-react';
import documentVersioningService, {
  DocumentTemplate
} from '@/services/documentVersioningService';
import templateUploadService, {
  TemplateUploadSummary,
  TemplateUploadStatus,
  UploadedTemplate
} from '@/services/templateUploadService';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

interface TemplateUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${bytes} B`;
};

const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
};

const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result ?? '').toString());
    reader.onerror = () => reject(reader.error ?? new Error('Datei konnte nicht gelesen werden.'));
    reader.readAsDataURL(file);
  });
};

const TemplateUploadDialog: React.FC<TemplateUploadDialogProps> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const [uploads, setUploads] = useState<UploadedTemplate[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [uploader, setUploader] = useState<string>('System');
  const [notes, setNotes] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'uploads' | 'library'>('uploads');

  const refreshState = useCallback(() => {
    setUploads(templateUploadService.getUploads());
    setTemplates(documentVersioningService.getDocumentTemplates());
  }, []);

  useEffect(() => {
    if (open) {
      refreshState();
    }
  }, [open, refreshState]);

  const { uploadSummary, activeUploads, archivedUploads } = useMemo(() => {
    const active = uploads.filter((upload) => upload.status !== 'archived');
    const archived = uploads.filter((upload) => upload.status === 'archived');

    return {
      uploadSummary: {
        total: uploads.length,
        active: active.length,
        archived: archived.length,
        latestUploadDate: uploads[0]?.uploadedAt
      } as TemplateUploadSummary,
      activeUploads: active,
      archivedUploads: archived
    };
  }, [uploads]);

  const uploadsByTemplate = useMemo(() => {
    return uploads.reduce<Record<string, UploadedTemplate[]>>((acc, upload) => {
      if (!acc[upload.templateId]) {
        acc[upload.templateId] = [];
      }
      acc[upload.templateId].push(upload);
      return acc;
    }, {});
  }, [uploads]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Validate by selected template allowed types (if selected)
    const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
    if (selectedTemplate) {
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      if (!selectedTemplate.allowedFileTypes.map((t) => t.toLowerCase()).includes(ext)) {
        toast({
          title: 'Dateityp nicht erlaubt',
          description: `Diese Vorlage erlaubt nur: ${selectedTemplate.allowedFileTypes.join(', ')}`,
          variant: 'destructive'
        });
        event.target.value = '';
        setSelectedFile(null);
        return;
      }
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'Datei zu gross',
        description: `Die Datei ueberschreitet die maximal erlaubte Groesse von ${formatFileSize(MAX_FILE_SIZE)}.`,
        variant: 'destructive'
      });
      event.target.value = '';
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleStatusToggle = (upload: UploadedTemplate, nextStatus: TemplateUploadStatus) => {
    templateUploadService.updateUpload({
      id: upload.id,
      status: nextStatus
    });
    setUploads(templateUploadService.getUploads());
    toast({
      title: 'Vorlage aktualisiert',
      description: `Status wurde auf "${nextStatus}" gesetzt.`
    });
  };

  const handleRemoveUpload = (uploadId: string) => {
    const removed = templateUploadService.removeUpload(uploadId);
    if (removed) {
      setUploads(templateUploadService.getUploads());
      toast({
        title: 'Vorlage entfernt',
        description: 'Die Vorlage wurde aus dem Upload-Archiv geloescht.'
      });
    }
  };

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedTemplateId) {
      toast({
        title: 'Vorlage auswaehlen',
        description: 'Bitte waehlen Sie eine Dokumentvorlage aus.',
        variant: 'destructive'
      });
      return;
    }

    if (!selectedFile) {
      toast({
        title: 'Datei auswaehlen',
        description: 'Bitte waehlen Sie eine Datei zum Hochladen aus.',
        variant: 'destructive'
      });
      return;
    }

    const template = templates.find((entry) => entry.id === selectedTemplateId);
    if (!template) {
      toast({
        title: 'Unbekannte Vorlage',
        description: 'Die ausgewaehlte Vorlage wurde nicht gefunden.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsUploading(true);
      const dataUrl = await readFileAsDataUrl(selectedFile);

      templateUploadService.addUpload({
        templateId: template.id,
        templateName: template.name,
        filename: selectedFile.name,
        mimeType: selectedFile.type || 'application/octet-stream',
        size: selectedFile.size,
        uploadedBy: uploader || 'System',
        notes: notes.trim() || undefined,
        dataUrl
      });

      setUploads(templateUploadService.getUploads());
      setSelectedFile(null);
      setNotes('');
      setUploader('System');
      toast({
        title: 'Vorlage hochgeladen',
        description: `${selectedFile.name} wurde fuer ${template.name} gespeichert.`
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Upload fehlgeschlagen',
        description: 'Der Upload konnte nicht abgeschlossen werden.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <MultiWindowDialog open={open} onOpenChange={onOpenChange} modal={false}>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'uploads' | 'library')}>
        <DialogFrame
          title="Vorlagenverwaltung"
          description="Laden Sie neue Dokumentvorlagen hoch und behalten Sie den Überblick über bereitgestellte Dateien."
          defaultFullscreen
          showFullscreenToggle
          headerActions={
            <TabsList className="mb-4 grid grid-cols-2">
              <TabsTrigger value="uploads">
                Uploads
                <Badge variant="secondary" className="ml-2">{uploadSummary.total}</Badge>
              </TabsTrigger>
              <TabsTrigger value="library">
                Vorlagenbibliothek
                <Badge variant="secondary" className="ml-2">{templates.length}</Badge>
              </TabsTrigger>
            </TabsList>
          }

        >
          <TabsContent value="uploads" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Neue Vorlage hochladen</CardTitle>
                <CardDescription>Unterstützte Dateitypen laut Vorlagenkonfiguration.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="grid gap-4 md:grid-cols-2" onSubmit={handleUpload}>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="template-select">Dokumentvorlage</Label>
                      <select
                        id="template-select"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={selectedTemplateId}
                        onChange={(event) => setSelectedTemplateId(event.target.value)}
                      >
                        <option value="">Vorlage auswaehlen</option>
                        {templates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name} ({template.category})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="template-file">Datei</Label>
                      <div className="flex items-center gap-2">
                        <Input id="template-file" type="file" accept={selectedTemplateId ? (templates.find(t => t.id === selectedTemplateId)?.allowedFileTypes.map(ft => `.${ft}`).join(',') ?? '') : '.pdf,.doc,.docx,.html,.htm,.zip,.png,.jpg,.dwg,.dxf'} onChange={handleFileChange} />
                        {selectedFile && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {formatFileSize(selectedFile.size)}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="uploader">Verantwortlich</Label>
                      <Input
                        id="uploader"
                        value={uploader}
                        onChange={(event) => setUploader(event.target.value)}
                        placeholder="Name oder Team"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="notes">Bemerkungen</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        placeholder="Hinweise fuer das Team"
                        rows={4}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col justify-between space-y-4 rounded-md border p-4 text-sm">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Info className="h-4 w-4" />
                        <span>Maximale Dateigroesse: {formatFileSize(MAX_FILE_SIZE)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>{uploadSummary.active} aktive Uploads verfuegbar</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        <span>{uploadSummary.archived} archivierte Versionen vorhanden</span>
                      </div>
                    </div>
                    <div className="mt-auto space-y-2">
                      <Button type="submit" disabled={isUploading} className="w-full">
                        <UploadCloud className="mr-2 h-4 w-4" /> Vorlagendatei hochladen
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Nach dem Hochladen steht die Vorlage fuer neue Dokumente bereit.
                      </p>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Aktive Vorlagen</CardTitle>
                <CardDescription>Zuletzt aktualisierte Vorlagen nach Dokumenttyp.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeUploads.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-10 text-sm text-muted-foreground">
                    <FileUp className="h-6 w-6" />
                    <p>Noch keine Vorlagen hochgeladen.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vorlage</TableHead>
                          <TableHead>Datei</TableHead>
                          <TableHead>Version</TableHead>
                          <TableHead>Groesse</TableHead>
                          <TableHead>Hochgeladen am</TableHead>
                          <TableHead>Von</TableHead>
                          <TableHead className="text-right">Aktionen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeUploads.map((upload) => (
                          <TableRow key={upload.id}>
                            <TableCell className="font-medium">{upload.templateName}</TableCell>
                            <TableCell>{upload.filename}</TableCell>
                            <TableCell>v{upload.version}</TableCell>
                            <TableCell>{formatFileSize(upload.size)}</TableCell>
                            <TableCell>{formatDate(upload.uploadedAt)}</TableCell>
                            <TableCell>{upload.uploadedBy}</TableCell>
                            <TableCell className="flex justify-end gap-2">
                              <Switch
                                checked={upload.status === 'active'}
                                onCheckedChange={(checked) =>
                                  handleStatusToggle(upload, checked ? 'active' : 'draft')
                                }
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleStatusToggle(upload, 'archived')}
                                title="Archivieren"
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleRemoveUpload(upload.id)}
                                title="Loeschen"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {archivedUploads.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Archivierte Vorlagen</CardTitle>
                  <CardDescription>Historische Versionen zur Referenz.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  {archivedUploads.map((upload) => (
                    <div key={upload.id} className="flex items-center justify-between rounded-md border p-2">
                      <div>
                        <p className="font-medium">{upload.templateName}</p>
                        <p className="text-xs">v{upload.version} - {upload.filename}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Archiviert</Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStatusToggle(upload, 'active')}
                        >
                          Reaktivieren
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="library" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Systemvorlagen</CardTitle>
                <CardDescription>Alle vorhandenen Dokumenttypen und ihre Anforderungen.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {templates.map((template) => {
                  const templateUploads = uploadsByTemplate[template.id] ?? [];
                  const lastUpload = templateUploads[0];

                  return (
                    <Card key={template.id} className="border shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FileText className="h-4 w-4" /> Kategorie: {template.category}
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>Zulaessige Formate: {template.allowedFileTypes.join(', ')}</p>
                          <p>Max. Groesse: {formatFileSize(template.maxFileSize)}</p>
                          <p>Versionen im Archiv: {templateUploads.length}</p>
                        </div>
                        <div className="rounded-md border bg-muted/50 p-3 text-xs text-muted-foreground">
                          <p className="font-medium text-foreground">Zuletzt hochgeladen</p>
                          {lastUpload ? (
                            <>
                              <p>{formatDate(lastUpload.uploadedAt)}</p>
                              <p>Von: {lastUpload.uploadedBy}</p>
                            </>
                          ) : (
                            <p>Noch keine Uploads vorhanden.</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        </DialogFrame>
      </Tabs>
    </MultiWindowDialog>
  );
};

export default TemplateUploadDialog;