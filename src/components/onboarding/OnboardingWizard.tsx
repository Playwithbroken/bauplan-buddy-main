import React, { useState } from "react";
import {
  Dialog,
  DraggableDialogContent as DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/DraggableDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  CheckCircle2,
  Rocket,
  Package,
  Users,
  FileText,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Database,
} from "lucide-react";

import {
  onboardingService,
  OnboardingState,
} from "@/services/onboardingService";
import { itemTemplateService } from "@/services/itemTemplateService";

interface OnboardingWizardProps {
  open: boolean;
  onComplete: () => void;
}

export function OnboardingWizard({ open, onComplete }: OnboardingWizardProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [companyInfo, setCompanyInfo] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    taxId: "",
  });
  const [generateSampleData, setGenerateSampleData] = useState(true);

  const steps = [
    { id: 0, title: "Willkommen", icon: Rocket },
    { id: 1, title: "Firmendaten", icon: Building2 },
    { id: 2, title: "Vorlagen", icon: Package },
    { id: 3, title: "Beispieldaten", icon: Database },
    { id: 4, title: "Fertig!", icon: CheckCircle2 },
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      onboardingService.updateStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      onboardingService.updateStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onboardingService.skip();
    toast({
      title: "Onboarding übersprungen",
      description:
        "Sie können das Setup jederzeit in den Einstellungen abschließen.",
    });
    onComplete();
  };

  const handleComplete = () => {
    // Save company info
    onboardingService.saveCompanyInfo(companyInfo);

    // Generate sample data if requested
    if (generateSampleData) {
      onboardingService.generateSampleData();
    }

    // Mark as completed
    onboardingService.complete(companyInfo);

    toast({
      title: "🎉 Willkommen bei BauPlan Buddy!",
      description: "Ihr Konto ist jetzt eingerichtet und einsatzbereit.",
    });

    onComplete();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6 text-center py-8">
            <div className="flex justify-center">
              <div className="rounded-full bg-blue-100 p-6">
                <Rocket className="h-16 w-16 text-blue-600" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-3">
                Willkommen bei BauPlan Buddy!
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Ihre All-in-One Lösung für Angebote, Rechnungen, Projekte und
                mehr. Lassen Sie uns gemeinsam Ihr Konto einrichten.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <Card>
                <CardContent className="pt-6 text-center">
                  <FileText className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                  <h3 className="font-semibold mb-2">Angebote & Rechnungen</h3>
                  <p className="text-sm text-muted-foreground">
                    Professionelle Dokumente in Minuten erstellen
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Users className="h-8 w-8 mx-auto mb-3 text-green-600" />
                  <h3 className="font-semibold mb-2">Kunden & Projekte</h3>
                  <p className="text-sm text-muted-foreground">
                    Alles an einem Ort verwalten
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Package className="h-8 w-8 mx-auto mb-3 text-purple-600" />
                  <h3 className="font-semibold mb-2">Vorlagen & Automation</h3>
                  <p className="text-sm text-muted-foreground">
                    Sparen Sie Zeit mit intelligenten Vorlagen
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6 py-4">
            <div className="text-center mb-6">
              <Building2 className="h-12 w-12 mx-auto mb-3 text-blue-600" />
              <h2 className="text-2xl font-bold mb-2">Firmendaten</h2>
              <p className="text-muted-foreground">
                Diese Informationen erscheinen auf Ihren Angeboten und
                Rechnungen
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="companyName">Firmenname *</Label>
                <Input
                  id="companyName"
                  placeholder="z.B. Metallbau Schmidt GmbH"
                  value={companyInfo.name}
                  onChange={(e) =>
                    setCompanyInfo({ ...companyInfo, name: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address">Adresse</Label>
                <Textarea
                  id="address"
                  placeholder="Straße, PLZ, Ort"
                  value={companyInfo.address}
                  onChange={(e) =>
                    setCompanyInfo({ ...companyInfo, address: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  placeholder="+49 123 456789"
                  value={companyInfo.phone}
                  onChange={(e) =>
                    setCompanyInfo({ ...companyInfo, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="info@firma.de"
                  value={companyInfo.email}
                  onChange={(e) =>
                    setCompanyInfo({ ...companyInfo, email: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="taxId">Steuernummer / USt-ID</Label>
                <Input
                  id="taxId"
                  placeholder="DE123456789"
                  value={companyInfo.taxId}
                  onChange={(e) =>
                    setCompanyInfo({ ...companyInfo, taxId: e.target.value })
                  }
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              * Pflichtfeld - Sie können diese Daten später in den Einstellungen
              ändern
            </p>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 py-4">
            <div className="text-center mb-6">
              <Package className="h-12 w-12 mx-auto mb-3 text-purple-600" />
              <h2 className="text-2xl font-bold mb-2">Vorlagen-Bibliothek</h2>
              <p className="text-muted-foreground">
                Wir haben bereits Standard-Vorlagen für Sie vorbereitet
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-2 border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold">Material-Vorlagen</h3>
                    </div>
                    <Badge variant="outline" className="bg-white">
                      {
                        itemTemplateService.getTemplatesByCategory("material")
                          .length
                      }{" "}
                      Vorlagen
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Stahlträger, Bleche, Schweißmaterial
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold">Arbeitszeit-Vorlagen</h3>
                    </div>
                    <Badge variant="outline" className="bg-white">
                      {
                        itemTemplateService.getTemplatesByCategory("labor")
                          .length
                      }{" "}
                      Vorlagen
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Montage, Schweißen, Schlosserei
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold">Dienstleistungen</h3>
                    </div>
                    <Badge variant="outline" className="bg-white">
                      {
                        itemTemplateService.getTemplatesByCategory("service")
                          .length
                      }{" "}
                      Vorlagen
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Transport, Kranarbeiten, Statik
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold">Geräte & Maschinen</h3>
                    </div>
                    <Badge variant="outline" className="bg-white">
                      {
                        itemTemplateService.getTemplatesByCategory("equipment")
                          .length
                      }{" "}
                      Vorlagen
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Gerüst, Schweißgeräte, Werkzeuge
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Tipp</h4>
                  <p className="text-sm text-blue-800">
                    Sie können jederzeit eigene Vorlagen erstellen oder
                    bestehende anpassen. Finden Sie diese unter Einstellungen →
                    Positions-Vorlagen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 py-4">
            <div className="text-center mb-6">
              <Database className="h-12 w-12 mx-auto mb-3 text-green-600" />
              <h2 className="text-2xl font-bold mb-2">Beispieldaten</h2>
              <p className="text-muted-foreground">
                Möchten Sie mit Beispieldaten starten, um die App zu erkunden?
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card
                className={`cursor-pointer transition-all ${
                  generateSampleData
                    ? "border-2 border-blue-500 bg-blue-50"
                    : "border-2 border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setGenerateSampleData(true)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`rounded-full p-2 ${
                        generateSampleData ? "bg-blue-100" : "bg-gray-100"
                      }`}
                    >
                      <CheckCircle2
                        className={`h-6 w-6 ${
                          generateSampleData ? "text-blue-600" : "text-gray-400"
                        }`}
                      />
                    </div>
                    <h3 className="font-semibold text-lg">
                      Ja, Beispiele laden
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Perfekt zum Ausprobieren und Lernen
                  </p>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />2
                      Beispiel-Kunden
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />1
                      Beispiel-Angebot
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Vorausgefüllte Positionen
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all ${
                  !generateSampleData
                    ? "border-2 border-blue-500 bg-blue-50"
                    : "border-2 border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setGenerateSampleData(false)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`rounded-full p-2 ${
                        !generateSampleData ? "bg-blue-100" : "bg-gray-100"
                      }`}
                    >
                      <Sparkles
                        className={`h-6 w-6 ${
                          !generateSampleData
                            ? "text-blue-600"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                    <h3 className="font-semibold text-lg">
                      Nein, leer starten
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Für den direkten Produktiveinsatz
                  </p>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Saubere Datenbank
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Sofort produktiv
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Keine Beispieldaten
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900 mb-1">
                    Hinweis
                  </h4>
                  <p className="text-sm text-yellow-800">
                    Beispieldaten können Sie jederzeit später löschen. Sie sind
                    eine gute Möglichkeit, die Funktionen zu testen, bevor Sie
                    echte Daten eingeben.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 text-center py-8">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-6">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-3">🎉 Alles bereit!</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Ihr BauPlan Buddy Konto ist jetzt eingerichtet und
                einsatzbereit.
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="font-semibold text-lg mb-4">Nächste Schritte:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-blue-100 p-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">
                      Erstes Angebot erstellen
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Nutzen Sie Vorlagen für schnelle Erstellung
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-green-100 p-2">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Kunden hinzufügen</h4>
                    <p className="text-sm text-muted-foreground">
                      Verwalten Sie alle Kontakte zentral
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-purple-100 p-2">
                    <Package className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Vorlagen anpassen</h4>
                    <p className="text-sm text-muted-foreground">
                      Passen Sie Vorlagen an Ihre Bedürfnisse an
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-orange-100 p-2">
                    <Sparkles className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Hilfe nutzen</h4>
                    <p className="text-sm text-muted-foreground">
                      Drücken Sie Cmd+K für schnelle Hilfe
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return companyInfo.name.trim().length > 0;
    }
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Setup-Assistent</span>
            {currentStep < steps.length - 1 && (
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                Überspringen
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              Schritt {currentStep + 1} von {steps.length}
            </span>
            <span>{Math.round(progress)}% abgeschlossen</span>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between items-center py-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div
                  className={`rounded-full p-3 mb-2 transition-all ${
                    isActive
                      ? "bg-blue-100 border-2 border-blue-500"
                      : isCompleted
                      ? "bg-green-100 border-2 border-green-500"
                      : "bg-gray-100 border-2 border-gray-300"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      isActive
                        ? "text-blue-600"
                        : isCompleted
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  />
                </div>
                <span
                  className={`text-xs font-medium ${
                    isActive || isCompleted
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto">{renderStepContent()}</div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Weiter
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Fertigstellen
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
