import React, { useState } from "react";
import {
  Dialog,
  DraggableDialogContent as DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/DraggableDialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

interface DataImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DataImportWizard({
  open,
  onOpenChange,
}: DataImportWizardProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const steps = ["Datei auswählen", "Vorschau", "Import"];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setProgress(0);

    // Simulate import process
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      setProgress(i);
    }

    toast({
      title: "Import erfolgreich",
      description: `${file.name} wurde erfolgreich importiert.`,
    });

    setImporting(false);
    onOpenChange(false);
    setCurrentStep(0);
    setFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Daten importieren</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              {steps.map((step, index) => (
                <span
                  key={index}
                  className={
                    index === currentStep ? "text-foreground font-semibold" : ""
                  }
                >
                  {step}
                </span>
              ))}
            </div>
            <Progress value={((currentStep + 1) / steps.length) * 100} />
          </div>

          {/* Step Content */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-sm text-muted-foreground mb-2">
                    CSV oder Excel-Datei hochladen
                  </div>
                  <Button type="button" variant="outline" size="sm">
                    Datei auswählen
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </Label>
                {file && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>{file.name}</span>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">
                  Unterstützte Formate:
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• CSV (Komma-getrennt)</li>
                  <li>• Excel (.xlsx, .xls)</li>
                  <li>• Maximale Dateigröße: 10 MB</li>
                </ul>
              </div>
            </div>
          )}

          {currentStep === 1 && file && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-semibold mb-2">Dateivorschau</h4>
                <div className="text-sm space-y-1">
                  <p>Dateiname: {file.name}</p>
                  <p>Größe: {(file.size / 1024).toFixed(2)} KB</p>
                  <p>Typ: {file.type || "Unbekannt"}</p>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-900">
                      Bereit zum Import
                    </h4>
                    <p className="text-sm text-green-800 mt-1">
                      Die Datei wurde validiert und kann importiert werden.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              {importing ? (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
                  </div>
                  <h4 className="font-semibold mb-2">
                    Daten werden importiert...
                  </h4>
                  <Progress value={progress} className="max-w-xs mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">
                    {progress}%
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h4 className="font-semibold text-lg mb-2">
                    Import abgeschlossen!
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Ihre Daten wurden erfolgreich importiert.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0 || importing}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!file}
              >
                Weiter
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleImport} disabled={importing || !file}>
                Import starten
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
