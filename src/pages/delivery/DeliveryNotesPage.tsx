import React, { useCallback, useEffect, useMemo, useState } from "react";
import { LayoutWithSidebar } from "@/components/LayoutWithSidebar";
import { DeliveryNoteDialog, DeliveryNoteManager } from "@/components/delivery";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, FileText, Plus, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DeliveryNoteService, {
  type DeliveryNote,
} from "@/services/deliveryNoteService";

const sortByCreatedAtDesc = (notes: DeliveryNote[]) =>
  [...notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

const emptyState: DeliveryNote[] = [];

const DeliveryNotesPage: React.FC = () => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deliveryNotes, setDeliveryNotes] =
    useState<DeliveryNote[]>(emptyState);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const selectedNote = useMemo(
    () => deliveryNotes.find((note) => note.id === selectedNoteId) ?? null,
    [deliveryNotes, selectedNoteId]
  );

  const loadDeliveryNotes = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const notes = await Promise.resolve(
        DeliveryNoteService.getAllDeliveryNotes()
      );
      setDeliveryNotes(sortByCreatedAtDesc(notes));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Lieferscheine konnten nicht geladen werden.";
      setLoadError(message);
      toast({
        title: "Laden fehlgeschlagen",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadDeliveryNotes();
  }, [loadDeliveryNotes]);

  useEffect(() => {
    if (deliveryNotes.length === 0) {
      if (selectedNoteId !== null) {
        setSelectedNoteId(null);
      }
      return;
    }

    const exists = deliveryNotes.some((note) => note.id === selectedNoteId);
    if (!exists) {
      setSelectedNoteId(deliveryNotes[0].id);
    }
  }, [deliveryNotes, selectedNoteId]);

  const handleDeliveryNoteSaved = useCallback(
    (note: DeliveryNote) => {
      setDeliveryNotes((prevNotes) => {
        const index = prevNotes.findIndex(
          (existing) => existing.id === note.id
        );
        if (index === -1) {
          return sortByCreatedAtDesc([note, ...prevNotes]);
        }

        const updated = [...prevNotes];
        updated[index] = note;
        return sortByCreatedAtDesc(updated);
      });
      setSelectedNoteId(note.id);
      setIsDialogOpen(false);
      setLoadError(null);
      toast({
        title: "Lieferschein gespeichert",
        description: "Der Lieferschein wurde erfolgreich aktualisiert.",
      });
    },
    [toast]
  );

  const handleCreateDeliveryNote = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const handleSelectDeliveryNote = useCallback((note: DeliveryNote | null) => {
    setSelectedNoteId(note?.id ?? null);
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    if (!selectedNote) {
      toast({
        title: "Keine Auswahl",
        description:
          "Waehlen Sie einen Lieferschein aus der Liste, um den Export zu starten.",
        variant: "destructive",
      });
      return;
    }

    try {
      const pdfBlob = await DeliveryNoteService.generatePDF(selectedNote);
      const filename = `${selectedNote.number || "liefer_schein"}.pdf`;
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "PDF gespeichert",
        description: `Die Datei ${filename} wurde heruntergeladen.`,
      });
    } catch (error) {
      toast({
        title: "Export fehlgeschlagen",
        description:
          error instanceof Error
            ? error.message
            : "Das PDF konnte nicht erstellt werden.",
        variant: "destructive",
      });
    }
  }, [selectedNote, toast]);

  const handlePrintSelected = useCallback(async () => {
    if (!selectedNote) {
      toast({
        title: "Keine Auswahl",
        description:
          "Waehlen Sie einen Lieferschein aus der Liste, um den Druck zu starten.",
        variant: "destructive",
      });
      return;
    }

    try {
      const pdfBlob = await DeliveryNoteService.generatePDF(selectedNote);
      const url = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(url);

      if (!printWindow) {
        URL.revokeObjectURL(url);
        toast({
          title: "Druck nicht moeglich",
          description: "Bitte erlauben Sie Pop-ups, um den Druck zu starten.",
          variant: "destructive",
        });
        return;
      }

      const triggerPrint = () => {
        printWindow.focus();
        printWindow.print();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      };

      if (printWindow.document.readyState === "complete") {
        triggerPrint();
      } else {
        const handleLoad = () => {
          triggerPrint();
        };
        printWindow.addEventListener("load", handleLoad, { once: true });
      }
    } catch (error) {
      toast({
        title: "Druck fehlgeschlagen",
        description:
          error instanceof Error
            ? error.message
            : "Das PDF konnte nicht erzeugt werden.",
        variant: "destructive",
      });
    }
  }, [selectedNote, toast]);

  const hasNotes = deliveryNotes.length > 0;

  return (
    <LayoutWithSidebar
      breadcrumbItems={[
        { label: "Home", href: "/dashboard" },
        { label: "Lieferscheine" },
      ]}
    >
      <div className="container mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Verwalten Sie Lieferscheine inklusive Status, Export und Druck.
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleCreateDeliveryNote}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Neuer Lieferschein
          </Button>
        </header>

        <Card className="border-dashed border-primary/30 bg-primary/5 text-sm dark:border-primary/30 dark:bg-primary/10">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                {selectedNote
                  ? selectedNote.number
                  : "Kein Lieferschein ausgewaehlt"}
              </CardTitle>
              <CardDescription>
                {selectedNote
                  ? `Zuletzt aktualisiert am ${new Date(
                      selectedNote.updatedAt
                    ).toLocaleDateString("de-DE")} um ${new Date(
                      selectedNote.updatedAt
                    ).toLocaleTimeString("de-DE")}`
                  : "Waehlen Sie einen Lieferschein aus der Tabelle, um Details und Aktionen anzuzeigen."}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintSelected}
                disabled={!selectedNote}
              >
                <Printer className="mr-2 h-4 w-4" />
                Drucken
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPdf}
                disabled={!selectedNote}
              >
                <Download className="mr-2 h-4 w-4" />
                PDF speichern
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {selectedNote ? (
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Kunde
                  </p>
                  <p className="font-medium">{selectedNote.customerName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Projekt
                  </p>
                  <p className="font-medium">
                    {selectedNote.projectName || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Datum
                  </p>
                  <p className="font-medium">
                    {new Date(selectedNote.date).toLocaleDateString("de-DE")}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Positionen
                  </p>
                  <p className="font-medium">{selectedNote.items.length}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Noch kein Lieferschein ausgewaehlt. Waehlen Sie einen Eintrag
                aus der Liste aus.
              </p>
            )}
          </CardContent>
        </Card>

        {loadError && (
          <Alert variant="destructive">
            <AlertTitle>Fehler beim Laden</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        )}

        <DeliveryNoteManager
          deliveryNotes={deliveryNotes}
          isLoading={isLoading}
          onCreateDeliveryNote={handleCreateDeliveryNote}
          onRefresh={loadDeliveryNotes}
          onSelectDeliveryNote={handleSelectDeliveryNote}
          selectedDeliveryNoteId={selectedNoteId}
        />

        {!hasNotes && !isLoading && (
          <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground sm:px-6">
            Noch keine Lieferscheine vorhanden. Legen Sie ueber &quot;Neuer
            Lieferschein&quot; den ersten Datensatz an.
          </div>
        )}
      </div>

      <DeliveryNoteDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onDeliveryNoteSaved={handleDeliveryNoteSaved}
      />
    </LayoutWithSidebar>
  );
};

export default DeliveryNotesPage;
