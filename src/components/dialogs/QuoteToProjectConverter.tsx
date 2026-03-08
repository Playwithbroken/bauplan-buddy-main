import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MultiWindowDialog } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { ArrowRight, Building, Calendar, CheckCircle, ClipboardList, Loader2, MapPin, Sparkles, Users, Wrench } from 'lucide-react';
import { ConvertedProject, ProjectMilestone, ProjectPhase, ProjectRisk, ProjectTemplate, QuoteData, QuoteToProjectService } from '@/services/quoteToProjectService';
import { featureFlags } from '@/lib/featureFlags';
import { useToast } from '@/hooks/use-toast';
import { DialogFrame } from '../ui/dialog-frame';

interface QuoteToProjectConverterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteData: QuoteData;
  onProjectCreated?: (project: ConvertedProject) => void;
}

type ConverterStep = 1 | 2 | 3 | 4;

const INITIAL_OPTIONS = {
  startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  customStartDate: false,
  includeRiskAssessment: true,
  autoAssignTeam: true,
  createMilestones: true,
  projectNotes: ''
};

const getTemplateIcon = (type: ProjectTemplate['type']) => {
  switch (type) {
    case 'residential':
      return <Building className="h-6 w-6" />;
    case 'commercial':
      return <Building className="h-6 w-6" />;
    case 'renovation':
      return <Wrench className="h-6 w-6" />;
    case 'infrastructure':
      return <MapPin className="h-6 w-6" />;
    default:
      return <Sparkles className="h-6 w-6" />;
  }
};

const getTemplateLabel = (type: ProjectTemplate['type']) => {
  switch (type) {
    case 'residential':
      return 'Wohnbau';
    case 'commercial':
      return 'Gewerbebau';
    case 'renovation':
      return 'Sanierung';
    case 'infrastructure':
      return 'Infrastruktur';
    default:
      return 'Sonstiges';
  }
};

const steps = [
  { id: 1 as ConverterStep, title: 'Vorlage waehlen', description: 'Passende Projektvorlage auswaehlen' },
  { id: 2 as ConverterStep, title: 'Konfiguration', description: 'Projektdetails anpassen' },
  { id: 3 as ConverterStep, title: 'Uebersicht', description: 'Einstellungen pruefen' },
  { id: 4 as ConverterStep, title: 'Ergebnis', description: 'Projekt erstellt' }
];

export function QuoteToProjectConverter({
  open,
  onOpenChange,
  quoteData,
  onProjectCreated
}: QuoteToProjectConverterProps) {
  const { toast } = useToast();
  const quoteService = useMemo(() => QuoteToProjectService.getInstance(), []);

  const [currentStep, setCurrentStep] = useState<ConverterStep>(1);
  const [projectTemplates, setProjectTemplates] = useState<ProjectTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [options, setOptions] = useState(INITIAL_OPTIONS);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedProject, setConvertedProject] = useState<ConvertedProject | null>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [useBackendConversion, setUseBackendConversion] = useState(
    featureFlags.isEnabled('ENABLE_API_QUOTE_CONVERSION')
  );

  useEffect(() => {
    const unsubscribe = featureFlags.subscribe((key, value) => {
      if (key === 'ENABLE_API_QUOTE_CONVERSION') {
        setUseBackendConversion(value);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    setCurrentStep(1);
    setOptions(INITIAL_OPTIONS);
    setConvertedProject(null);
    setConversionError(null);
    setSelectedTemplate(null);

    try {
      const templates = quoteService.getProjectTemplates();
      setProjectTemplates(templates);
    } catch (error) {
      console.error('Failed to load project templates:', error);
      toast({
        title: 'Fehler',
        description: 'Projektvorlagen konnten nicht geladen werden.',
        variant: 'destructive'
      });
    }
  }, [open, quoteService, toast]);

  const handleTemplateSelect = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    setCurrentStep(2);
  };

  const handleOptionToggle = (key: keyof typeof INITIAL_OPTIONS) => (value: boolean) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleStartDateChange = (value: string) => {
    setOptions(prev => ({
      ...prev,
      startDate: value
    }));
  };

  const handleNotesChange = (value: string) => {
    setOptions(prev => ({
      ...prev,
      projectNotes: value
    }));
  };

  const templateSummary = useMemo(() => {
    if (!selectedTemplate) {
      return null;
    }

    const uniqueSkills = new Set(
      selectedTemplate.phases.flatMap(phase =>
        phase.tasks.flatMap(task => task.requiredSkills)
      )
    );

    return {
      phaseCount: selectedTemplate.phases.length,
      milestoneCount: selectedTemplate.defaultMilestones.length,
      documentCount: selectedTemplate.requiredDocuments.length,
      skillCount: uniqueSkills.size,
      durationMultiplier: selectedTemplate.estimatedDurationMultiplier
    };
  }, [selectedTemplate]);

  const handleConvert = useCallback(async () => {
    if (!selectedTemplate) {
      return;
    }

    setIsConverting(true);
    setConversionError(null);

    try {
      const project = await quoteService.convertQuoteToProject(quoteData, selectedTemplate.id, {
        startDate: options.startDate,
        customMilestones: options.createMilestones ? undefined : ([] as ProjectMilestone[]),
        riskAssessment: options.includeRiskAssessment ? undefined : ([] as ProjectRisk[]),
        teamAssignments: options.autoAssignTeam ? undefined : ({} as Record<string, string[]>)
      });

      setConvertedProject(project);

      setCurrentStep(4);

      toast({
        title: 'Projekt erstellt',
        description: `Projekt "${project.name}" wurde erfolgreich angelegt.`
      });

      onProjectCreated?.(project);
    } catch (error) {
      console.error('Quote conversion failed:', error);
      const message = error instanceof Error ? error.message : 'Projekt konnte nicht erstellt werden.';
      setConversionError(message);
      toast({
        title: 'Konvertierung fehlgeschlagen',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setIsConverting(false);
    }
  }, [options, quoteData, quoteService, selectedTemplate, toast, onProjectCreated]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {projectTemplates.map(template => (
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
                      <Badge variant="secondary">{getTemplateLabel(template.type)}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <div>Phasen: {template.phases.length}</div>
                  <div>Meilensteine: {template.defaultMilestones.length}</div>
                  <div>Dokumente: {template.requiredDocuments.length}</div>
                  <div>Dauer Faktor: {template.estimatedDurationMultiplier}x</div>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 2:
        if (!selectedTemplate) {
          return null;
        }

        return (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Angebotsdaten</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Angebot</Label>
                  <div className="font-medium">{quoteData.number}</div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Kunde</Label>
                  <div className="font-medium">{quoteData.customer}</div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Projekt</Label>
                  <div className="font-medium">{quoteData.project}</div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Budget</Label>
                  <div className="font-medium">
                    {quoteData.amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Projektoptionen</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Risikoanalyse</p>
                        <p className="text-xs text-muted-foreground">Automatisch Risiken generieren</p>
                      </div>
                      <Switch
                        checked={options.includeRiskAssessment}
                        onCheckedChange={handleOptionToggle('includeRiskAssessment')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Teamzuweisung</p>
                        <p className="text-xs text-muted-foreground">Passende Teams automatisch zuordnen</p>
                      </div>
                      <Switch
                        checked={options.autoAssignTeam}
                        onCheckedChange={handleOptionToggle('autoAssignTeam')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Standard Meilensteine</p>
                        <p className="text-xs text-muted-foreground">Vorlagenmeilensteine uebernehmen</p>
                      </div>
                      <Switch
                        checked={options.createMilestones}
                        onCheckedChange={handleOptionToggle('createMilestones')}
                      />
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label>Projekt Notizen</Label>
                  <Textarea
                    rows={3}
                    value={options.projectNotes}
                    onChange={event => handleNotesChange(event.target.value)}
                    placeholder="Zusammenfassung oder Hinweise fuer das Projektteam"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Projektzeitraum</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Geplanter Start</Label>
                  <Input
                    type="date"
                    value={options.startDate}
                    onChange={event => handleStartDateChange(event.target.value)}
                  />
                </div>
                {templateSummary && (
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Phasen: {templateSummary.phaseCount}</p>
                    <p>Meilensteine: {templateSummary.milestoneCount}</p>
                    <p>Dokumente: {templateSummary.documentCount}</p>
                    <p>Skill Profil: {templateSummary.skillCount} Skills</p>
                    <p>Dauer Faktor: {templateSummary.durationMultiplier}x</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 3:
        if (!selectedTemplate) {
          return null;
        }

        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Zusammenfassung</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Projektname</p>
                  <p className="font-medium">{quoteData.project}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Kunde</p>
                  <p className="font-medium">{quoteData.customer}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Vorlage</p>
                  <p className="font-medium">{selectedTemplate.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Startdatum</p>
                  <p className="font-medium">{options.startDate}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inhalte der Vorlage</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div>
                  <p className="font-medium flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Phasen
                  </p>
                  <ul className="mt-2 space-y-1">
                    {selectedTemplate.phases.map((phase: ProjectPhase) => (
                      <li key={phase.id}>
                        {phase.name} ({phase.estimatedDurationPercent}%)
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Meilensteine
                  </p>
                  <ul className="mt-2 space-y-1">
                    {selectedTemplate.defaultMilestones.map((milestone: ProjectMilestone) => (
                      <li key={milestone.id}>
                        Tag {milestone.dayOffset}: {milestone.name}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Dokumente
                  </p>
                  <ul className="mt-2 space-y-1">
                    {selectedTemplate.requiredDocuments.map((doc, index) => (
                      <li key={index}>{doc}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {conversionError && (
              <Card className="border-destructive">
                <CardContent className="py-4 text-sm text-destructive">
                  {conversionError}
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 4:
        if (!convertedProject) {
          return null;
        }

        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <CheckCircle className="h-6 w-6 text-primary" />
              <div>
                <p className="font-semibold">Projekt wurde erfolgreich erstellt</p>
                <p className="text-sm text-muted-foreground">
                  Das Projekt ist nun in der Projektuebersicht verfuegbar.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Projektdaten</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Projektname</p>
                    <p className="font-medium">{convertedProject.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-medium text-primary capitalize">
                      {convertedProject.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Budget</p>
                    <p className="font-medium">
                      {convertedProject.budget.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Zeitraum</p>
                    <p className="font-medium">
                      {convertedProject.startDate ?? '-'} bis {convertedProject.endDate ?? '-'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Struktur</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>Phasen: {convertedProject.phases.length}</p>
                  <p>Meilensteine: {convertedProject.milestones.length}</p>
                  <p>Dokumente: {convertedProject.documents.length}</p>
                  <p>Risiken: {convertedProject.risks.length}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const backendInfo = useBackendConversion
    ? 'Die Konvertierung nutzt den Backend Workflow.'
    : 'Die Konvertierung erfolgt lokal im Browser.';

  const stepContent = renderStepContent();

  return (
    <MultiWindowDialog open={open} onOpenChange={onOpenChange} modal={false}>
      <Tabs value={String(currentStep)} className="flex-1 overflow-hidden">
        <DialogFrame
          title={
            <span className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              Angebot zu Projekt konvertieren
            </span>
          }
          defaultFullscreen
          showFullscreenToggle
          headerActions={
            <TabsList className="grid w-full grid-cols-4">
              {steps.map(step => (
                <TabsTrigger key={step.id} value={String(step.id)} disabled={currentStep < step.id} className="flex flex-col items-center gap-1 py-3 text-xs">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${step.id <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{step.id < currentStep ? <CheckCircle className="h-4 w-4" /> : step.id}</span>
                  <span>{step.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          }
          footer={
            <div className="flex justify-between w-full">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isConverting}>
                Abbrechen
              </Button>
              <div className="flex gap-2">
                {currentStep > 1 && currentStep < 4 && (
                  <Button variant="outline" onClick={() => setCurrentStep((currentStep - 1) as ConverterStep)} disabled={isConverting}>
                    Zurueck
                  </Button>
                )}
                {currentStep === 1 && (
                  <Button onClick={() => setCurrentStep(2)} disabled={!selectedTemplate}>
                    Weiter
                  </Button>
                )}
                {currentStep === 2 && (
                  <Button onClick={() => setCurrentStep(3)} disabled={!selectedTemplate}>
                    Weiter
                  </Button>
                )}
                {currentStep === 3 && (
                  <Button onClick={handleConvert} disabled={isConverting || !selectedTemplate}>
                    {isConverting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                    Projekt erstellen
                  </Button>
                )}
                {currentStep === 4 && (
                  <Button onClick={() => onOpenChange(false)}>
                    Fertig
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="mt-4">
            <Progress value={(currentStep / steps.length) * 100} className="h-2" />
          </div>
          <div className="flex-1 overflow-auto mt-6">
            {steps.map(step => (
              <TabsContent key={step.id} value={String(step.id)} className={step.id === currentStep ? 'block' : 'hidden'}>
                {step.id === currentStep ? stepContent : null}
              </TabsContent>
            ))}
          </div>
        </DialogFrame>
      </Tabs>
    </MultiWindowDialog>
  );
}
