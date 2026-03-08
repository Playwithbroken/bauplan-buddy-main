import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, Trash2, Edit3, Save, Eye, Download, Copy, 
  FileText, BarChart3, Table, Image, Move, GripVertical
} from 'lucide-react';
import {
  Dialog,
  MultiWindowDialog,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DialogFrame } from '@/components/ui/dialog-frame';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { AnalyticsService, ReportTemplate, ReportSection } from '@/services/analyticsService';
import { useToast } from '@/hooks/use-toast';

interface ReportBuilderProps {
  templateId?: string;
  onSave?: (template: ReportTemplate) => void;
  onCancel?: () => void;
}

export function ReportBuilder({ templateId, onSave, onCancel }: ReportBuilderProps) {
  const [template, setTemplate] = useState<Partial<ReportTemplate>>({
    name: '',
    description: '',
    category: 'custom',
    sections: [],
    isActive: true
  });
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<ReportSection | null>(null);
  const [showSectionDialog, setShowSectionDialog] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (templateId) {
      loadTemplate(templateId);
    }
  }, [templateId, loadTemplate]);

  const loadTemplate = React.useCallback(async (id: string) => {
    try {
      // In a real app, this would load from the service
      // For now, we'll create a mock template
      const mockTemplate = {
        id,
        name: 'Beispiel Bericht',
        description: 'Ein Beispiel-Bericht zum Bearbeiten',
        category: 'custom' as const,
        sections: [
          {
            id: '1',
            title: 'Übersicht',
            type: 'metrics' as const,
            content: { metrics: ['total-revenue', 'active-projects'] },
            order: 1
          }
        ],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'current-user'
      };
      
      setTemplate(mockTemplate);
      setSections(mockTemplate.sections);
    } catch (error) {
      toast({
        title: "Fehler beim Laden",
        description: "Der Bericht konnte nicht geladen werden.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleSave = async () => {
    try {
      if (!template.name?.trim()) {
        toast({
          title: "Name erforderlich",
          description: "Bitte geben Sie einen Namen für den Bericht ein.",
          variant: "destructive"
        });
        return;
      }

      const finalTemplate: ReportTemplate = {
        id: template.id || `report-${Date.now()}`,
        name: template.name,
        description: template.description || '',
        category: template.category || 'custom',
        sections: sections,
        isActive: template.isActive ?? true,
        createdAt: template.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: template.createdBy || 'current-user'
      };

      onSave?.(finalTemplate);
      
      toast({
        title: "Bericht gespeichert",
        description: `Der Bericht "${finalTemplate.name}" wurde erfolgreich gespeichert.`,
      });
    } catch (error) {
      toast({
        title: "Fehler beim Speichern",
        description: "Der Bericht konnte nicht gespeichert werden.",
        variant: "destructive"
      });
    }
  };

  const handleAddSection = (type: ReportSection['type']) => {
    const newSection: ReportSection = {
      id: `section-${Date.now()}`,
      title: `Neue ${getSectionTypeName(type)}`,
      type,
      content: getDefaultSectionContent(type),
      order: sections.length + 1
    };

    setSections([...sections, newSection]);
    setSelectedSection(newSection);
    setShowSectionDialog(true);
  };

  const handleEditSection = (section: ReportSection) => {
    setSelectedSection(section);
    setShowSectionDialog(true);
  };

  const handleDeleteSection = (sectionId: string) => {
    setSections(sections.filter(s => s.id !== sectionId));
  };

  const handleSectionSave = (updatedSection: ReportSection) => {
    setSections(sections.map(s => s.id === updatedSection.id ? updatedSection : s));
    setShowSectionDialog(false);
    setSelectedSection(null);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reorderedSections = Array.from(sections);
    const [movedSection] = reorderedSections.splice(result.source.index, 1);
    reorderedSections.splice(result.destination.index, 0, movedSection);

    // Update order property
    reorderedSections.forEach((section, index) => {
      section.order = index + 1;
    });

    setSections(reorderedSections);
  };

  const getSectionTypeName = (type: ReportSection['type']): string => {
    const names = {
      metrics: 'Kennzahlen',
      chart: 'Diagramm',
      table: 'Tabelle',
      text: 'Text',
      image: 'Bild'
    };
    return names[type] || type;
  };

  const getSectionIcon = (type: ReportSection['type']) => {
    const icons = {
      metrics: BarChart3,
      chart: BarChart3,
      table: Table,
      text: FileText,
      image: Image
    };
    const Icon = icons[type] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getDefaultSectionContent = (type: ReportSection['type']) => {
    switch (type) {
      case 'metrics':
        return { metrics: [] };
      case 'chart':
        return { chartId: '', chartType: 'bar' };
      case 'table':
        return { query: { metrics: [], dimensions: [] } };
      case 'text':
        return { text: 'Hier Ihren Text eingeben...' };
      case 'image':
        return { url: '', alt: '', caption: '' };
      default:
        return {};
    }
  };

  const renderSectionPreview = (section: ReportSection) => {
    switch (section.type) {
      case 'metrics':
        return (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Kennzahlen:</div>
            <div className="grid grid-cols-2 gap-2">
              {section.content.metrics?.map((metric: string, index: number) => (
                <div key={index} className="bg-muted p-2 rounded text-sm">
                  {metric}
                </div>
              ))}
            </div>
          </div>
        );
      case 'chart':
        return (
          <div className="bg-muted/50 h-32 flex items-center justify-center rounded">
            <BarChart3 className="h-8 w-8 text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              {section.content.chartType || 'Diagramm'} Vorschau
            </span>
          </div>
        );
      case 'table':
        return (
          <div className="bg-muted/50 h-24 flex items-center justify-center rounded">
            <Table className="h-6 w-6 text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Tabelle Vorschau</span>
          </div>
        );
      case 'text':
        return (
          <div className="text-sm text-muted-foreground">
            {section.content.text?.substring(0, 100)}...
          </div>
        );
      case 'image':
        return (
          <div className="bg-muted/50 h-20 flex items-center justify-center rounded">
            <Image className="h-6 w-6 text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Bild Vorschau</span>
          </div>
        );
      default:
        return <div className="text-sm text-muted-foreground">Unbekannter Abschnittstyp</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {templateId ? 'Bericht bearbeiten' : 'Neuen Bericht erstellen'}
          </h1>
          <p className="text-muted-foreground">
            Erstellen Sie benutzerdefinierte Berichte mit verschiedenen Abschnitten
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Bearbeiten' : 'Vorschau'}
          </Button>
          
          <Button variant="outline" onClick={onCancel}>
            Abbrechen
          </Button>
          
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Speichern
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Configuration */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bericht-Einstellungen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={template.name}
                  onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                  placeholder="Bericht-Name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={template.description}
                  onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                  placeholder="Beschreibung des Berichts"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Kategorie</Label>
                <Select
                  value={template.category}
                  onValueChange={(value: ReportTemplate['category']) =>
                    setTemplate({ ...template, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="executive">Führungsebene</SelectItem>
                    <SelectItem value="project">Projekt</SelectItem>
                    <SelectItem value="financial">Finanzen</SelectItem>
                    <SelectItem value="operational">Betrieb</SelectItem>
                    <SelectItem value="custom">Benutzerdefiniert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="active"
                  checked={template.isActive}
                  onCheckedChange={(checked) => setTemplate({ ...template, isActive: !!checked })}
                />
                <Label htmlFor="active">Bericht aktivieren</Label>
              </div>
            </CardContent>
          </Card>

          {/* Section Types */}
          <Card>
            <CardHeader>
              <CardTitle>Abschnitt hinzufügen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddSection('metrics')}
                className="w-full justify-start"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Kennzahlen
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddSection('chart')}
                className="w-full justify-start"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Diagramm
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddSection('table')}
                className="w-full justify-start"
              >
                <Table className="h-4 w-4 mr-2" />
                Tabelle
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddSection('text')}
                className="w-full justify-start"
              >
                <FileText className="h-4 w-4 mr-2" />
                Text
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddSection('image')}
                className="w-full justify-start"
              >
                <Image className="h-4 w-4 mr-2" />
                Bild
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Report Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Bericht-Inhalt</span>
                <Badge variant="outline">
                  {sections.length} Abschnitt{sections.length !== 1 ? 'e' : ''}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sections.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <div className="text-lg font-medium mb-2">Keine Abschnitte</div>
                  <div className="text-muted-foreground">
                    Fügen Sie Abschnitte hinzu, um mit dem Erstellen Ihres Berichts zu beginnen.
                  </div>
                </div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="sections">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-4"
                      >
                        {sections.map((section, index) => (
                          <Draggable
                            key={section.id}
                            draggableId={section.id}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="border rounded-lg p-4 bg-background"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <div
                                      {...provided.dragHandleProps}
                                      className="cursor-move"
                                    >
                                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    {getSectionIcon(section.type)}
                                    <span className="font-medium">{section.title}</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {getSectionTypeName(section.type)}
                                    </Badge>
                                  </div>
                                  
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditSection(section)}
                                    >
                                      <Edit3 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteSection(section.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                
                                {renderSectionPreview(section)}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section Editor Dialog */}
      <MultiWindowDialog open={showSectionDialog} onOpenChange={setShowSectionDialog} modal={false}>
        <DialogFrame
          title={
            <span className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              {selectedSection ? 'Abschnitt bearbeiten' : 'Neuen Abschnitt erstellen'}
            </span>
          }
          width="fit-content"
          minWidth={640}
          maxWidth={1024}
          resizable={true}
        >
          <DialogDescription>
            Konfigurieren Sie die Einstellungen für diesen Abschnitt.
          </DialogDescription>
          
          {selectedSection && (
            <SectionEditor
              section={selectedSection}
              onSave={handleSectionSave}
              onCancel={() => setShowSectionDialog(false)}
            />
          )}
        </DialogFrame>
      </MultiWindowDialog>
    </div>
  );
}

interface SectionEditorProps {
  section: ReportSection;
  onSave: (section: ReportSection) => void;
  onCancel: () => void;
}

function SectionEditor({ section, onSave, onCancel }: SectionEditorProps) {
  const [editedSection, setEditedSection] = useState<ReportSection>({ ...section });

  const handleSave = () => {
    onSave(editedSection);
  };

  const renderContentEditor = () => {
    switch (editedSection.type) {
      case 'metrics':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Verfügbare Kennzahlen</Label>
              <div className="grid grid-cols-2 gap-2">
                {['total-revenue', 'active-projects', 'completion-rate', 'profit-margin'].map((metric) => (
                  <div key={metric} className="flex items-center space-x-2">
                    <Checkbox
                      checked={editedSection.content.metrics?.includes(metric)}
                      onCheckedChange={(checked) => {
                        const metrics = editedSection.content.metrics || [];
                        if (checked) {
                          setEditedSection({
                            ...editedSection,
                            content: { ...editedSection.content, metrics: [...metrics, metric] }
                          });
                        } else {
                          setEditedSection({
                            ...editedSection,
                            content: { ...editedSection.content, metrics: metrics.filter(m => m !== metric) }
                          });
                        }
                      }}
                    />
                    <Label className="text-sm">{metric}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 'text':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="text-content">Text-Inhalt</Label>
              <Textarea
                id="text-content"
                value={editedSection.content.text || ''}
                onChange={(e) => setEditedSection({
                  ...editedSection,
                  content: { ...editedSection.content, text: e.target.value }
                })}
                placeholder="Geben Sie hier Ihren Text ein..."
                rows={6}
              />
            </div>
          </div>
        );
        
      default:
        return (
          <div className="text-center py-4 text-muted-foreground">
            Editor für {editedSection.type} wird noch entwickelt.
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="section-title">Titel</Label>
        <Input
          id="section-title"
          value={editedSection.title}
          onChange={(e) => setEditedSection({ ...editedSection, title: e.target.value })}
          placeholder="Abschnitts-Titel"
        />
      </div>

      {renderContentEditor()}

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button onClick={handleSave}>
          Speichern
        </Button>
      </div>
    </div>
  );
}

export default ReportBuilder;
