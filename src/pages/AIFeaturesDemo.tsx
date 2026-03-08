/**
 * AI Features Demo Page
 * Showcases AI-powered document processing capabilities
 */

import React, { useState } from "react";
import { SmartUpload } from "@/components/documents/SmartUpload";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, FileText, Brain, Zap, Mic } from "lucide-react";
import type { ExtractedData } from "@/services/aiDocumentService";
import { VoiceActionInput } from "@/components/ui/VoiceActionInput";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDialogDraft } from "@/hooks/useDialogDraft";
import { Layers, RotateCcw, Save } from "lucide-react";

/**
 * Demo Component to show multi-dialog and drafts
 */
function ProjectDialogDemo({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const { data, updateData, clearDraft, isRestored } = useDialogDraft(
    `demo-project-${id}`,
    {
      name: "",
      address: "",
      budget: "",
    }
  );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        draggable
        resizable
        initialPosition={{
          x: (parseInt(id) - 1) * 40,
          y: (parseInt(id) - 1) * 40,
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" /> Projekt Entwurf #{id}
          </DialogTitle>
          <DialogDescription>
            Ziehen Sie dieses Fenster an den Ecken, um die Größe zu ändern.
            Klicken Sie auf andere Fenster, um sie zu fokussieren.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor={`name-${id}`}>Projektname</Label>
            <Input
              id={`name-${id}`}
              value={data.name}
              onChange={(e) => updateData({ name: e.target.value })}
              placeholder="z.B. Neubau Villa Elbe"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`addr-${id}`}>Anschrift</Label>
            <Input
              id={`addr-${id}`}
              value={data.address}
              onChange={(e) => updateData({ address: e.target.value })}
              placeholder="Musterstraße 1"
            />
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearDraft}
            className="text-destructive hover:text-destructive"
          >
            <RotateCcw className="w-3 h-3 mr-1" /> Verwerfen
          </Button>
          <Button size="sm" onClick={onClose} haptic>
            <Save className="w-3 h-3 mr-1" /> Entwurf Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AIFeaturesDemo() {
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(
    null
  );
  const [openDialogs, setOpenDialogs] = useState<string[]>([]);

  const handleDataExtracted = (data: ExtractedData) => {
    console.log("Extracted data:", data);
    setExtractedData(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
              AI-Powered Features
            </span>
          </div>

          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Intelligent Document Processing
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload invoices, quotes, or contracts and watch AI automatically
            extract and organize your data
          </p>

          <div className="max-w-md mx-auto pt-4">
            <VoiceActionInput
              onAction={(text) => console.log("Voice Command demo:", text)}
            />
            <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
              <Mic className="w-3 h-3" /> Probier's mal: "Lade Lieferschein für
              Projekt Hamburg hoch"
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Brain className="w-10 h-10 text-blue-500 mb-2" />
              <CardTitle>Smart OCR</CardTitle>
              <CardDescription>
                Advanced text recognition with 90%+ accuracy
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="w-10 h-10 text-purple-500 mb-2" />
              <CardTitle>Auto Extraction</CardTitle>
              <CardDescription>
                Automatically detects amounts, dates, and line items
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="w-10 h-10 text-pink-500 mb-2" />
              <CardTitle>Instant Import</CardTitle>
              <CardDescription>
                One-click import to your system with confidence scores
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload & Extract</TabsTrigger>
            <TabsTrigger value="results">Extraction Results</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <SmartUpload onDataExtracted={handleDataExtracted} />
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {extractedData ? (
              <Card>
                <CardHeader>
                  <CardTitle>Latest Extraction Results</CardTitle>
                  <CardDescription>
                    Processed {new Date().toLocaleString("de-DE")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Document Type
                      </p>
                      <Badge>{extractedData.type}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Confidence
                      </p>
                      <Badge variant="outline">
                        {Math.round(extractedData.confidence * 100)}%
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Processing Time
                      </p>
                      <p className="font-semibold">
                        {(extractedData.metadata.processingTime / 1000).toFixed(
                          2
                        )}
                        s
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        OCR Confidence
                      </p>
                      <p className="font-semibold">
                        {Math.round(extractedData.metadata.ocrConfidence * 100)}
                        %
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Extracted Text Preview
                    </p>
                    <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto max-h-64">
                      {extractedData.rawText.slice(0, 500)}
                      {extractedData.rawText.length > 500 && "..."}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-semibold mb-2">No results yet</p>
                  <p className="text-muted-foreground">
                    Upload a document to see extraction results
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Multi-Window & Draft Demo Section */}
        <div className="pt-12 border-t dark:border-slate-800">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">
              Multi-Window & Auto-Save Demo
            </h2>
            <p className="text-muted-foreground">
              Testen Sie die neue Architektur: Öffnen Sie mehrere Fenster
              gleichzeitig, verschieben Sie diese und sehen Sie, wie Ihre
              Eingaben automatisch in der IndexedDB gespeichert werden.
            </p>
          </div>

          <div className="flex justify-center gap-4 mb-12">
            <Button
              variant="outline"
              size="lg"
              className="bg-white/50 backdrop-blur-sm border-2 border-blue-200 dark:border-blue-800"
              onClick={() =>
                setOpenDialogs((prev) => [
                  ...prev,
                  (prev.length + 1).toString(),
                ])
              }
              haptic
            >
              <Layers className="w-5 h-5 mr-3 text-blue-500" />
              Neues Fenster öffnen
            </Button>

            {openDialogs.length > 0 && (
              <Button
                variant="ghost"
                onClick={() => setOpenDialogs([])}
                className="text-muted-foreground"
              >
                Alle schließen
              </Button>
            )}
          </div>

          {openDialogs.map((id) => (
            <ProjectDialogDemo
              key={id}
              id={id}
              onClose={() =>
                setOpenDialogs((prev) => prev.filter((d) => d !== id))
              }
            />
          ))}
        </div>

        {/* Info Section */}
        <Card className="border-2 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  1
                </span>
              </div>
              <div>
                <p className="font-semibold">Upload Document</p>
                <p className="text-sm text-muted-foreground">
                  Drag & drop or click to upload PDF, JPG, or PNG files
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                  2
                </span>
              </div>
              <div>
                <p className="font-semibold">AI Analysis</p>
                <p className="text-sm text-muted-foreground">
                  OCR extracts text, AI detects document type and key fields
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-pink-600 dark:text-pink-400">
                  3
                </span>
              </div>
              <div>
                <p className="font-semibold">Review & Import</p>
                <p className="text-sm text-muted-foreground">
                  Review extracted data with confidence scores, then import with
                  one click
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
