import React, { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Scan,
  QrCode,
  Search,
  Package,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { DialogFrame } from "@/components/ui/dialog-frame";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface BarcodeScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan?: (sku: string) => void;
}

export const BarcodeScannerDialog: React.FC<BarcodeScannerDialogProps> = ({
  open,
  onOpenChange,
  onScan,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    sku: string;
    name: string;
    onHand: number;
    unit: string;
  } | null>(null);
  const [adjustmentValue, setAdjustmentValue] = useState<string>("0");

  useEffect(() => {
    if (open) {
      startScanning();
    } else {
      setScanResult(null);
      setIsScanning(false);
    }
  }, [open]);

  const startScanning = () => {
    setIsScanning(true);
    setScanResult(null);

    // Simulate scan delay
    setTimeout(() => {
      if (!open) return;
      setIsScanning(false);
      setScanResult({
        sku: "STH-450-BS",
        name: "Betonstahl B500B (12mm)",
        onHand: 450,
        unit: "kg",
      });
      toast({
        title: "Artikel erkannt",
        description: "SKU: STH-450-BS",
      });
    }, 2500);
  };

  const handleAdjust = () => {
    toast({
      title: "Bestand angepasst",
      description: `${scanResult?.name}: ${adjustmentValue} ${scanResult?.unit} gebucht.`,
    });
    onScan?.(scanResult?.sku || "");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogFrame
        width="max-w-xl"
        title={
          <div className="flex items-center gap-2">
            <Scan className="h-5 w-5 text-primary" />
            <span>Smart Scanner</span>
          </div>
        }
        description="Barcode oder QR-Code zur Artikelerkennung scannen"
        footer={
          scanResult ? (
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                className="flex-1"
                onClick={startScanning}
              >
                Neu scannen
              </Button>
              <Button className="flex-1" onClick={handleAdjust}>
                Anpassung buchen
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              Schließen
            </Button>
          )
        }
      >
        <div className="space-y-6 pt-4">
          <div
            className={cn(
              "relative aspect-video rounded-xl border-2 overflow-hidden flex flex-col items-center justify-center transition-all",
              isScanning
                ? "border-primary border-dashed bg-slate-900"
                : scanResult
                ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                : "border-slate-200 bg-slate-50"
            )}
          >
            {isScanning && (
              <>
                <div
                  className="absolute inset-x-8 top-1/2 h-0.5 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse"
                  style={{ animation: "scan 2s infinite ease-in-out" }}
                />
                <QrCode className="h-16 w-16 text-white/20 animate-pulse" />
                <p className="text-white/60 text-sm mt-4 font-mono">
                  Suche nach Barcode...
                </p>
                <style
                  dangerouslySetInnerHTML={{
                    __html: `
                  @keyframes scan {
                    0%, 100% { transform: translateY(-300%); }
                    50% { transform: translateY(300%); }
                  }
                `,
                  }}
                />
              </>
            )}

            {!isScanning && scanResult && (
              <div className="flex flex-col items-center text-center p-6 scale-in-center">
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/50 mb-3">
                  <Package className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="font-bold text-lg">{scanResult.name}</h4>
                <p className="text-sm text-muted-foreground font-mono">
                  {scanResult.sku}
                </p>
              </div>
            )}

            {!isScanning && !scanResult && (
              <div className="text-center p-6 text-muted-foreground">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>Scanner bereit</p>
              </div>
            )}
          </div>

          {scanResult && (
            <div className="grid gap-4 p-4 rounded-lg border bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Aktueller Bestand
                </span>
                <span className="font-bold">
                  {scanResult.onHand} {scanResult.unit}
                </span>
              </div>
              <Separator />
              <div className="space-y-4 pt-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="adjustment" className="text-sm font-semibold">
                    Bestands-Anpassung (+/-)
                  </Label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() =>
                        setAdjustmentValue((prev) =>
                          (parseInt(prev) - 1).toString()
                        )
                      }
                    >
                      <X className="h-4 w-4 rotate-45" />
                    </Button>
                    <Input
                      id="adjustment"
                      type="number"
                      className="text-center text-lg font-bold"
                      value={adjustmentValue}
                      onChange={(e) => setAdjustmentValue(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() =>
                        setAdjustmentValue((prev) =>
                          (parseInt(prev) + 1).toString()
                        )
                      }
                    >
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2 justify-center">
                  {["+10", "+50", "-10", "-50"].map((opt) => (
                    <Badge
                      key={opt}
                      variant="outline"
                      className="cursor-pointer hover:bg-slate-200"
                      onClick={() => {
                        const val = parseInt(opt);
                        setAdjustmentValue((prev) =>
                          (parseInt(prev) + val).toString()
                        );
                      }}
                    >
                      {opt}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogFrame>
    </Dialog>
  );
};
