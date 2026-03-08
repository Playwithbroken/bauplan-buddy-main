/**
 * Barcode Scanner Component
 * Uses device camera to scan QR codes and barcodes for materials tracking
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Camera,
  QrCode,
  Barcode,
  X,
  Copy,
  ExternalLink,
  Package,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ScanResult {
  type: "qr" | "barcode" | "ean" | "code128" | "code39" | "unknown";
  value: string;
  timestamp: Date;
  confidence?: number;
}

interface BarcodeScannerProps {
  /** Callback when a code is scanned */
  onScan: (result: ScanResult) => void;
  /** Accepted barcode types */
  acceptedTypes?: ScanResult["type"][];
  /** Auto-close after scan */
  autoClose?: boolean;
  /** Show scan history */
  showHistory?: boolean;
  /** Custom class name */
  className?: string;
  /** Trigger element (if not provided, uses default button) */
  trigger?: React.ReactNode;
  /** Dialog mode vs inline */
  mode?: "dialog" | "inline";
}

// Detect barcode type from value
const detectBarcodeType = (value: string): ScanResult["type"] => {
  // QR codes can contain any data
  if (value.startsWith("http") || value.includes("\n") || value.length > 20) {
    return "qr";
  }

  // EAN-13 or EAN-8
  if (/^\d{13}$/.test(value) || /^\d{8}$/.test(value)) {
    return "ean";
  }

  // Code 128 (alphanumeric)
  if (/^[A-Za-z0-9\-. $/+%]+$/.test(value) && value.length <= 48) {
    return "code128";
  }

  // Code 39 (limited character set)
  if (/^[A-Z0-9\-. $/+%]+$/.test(value)) {
    return "code39";
  }

  if (/^\d+$/.test(value)) {
    return "barcode";
  }

  return "unknown";
};

// Format barcode type for display
const formatBarcodeType = (type: ScanResult["type"]): string => {
  const labels: Record<ScanResult["type"], string> = {
    qr: "QR-Code",
    barcode: "Barcode",
    ean: "EAN",
    code128: "Code 128",
    code39: "Code 39",
    unknown: "Unbekannt",
  };
  return labels[type];
};

export function BarcodeScanner({
  onScan,
  acceptedTypes,
  autoClose = true,
  showHistory = true,
  className,
  trigger,
  mode = "dialog",
}: BarcodeScannerProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [manualInput, setManualInput] = useState("");
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      setIsScanning(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Prefer back camera
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (error) {
      console.error("Camera error:", error);
      setHasCamera(false);
      setCameraError(
        error instanceof Error
          ? error.message
          : "Kamera konnte nicht gestartet werden"
      );
      setIsScanning(false);
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Scan frame for barcodes (simplified - in production use a library like @zxing/browser)
  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // In production, you would use a barcode library here
    // For demo purposes, we'll simulate occasional scans
    // const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    // const result = barcodeLibrary.decode(imageData);

    requestAnimationFrame(scanFrame);
  }, [isScanning]);

  // Start scanning when dialog opens
  useEffect(() => {
    if (isOpen && mode === "dialog") {
      startCamera();
    }
    return () => stopCamera();
  }, [isOpen, mode, startCamera, stopCamera]);

  // Start frame scanning
  useEffect(() => {
    if (isScanning) {
      scanFrame();
    }
  }, [isScanning, scanFrame]);

  // Handle successful scan
  const handleScan = useCallback(
    (value: string) => {
      const type = detectBarcodeType(value);

      // Check if type is accepted
      if (acceptedTypes && !acceptedTypes.includes(type)) {
        toast({
          title: "Nicht unterstützter Code-Typ",
          description: `${formatBarcodeType(type)} wird nicht akzeptiert.`,
          variant: "destructive",
        });
        return;
      }

      const result: ScanResult = {
        type,
        value,
        timestamp: new Date(),
        confidence: 1,
      };

      setLastScan(result);
      setScanHistory((prev) => [result, ...prev].slice(0, 10));
      onScan(result);

      toast({
        title: "Code gescannt!",
        description: `${formatBarcodeType(type)}: ${value.substring(0, 30)}${
          value.length > 30 ? "..." : ""
        }`,
      });

      if (autoClose) {
        stopCamera();
        setIsOpen(false);
      }
    },
    [acceptedTypes, autoClose, onScan, stopCamera, toast]
  );

  // Handle manual input
  const handleManualSubmit = useCallback(() => {
    if (manualInput.trim()) {
      handleScan(manualInput.trim());
      setManualInput("");
    }
  }, [manualInput, handleScan]);

  // Copy to clipboard
  const handleCopy = useCallback(
    (value: string) => {
      navigator.clipboard.writeText(value);
      toast({
        title: "Kopiert",
        description: "Code in die Zwischenablage kopiert.",
      });
    },
    [toast]
  );

  // Render scanner content
  const renderScannerContent = () => (
    <div className="space-y-4">
      {/* Camera view */}
      <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden">
        {isScanning ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
            {/* Scan overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-white/50 rounded-lg relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                {/* Scanning line animation */}
                <div className="absolute inset-x-2 h-0.5 bg-primary animate-pulse top-1/2" />
              </div>
            </div>
            {/* Status badge */}
            <Badge className="absolute top-2 right-2 gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Scanne...
            </Badge>
          </>
        ) : cameraError ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-white gap-4 p-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-center text-sm">{cameraError}</p>
            <Button variant="secondary" onClick={startCamera}>
              Erneut versuchen
            </Button>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Camera className="h-16 w-16" />
          </div>
        )}
      </div>

      {/* Manual input fallback */}
      <div className="space-y-2">
        <Label>Manuell eingeben</Label>
        <div className="flex gap-2">
          <Input
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Barcode oder QR-Code Inhalt..."
            onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
          />
          <Button onClick={handleManualSubmit} disabled={!manualInput.trim()}>
            Übernehmen
          </Button>
        </div>
      </div>

      {/* Last scan result */}
      {lastScan && (
        <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {formatBarcodeType(lastScan.type)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {lastScan.timestamp.toLocaleTimeString("de-DE")}
                  </span>
                </div>
                <p className="font-mono text-sm mt-1 truncate">
                  {lastScan.value}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => handleCopy(lastScan.value)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scan history */}
      {showHistory && scanHistory.length > 1 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Letzte Scans</Label>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {scanHistory.slice(1, 5).map((scan, index) => (
              <div
                key={`${scan.value}-${index}`}
                className="flex items-center gap-2 p-2 rounded bg-muted/50 text-sm"
              >
                {scan.type === "qr" ? (
                  <QrCode className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Barcode className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="flex-1 truncate font-mono text-xs">
                  {scan.value}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => handleCopy(scan.value)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Inline mode
  if (mode === "inline") {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Barcode Scanner
          </CardTitle>
        </CardHeader>
        <CardContent>{renderScannerContent()}</CardContent>
      </Card>
    );
  }

  // Dialog mode
  return (
    <>
      {trigger ? (
        <div onClick={() => setIsOpen(true)}>{trigger}</div>
      ) : (
        <Button
          variant="outline"
          className={cn("gap-2", className)}
          onClick={() => setIsOpen(true)}
        >
          <QrCode className="h-4 w-4" />
          Code scannen
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Barcode / QR-Code scannen
            </DialogTitle>
            <DialogDescription>
              Halten Sie den Code vor die Kamera oder geben Sie ihn manuell ein.
            </DialogDescription>
          </DialogHeader>
          {renderScannerContent()}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default BarcodeScanner;
