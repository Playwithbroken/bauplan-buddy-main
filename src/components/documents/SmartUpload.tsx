import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import aiDocumentService, {
  type ExtractedData,
  type DocumentAnalysisProgress,
} from "@/services/aiDocumentService";
import { cn } from "@/lib/utils";

interface SmartUploadProps {
  onDataExtracted?: (data: ExtractedData) => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
}

export const SmartUpload: React.FC<SmartUploadProps> = ({
  onDataExtracted,
  acceptedFileTypes = ["image/*", "application/pdf"],
  maxFileSize = 10 * 1024 * 1024, // 10MB
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<DocumentAnalysisProgress | null>(
    null
  );
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setError(null);
      setIsProcessing(true);
      setExtractedData(null);

      try {
        const data = await aiDocumentService.analyzeDocument(file, (prog) => {
          setProgress(prog);
        });

        setExtractedData(data);
        onDataExtracted?.(data);

        toast({
          title: "✅ Document analyzed successfully",
          description: `Extracted ${
            Object.keys(data.fields).length
          } fields with ${Math.round(data.confidence * 100)}% confidence`,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        toast({
          title: "❌ Analysis failed",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
        setProgress(null);
      }
    },
    [onDataExtracted, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce(
      (acc, type) => ({ ...acc, [type]: [] }),
      {}
    ),
    maxSize: maxFileSize,
    multiple: false,
  });

  const getDocumentTypeColor = (type: ExtractedData["type"]) => {
    const colors = {
      invoice: "bg-blue-500",
      quote: "bg-purple-500",
      contract: "bg-green-500",
      delivery_note: "bg-orange-500",
      blueprint: "bg-cyan-500",
      other: "bg-gray-500",
    };
    return colors[type] || colors.other;
  };

  const getDocumentTypeLabel = (type: ExtractedData["type"]) => {
    const labels = {
      invoice: "Invoice",
      quote: "Quote",
      contract: "Contract",
      delivery_note: "Delivery Note",
      blueprint: "Blueprint",
      other: "Document",
    };
    return labels[type] || "Document";
  };

  const formatCurrency = (amount: number, currency: string = "EUR") => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI-Powered Document Upload
          </CardTitle>
          <CardDescription>
            Upload invoices, quotes, or contracts for automatic data extraction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300",
              isDragActive
                ? "border-primary bg-primary/5 scale-105"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
              isProcessing && "pointer-events-none opacity-50"
            )}
          >
            <input {...getInputProps()} />

            <motion.div
              animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
              className="flex flex-col items-center gap-4"
            >
              {isProcessing ? (
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
              ) : (
                <Upload className="w-16 h-16 text-muted-foreground" />
              )}

              <div>
                <p className="text-lg font-semibold mb-2">
                  {isDragActive
                    ? "Drop your document here"
                    : isProcessing
                    ? "Processing document..."
                    : "Drag & drop a document, or click to browse"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports PDF, JPG, PNG (max {maxFileSize / 1024 / 1024}MB)
                </p>
              </div>
            </motion.div>
          </div>

          {/* Progress Indicator */}
          <AnimatePresence>
            {progress && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-6 space-y-3"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{progress.message}</span>
                  <span className="text-muted-foreground">
                    {progress.progress}%
                  </span>
                </div>
                <Progress value={progress.progress} className="h-2" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">
                  Analysis Failed
                </p>
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Extracted Data Display */}
      <AnimatePresence>
        {extractedData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    Extracted Data
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        "text-white",
                        getDocumentTypeColor(extractedData.type)
                      )}
                    >
                      {getDocumentTypeLabel(extractedData.type)}
                    </Badge>
                    <Badge variant="outline">
                      {Math.round(extractedData.confidence * 100)}% confidence
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Key Fields */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {extractedData.fields.total && (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">
                        Total Amount
                      </p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(
                          extractedData.fields.total,
                          extractedData.fields.currency
                        )}
                      </p>
                    </div>
                  )}

                  {extractedData.fields.date && (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Date</p>
                      <p className="text-lg font-semibold">
                        {extractedData.fields.date.toLocaleDateString("de-DE")}
                      </p>
                    </div>
                  )}

                  {extractedData.fields.invoiceNumber && (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">
                        Invoice Number
                      </p>
                      <p className="text-lg font-semibold font-mono">
                        {extractedData.fields.invoiceNumber}
                      </p>
                    </div>
                  )}

                  {extractedData.fields.quoteNumber && (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">
                        Quote Number
                      </p>
                      <p className="text-lg font-semibold font-mono">
                        {extractedData.fields.quoteNumber}
                      </p>
                    </div>
                  )}
                </div>

                {/* Line Items */}
                {extractedData.fields.lineItems &&
                  extractedData.fields.lineItems.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">
                        Line Items ({extractedData.fields.lineItems.length})
                      </h4>
                      <div className="space-y-2">
                        {extractedData.fields.lineItems
                          .slice(0, 5)
                          .map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center p-3 bg-muted/50 rounded-lg"
                            >
                              <div>
                                <p className="font-medium">
                                  {item.description}
                                </p>
                                {item.quantity && (
                                  <p className="text-sm text-muted-foreground">
                                    Qty: {item.quantity} ×{" "}
                                    {item.unitPrice &&
                                      formatCurrency(item.unitPrice)}
                                  </p>
                                )}
                              </div>
                              {item.total && (
                                <p className="font-semibold">
                                  {formatCurrency(item.total)}
                                </p>
                              )}
                            </div>
                          ))}
                        {extractedData.fields.lineItems.length > 5 && (
                          <p className="text-sm text-muted-foreground text-center">
                            +{extractedData.fields.lineItems.length - 5} more
                            items
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    className="flex-1"
                    onClick={() => onDataExtracted?.(extractedData)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Import to System
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setExtractedData(null)}
                  >
                    Upload Another
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
