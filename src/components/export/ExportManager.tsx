import React, { useState } from "react";
import {
  Dialog,
  DraggableDialogContent as DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/DraggableDialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
} from "lucide-react";

interface ExportManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportManager({ open, onOpenChange }: ExportManagerProps) {
  const { toast } = useToast();
  const [format, setFormat] = useState<"excel" | "csv" | "pdf">("excel");
  const [includeData, setIncludeData] = useState({
    customers: true,
    quotes: true,
    invoices: true,
    projects: false,
  });

  const handleExport = () => {
    toast({
      title: "Export gestartet",
      description: `Ihre Daten werden als ${format.toUpperCase()} exportiert.`,
    });

    // Simulate export
    setTimeout(() => {
      toast({
        title: "Export abgeschlossen",
        description: "Die Datei wurde heruntergeladen.",
      });
      onOpenChange(false);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Daten exportieren</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export-Format</Label>
            <RadioGroup value={format} onValueChange={(v: any) => setFormat(v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="excel" id="excel" />
                <Label
                  htmlFor="excel"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel (.xlsx)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label
                  htmlFor="csv"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="h-4 w-4" />
                  CSV
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label
                  htmlFor="pdf"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="h-4 w-4" />
                  PDF
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Data Selection */}
          <div className="space-y-3">
            <Label>Zu exportierende Daten</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="customers"
                  checked={includeData.customers}
                  onCheckedChange={(checked) =>
                    setIncludeData({ ...includeData, customers: !!checked })
                  }
                />
                <Label htmlFor="customers" className="cursor-pointer">
                  Kunden
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="quotes"
                  checked={includeData.quotes}
                  onCheckedChange={(checked) =>
                    setIncludeData({ ...includeData, quotes: !!checked })
                  }
                />
                <Label htmlFor="quotes" className="cursor-pointer">
                  Angebote
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="invoices"
                  checked={includeData.invoices}
                  onCheckedChange={(checked) =>
                    setIncludeData({ ...includeData, invoices: !!checked })
                  }
                />
                <Label htmlFor="invoices" className="cursor-pointer">
                  Rechnungen
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="projects"
                  checked={includeData.projects}
                  onCheckedChange={(checked) =>
                    setIncludeData({ ...includeData, projects: !!checked })
                  }
                />
                <Label htmlFor="projects" className="cursor-pointer">
                  Projekte
                </Label>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 text-sm">Hinweis</h4>
                <p className="text-sm text-blue-800 mt-1">
                  Der Export enthält alle ausgewählten Daten im gewählten
                  Format. Die Datei wird automatisch heruntergeladen.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportieren
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
