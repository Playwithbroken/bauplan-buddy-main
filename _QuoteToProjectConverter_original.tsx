import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  ArrowRight, 
  Calendar, 
  Users, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Building,
  Home,
  Wrench,
  MapPin,
  Loader2
} from 'lucide-react';
import quoteToProjectService, {
  QuoteData,
  ProjectTemplate,
  ConvertedProject,
  ProjectPhase,
  ProjectMilestone,
  ProjectRisk
} from '../../services/quoteToProjectService';
import { useToast } from '../../hooks/use-toast';
&nbsp;
interface QuoteToProjectConverterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteData: QuoteData;
  onProjectCreated?: (project: ConvertedProject) => void;
}
&nbsp;
export function QuoteToProjectConverter({
  open,
  onOpenChange,
  quoteData,
  onProjectCreated
}: QuoteToProjectConverterProps) {
  const { toast } = useToast();
  const quoteService = quoteToProjectService;
&nbsp;
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [projectTemplates, setProjectTemplates] = useState<ProjectTemplate[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedProject, setConvertedProject] = useState<ConvertedProject | null>(null);
  
  const [conversionOptions, setConversionOptions] = useState({
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week from now
    customStartDate: false,
    includeRiskAssessment: true,
    autoAssignTeam: true,
    createMilestones: true
  });
&nbsp;
  const steps = [
    { id: 1, title: 'Template auswählen', description: 'Projektvorlage wählen' },
    { id: 2, title: 'Konfiguration', description: 'Projektdetails anpassen' },
    { id: 3, title: 'Vorschau', description: 'Projekt prüfen' },
    { id: 4, title: 'Erstellen', description: 'Projekt generieren' }
  ];
&nbsp;
  useEffect(() => {
    if (open) {
      const loadProjectTemplates = () => {
        const templates = quoteService.getProjectTemplates();
        setProjectTemplates(templates);
      };
      
      loadProjectTemplates();
      setCurrentStep(1);
      setSelectedTemplate(null);
      setConvertedProject(null);
    }
  }, [open]);
&nbsp;
  const getTemplateIcon = (type: ProjectTemplate['type']) => {
    switch (type) {
      case 'residential': return <Home className="h-8 w-8" />;
      case 'commercial': return <Building className="h-8 w-8" />;
      case 'renovation': return <Wrench className="h-8 w-8" />;
      case 'infrastructure': return <MapPin className="h-8 w-8" />;
      default: return <Building className="h-8 w-8" />;
    }
  };
&nbsp;
  const getTypeLabel = (type: ProjectTemplate['type']) => {
    switch (type) {
      case 'residential': return 'Wohnbau';
      case 'commercial': return 'Gewerbebau';
      case 'renovation': return 'Sanierung';
      case 'infrastructure': return 'Infrastruktur';
      default: return 'Sonstiges';
    }
  };
&nbsp;
  const getRiskLevelColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
    }
  };
&nbsp;
  const handleTemplateSelect = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    setCurrentStep(2);
  };
&nbsp;
  const handleConvert = async () => {
    if (!selectedTemplate) return;
&nbsp;
    setIsConverting(true);
    try {
      const options = {
        startDate: conversionOptions.startDate,
        teamAssignments: conversionOptions.autoAssignTeam ? undefined : {},
        riskAssessment: conversionOptions.includeRiskAssessment ? undefined : []
      };
&nbsp;
      const project = await quoteService.convertQuoteToProject(
        quoteData,
        selectedTemplate.id,
        options
      );
&nbsp;
      setConvertedProject(project);
      setCurrentStep(4);
&nbsp;
      toast({
        title: "Projekt erstellt",
        description: `Das Projekt "${project.name}" wurde erfolgreich erstellt.`,
      });
&nbsp;
      if (onProjectCreated) {
        onProjectCreated(project);
      }
    } catch (error) {
      console.error('Failed to convert quote to project:', error);
      toast({
        title: "Konvertierung fehlgeschlagen",
        description: "Das Projekt konnte nicht erstellt werden.",
        variant: "destructive"
      });
    } finally {
      setIsConverting(false);
    }
  };
&nbsp;
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Projektvorlage auswählen</h3>
              <p className="text-muted-foreground">
                Wählen Sie eine passende Vorlage für Ihr Projekt aus.
              </p>
            </div>
&nbsp;
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projectTemplates.map((template) => (
                <Card 
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="text-primary">
                        {getTemplateIcon(template.type)}
                      </div>
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <Badge variant="secondary">{getTypeLabel(template.type)}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div>📋 {template.phases.length} Projektphasen</div>
                      <div>🎯 {template.defaultMilestones.length} Meilensteine</div>
                      <div>📄 {template.requiredDocuments.length} erforderliche Dokumente</div>
                      <div>⏱️ Dauer-Multiplikator: {template.estimatedDurationMultiplier}x</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
&nbsp;
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Projektkonfiguration</h3>
              <p className="text-muted-foreground">
                Passen Sie die Projektdetails an Ihre Anforderungen an.
              </p>
            </div>
&nbsp;
            {selectedTemplate && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quote Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Angebotsdaten</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Angebotsnummer</Label>
                      <div className="text-sm text-muted-foreground">{quoteData.number}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Kunde</Label>
                      <div className="text-sm text-muted-foreground">{quoteData.customer}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Projektname</Label>
                      <div className="text-sm text-muted-foreground">{quoteData.project}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Angebotssumme</Label>
                      <div className="text-sm font-semibold">€{quoteData.amount.toLocaleString()}</div>
                    </div>
                  </CardContent>
                </Card>
&nbsp;
                {/* Project Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle>Projekteinstellungen</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Projektstart</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={conversionOptions.startDate}
                        onChange={(e) => setConversionOptions(prev => ({ 
                          ...prev, 
                          startDate: e.target.value 
                        }))}
                      />
                    </div>
&nbsp;
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="riskAssessment"
                          checked={conversionOptions.includeRiskAssessment}
                          onChange={(e) => setConversionOptions(prev => ({ 
                            ...prev, 
                            includeRiskAssessment: e.target.checked 
                          }))}
                          className="rounded"
                        />
                        <Label htmlFor="riskAssessment" className="text-sm">
                          Risikoanalyse erstellen
                        </Label>
                      </div>
&nbsp;
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="autoTeam"
                          checked={conversionOptions.autoAssignTeam}
                          onChange={(e) => setConversionOptions(prev => ({ 
                            ...prev, 
                            autoAssignTeam: e.target.checked 
                          }))}
                          className="rounded"
                        />
                        <Label htmlFor="autoTeam" className="text-sm">
                          Team automatisch zuweisen
                        </Label>
                      </div>
&nbsp;
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="milestones"
                          checked={conversionOptions.createMilestones}
                          onChange={(e) => setConversionOptions(prev => ({ 
                            ...prev, 
                            createMilestones: e.target.checked 
                          }))}
                          className="rounded"
                        />
                        <Label htmlFor="milestones" className="text-sm">
                          Meilensteine erstellen
                        </Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
&nbsp;
            {/* Template Preview */}
            {selectedTemplate && (
              <Card>
                <CardHeader>
                  <CardTitle>Vorlagen-Übersicht: {selectedTemplate.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Phases */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Projektphasen ({selectedTemplate.phases.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedTemplate.phases.map((phase) => (
                          <div key={phase.id} className="text-sm">
                            <div className="font-medium">{phase.name}</div>
                            <div className="text-muted-foreground text-xs">
                              {phase.estimatedDurationPercent}% der Projektzeit
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
&nbsp;
                    {/* Milestones */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Meilensteine ({selectedTemplate.defaultMilestones.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedTemplate.defaultMilestones.map((milestone) => (
                          <div key={milestone.id} className="text-sm">
                            <div className="font-medium">{milestone.name}</div>
                            <div className="text-muted-foreground text-xs">
                              Tag {milestone.dayOffset}
                              {milestone.isPaymentMilestone && ` • ${milestone.paymentPercentage}% Zahlung`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
&nbsp;
                    {/* Documents */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Dokumente ({selectedTemplate.requiredDocuments.length})
                      </h4>
                      <div className="space-y-1">
                        {selectedTemplate.requiredDocuments.map((doc, index) => (
                          <div key={index} className="text-sm text-muted-foreground">
                            {doc}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
&nbsp;
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Projektvorschau</h3>
              <p className="text-muted-foreground">
                Überprüfen Sie die Projektkonfiguration vor der Erstellung.
              </p>
            </div>
&nbsp;
            {selectedTemplate && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Projektdetails</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Projektname</Label>
                      <div className="text-sm">{quoteData.project}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Kunde</Label>
                      <div className="text-sm">{quoteData.customer}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Budget</Label>
                      <div className="text-sm font-semibold">€{quoteData.amount.toLocaleString()}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Projektstart</Label>
                      <div className="text-sm">{new Date(conversionOptions.startDate).toLocaleDateString('de-DE')}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Vorlage</Label>
                      <div className="text-sm">{selectedTemplate.name}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Geschätzte Dauer</Label>
                      <div className="text-sm">
                        {Math.ceil((quoteData.estimatedDuration || 60) * selectedTemplate.estimatedDurationMultiplier)} Tage
                      </div>
                    </div>
                  </CardContent>
                </Card>
&nbsp;
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Aktivierte Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Projektphasen erstellen
                        </div>
                        {conversionOptions.createMilestones && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Meilensteine definieren
                          </div>
                        )}
                        {conversionOptions.autoAssignTeam && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Team automatisch zuweisen
                          </div>
                        )}
                        {conversionOptions.includeRiskAssessment && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Risikoanalyse erstellen
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Dokument-Checkliste
                        </div>
                      </div>
                    </CardContent>
                  </Card>
&nbsp;
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Erwartete Ergebnisse</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div>📋 {selectedTemplate.phases.length} Projektphasen</div>
                        <div>🎯 {selectedTemplate.defaultMilestones.length} Meilensteine</div>
                        <div>👥 ~{selectedTemplate.phases.flatMap(p => p.tasks.flatMap(t => t.requiredSkills)).filter((v, i, a) => a.indexOf(v) === i).length} Teammitglieder</div>
                        <div>📄 {selectedTemplate.requiredDocuments.length} erforderliche Dokumente</div>
                        <div>⚠️ Automatische Risikoanalyse</div>
                        <div>📁 Projektordner-Struktur</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        );
&nbsp;
      case 4:
        return (
          <div className="space-y-6">
            {convertedProject ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-600">Projekt erfolgreich erstellt!</h3>
                <p className="text-muted-foreground">
                  Das Projekt "{convertedProject.name}" wurde erfolgreich aus dem Angebot erstellt.
                </p>
&nbsp;
                <Card>
                  <CardHeader>
                    <CardTitle>Projekt-Übersicht</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="font-medium">Projekt-ID</Label>
                        <div className="text-muted-foreground">{convertedProject.id}</div>
                      </div>
                      <div>
                        <Label className="font-medium">Status</Label>
                        <Badge variant="secondary">{convertedProject.status}</Badge>
                      </div>
                      <div>
                        <Label className="font-medium">Dauer</Label>
                        <div className="text-muted-foreground">{convertedProject.estimatedDuration} Tage</div>
                      </div>
                      <div>
                        <Label className="font-medium">Budget</Label>
                        <div className="font-semibold">€{convertedProject.budget.toLocaleString()}</div>
                      </div>
                    </div>
&nbsp;
                    <div className="space-y-3">
                      <div>
                        <Label className="font-medium">Projektphasen ({convertedProject.phases.length})</Label>
                        <div className="mt-2 space-y-1">
                          {convertedProject.phases.map((phase) => (
                            <div key={phase.id} className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              {phase.name}
                            </div>
                          ))}
                        </div>
                      </div>
&nbsp;
                      <div>
                        <Label className="font-medium">Team ({convertedProject.team.length})</Label>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {convertedProject.team.map((member) => (
                            <Badge key={member.id} variant="outline" className="text-xs">
                              {member.role}
                            </Badge>
                          ))}
                        </div>
                      </div>
&nbsp;
                      {convertedProject.risks.length > 0 && (
                        <div>
                          <Label className="font-medium">Identifizierte Risiken ({convertedProject.risks.length})</Label>
                          <div className="mt-2 space-y-1">
                            {convertedProject.risks.slice(0, 3).map((risk) => (
                              <div key={risk.id} className="flex items-center gap-2 text-sm">
                                <AlertTriangle className="h-3 w-3 text-yellow-500" />
                                {risk.category}
                                <Badge variant="outline" className={`text-xs ${getRiskLevelColor(risk.probability)}`}>
                                  {risk.probability}
                                </Badge>
                              </div>
                            ))}
                            {convertedProject.risks.length > 3 && (
                              <div className="text-xs text-muted-foreground">
                                +{convertedProject.risks.length - 3} weitere Risiken
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
                <h3 className="text-lg font-semibold">Projekt wird erstellt...</h3>
                <p className="text-muted-foreground">
                  Bitte warten Sie, während das Projekt aus dem Angebot generiert wird.
                </p>
              </div>
            )}
          </div>
        );
&nbsp;
      default:
        return null;
    }
  };
&nbsp;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Angebot zu Projekt konvertieren
          </DialogTitle>
        </DialogHeader>
&nbsp;
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                step.id <= currentStep 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {step.id < currentStep ? <CheckCircle className="h-4 w-4" /> : step.id}
              </div>
              <div className="ml-2 text-sm">
                <div className={`font-medium ${step.id <= currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.title}
                </div>
                <div className="text-xs text-muted-foreground">{step.description}</div>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-px mx-4 ${
                  step.id < currentStep ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
&nbsp;
        {/* Progress Bar */}
        <Progress value={(currentStep / steps.length) * 100} className="mb-6" />
&nbsp;
        {/* Step Content */}
        <div className="flex-1 overflow-auto">
          {renderStepContent()}
        </div>
&nbsp;
        <DialogFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isConverting}
          >
            Abbrechen
          </Button>
          
          <div className="flex gap-2">
            {currentStep > 1 && currentStep < 4 && (
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={isConverting}
              >
                Zurück
              </Button>
            )}
            
            {currentStep < 3 && (
              <Button 
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!selectedTemplate}
              >
                Weiter
              </Button>
            )}
            
            {currentStep === 3 && (
              <Button 
                onClick={handleConvert}
                disabled={isConverting}
              >
                {isConverting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                Projekt erstellen
              </Button>
            )}
&nbsp;
            {currentStep === 4 && convertedProject && (
              <Button onClick={() => onOpenChange(false)}>
                Fertig
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

