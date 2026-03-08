import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  FileText,
  CheckCircle2,
  UserPlus,
  Mail,
  Download,
  Loader2,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { DialogFrame } from "@/components/ui/dialog-frame";

interface RFQDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: {
    id: string;
    name: string;
    sku: string;
    reorderQuantity: number;
    unit: string;
  };
}

const mockSuppliers = [
  {
    id: "S1",
    name: "Baustoff Weber GmbH",
    rating: 4.8,
    email: "sales@weber-baustoffe.de",
  },
  {
    id: "S2",
    name: "Zementwerke Süd AG",
    rating: 4.2,
    email: "info@zementwerke-sued.de",
  },
  {
    id: "S3",
    name: "Alu-Bau Systeme",
    rating: 4.5,
    email: "kontakt@alu-bau.com",
  },
];

export const RFQDialog: React.FC<RFQDialogProps> = ({
  open,
  onOpenChange,
  item,
}) => {
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([
    "S1",
    "S2",
  ]);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [step, setStep] = useState<"selection" | "success">("selection");

  const handleSend = async () => {
    setIsSending(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSending(false);
    setStep("success");
    toast({
      title: "RFQ Versendet",
      description: `Anfrage für ${item?.name} wurde an ${selectedSuppliers.length} Lieferanten gesendet.`,
    });
  };

  const resetAndClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep("selection");
      setSelectedSuppliers(["S1", "S2"]);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogFrame
        width="max-w-2xl"
        title={
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span>Angebotsanfrage (RFQ) erstellen</span>
          </div>
        }
        description={
          item
            ? `Anfrage für ${item.name} (${item.sku})`
            : "Erstellen Sie eine neue Angebotsanfrage"
        }
        footer={
          step === "selection" ? (
            <div className="flex gap-2 w-full justify-between">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={handleSend}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
                disabled={selectedSuppliers.length === 0 || isSending}
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Anfrage versenden ({selectedSuppliers.length})
              </Button>
            </div>
          ) : (
            <Button className="w-full" onClick={resetAndClose}>
              Fertigstellen
            </Button>
          )
        }
      >
        {step === "selection" ? (
          <div className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 dark:bg-slate-900/50">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase">
                  Menge
                </Label>
                <p className="text-lg font-bold">
                  {item?.reorderQuantity} {item?.unit}
                </p>
              </div>
              <div className="space-y-1 text-right">
                <Label className="text-xs text-muted-foreground uppercase">
                  Ziel-Datum
                </Label>
                <p className="text-lg font-bold">15.02.2024</p>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">
                Lieferanten auswählen
              </Label>
              <div className="grid gap-2">
                {mockSuppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className={cn(
                      "flex items-center justify-between rounded-md border p-3 transition-colors",
                      selectedSuppliers.includes(supplier.id)
                        ? "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900"
                        : "hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={supplier.id}
                        checked={selectedSuppliers.includes(supplier.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSuppliers([
                              ...selectedSuppliers,
                              supplier.id,
                            ]);
                          } else {
                            setSelectedSuppliers(
                              selectedSuppliers.filter(
                                (id) => id !== supplier.id
                              )
                            );
                          }
                        }}
                      />
                      <div>
                        <Label
                          htmlFor={supplier.id}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {supplier.name}
                        </Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] h-4">
                            Rating: {supplier.rating}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Mail className="h-2 w-2" /> {supplier.email}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Nachricht (optional)
              </Label>
              <div className="relative">
                <Textarea
                  placeholder="Zusätzliche Bedingungen, Lieferziele oder Referenzen..."
                  className="min-h-[100px] resize-none"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="rounded-full bg-green-100 p-4 dark:bg-green-950">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">
                Anfragen erfolgreich übermittelt!
              </h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                Die Lieferanten wurden benachrichtigt. Sie erhalten eine
                Benachrichtigung, sobald Angebote eingehen.
              </p>
            </div>
            <div className="flex gap-2 w-full pt-4">
              <Button variant="outline" className="flex-1 gap-2">
                <Download className="h-4 w-4" /> PDF Beleg
              </Button>
              <Button variant="outline" className="flex-1 gap-2">
                Status verfolgen
              </Button>
            </div>
          </div>
        )}
      </DialogFrame>
    </Dialog>
  );
};
