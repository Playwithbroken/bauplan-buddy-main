import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SmartUpload } from "@/components/documents/SmartUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ExtractedData } from "@/services/aiDocumentService";
import { supabase } from "@/services/supabaseClient";
import { Loader2, Save, FileText, CheckCircle2 } from "lucide-react";

interface SmartInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const SmartInvoiceDialog: React.FC<SmartInvoiceDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [step, setStep] = useState<"upload" | "review">("upload");
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(
    null
  );
  const [projects, setProjects] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    vendorName: "",
    amount: "",
    date: "",
    projectId: "",
  });

  useEffect(() => {
    if (open) {
      loadProjects();
    }
  }, [open]);

  const loadProjects = async () => {
    const { data } = await supabase
      .getClient()
      .from("projects")
      .select("id, data");
    if (data) {
      setProjects(data.map((p) => ({ id: p.id, name: p.data?.name || p.id })));
    }
  };

  const handleDataExtracted = (data: ExtractedData) => {
    setExtractedData(data);
    setFormData({
      invoiceNumber: data.fields.invoiceNumber || "",
      vendorName: data.fields.parties?.from || "",
      amount: data.fields.total?.toString() || "",
      date: data.fields.date
        ? new Date(data.fields.date).toISOString().split("T")[0]
        : "",
      projectId: "",
    });
    setStep("review");
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const client = supabase.getClient();
      const tenant = supabase.getCurrentTenant();

      if (!tenant) throw new Error("Kein Tenant gefunden");

      const { error } = await client.from("invoices").insert({
        tenant_id: tenant.id,
        user_id: (await client.auth.getUser()).data.user?.id,
        invoice_number: formData.invoiceNumber,
        vendor_name: formData.vendorName,
        amount: parseFloat(formData.amount),
        issue_date: formData.date || null,
        project_id: formData.projectId || null,
        status: "pending",
        raw_data: extractedData,
      });

      if (error) throw error;

      toast({
        title: "Rechnung gespeichert",
        description: "Die Rechnung wurde erfolgreich importiert.",
      });

      onSuccess?.();
      onOpenChange(false);
      setStep("upload");
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast({
        title: "Fehler beim Speichern",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            KI-Rechnungsimport
          </DialogTitle>
          <DialogDescription>
            Laden Sie eine Rechnung hoch. Unsere KI extrahiert automatisch alle
            wichtigen Daten.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" ? (
          <div className="py-4">
            <SmartUpload onDataExtracted={handleDataExtracted} />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invNum">Rechnungsnummer</Label>
                <Input
                  id="invNum"
                  value={formData.invoiceNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, invoiceNumber: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor">Lieferant</Label>
                <Input
                  id="vendor"
                  value={formData.vendorName}
                  onChange={(e) =>
                    setFormData({ ...formData, vendorName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Betrag (EUR)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Datum</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project">Projekt (Optional)</Label>
              <Select
                value={formData.projectId}
                onValueChange={(val) =>
                  setFormData({ ...formData, projectId: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Projekt auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-lg text-green-700 dark:text-green-400 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                Daten erfolgreich extrahiert. Bitte prüfen Sie die Angaben.
              </span>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "review" && (
            <>
              <Button variant="ghost" onClick={() => setStep("upload")}>
                Zurück
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                In System übernehmen
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
