import React, { useEffect, useMemo, useState } from "react";
import { Dialog, MultiWindowDialog } from "../ui/dialog";
import { DialogFrame } from "../ui/dialog-frame";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { FileText, Eye, Package, Loader2 } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { DeliveryNoteForm } from "./DeliveryNoteForm";
import type { DeliveryNoteFormInitialData } from "./form/useDeliveryNoteForm";
import { DeliveryNotePreview } from "./DeliveryNotePreview";
import {
  createDeliveryNote as createDeliveryNoteApi,
  updateDeliveryNoteStatus as updateDeliveryNoteStatusApi,
  DeliveryNoteRecord,
  DeliveryNoteStatus,
} from "@/services/api/deliveryWorkflowApi";
import {
  DeliveryNoteService,
  type DeliveryNote,
  type DeliveryNoteFormData,
} from "@/services/deliveryNoteService";
import { featureFlags } from "@/lib/featureFlags";

const DELIVERY_NOTE_STATUSES: DeliveryNote["status"][] = [
  "draft",
  "sent",
  "delivered",
  "cancelled",
];

interface DeliveryNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: DeliveryNoteFormInitialData;
  onDeliveryNoteSaved?: (deliveryNote: DeliveryNote) => void;
}

const mapRecordToDeliveryNote = (
  record: DeliveryNoteRecord,
  snapshot: DeliveryNoteFormData | null,
  current: DeliveryNote | null
): DeliveryNote => {
  const ensureDateOnly = (value?: string) => {
    if (!value) {
      return new Date().toISOString().split("T")[0];
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return new Date().toISOString().split("T")[0];
    }
    return parsed.toISOString().split("T")[0];
  };

  const ensureIsoString = (value?: string) => {
    if (!value) {
      return new Date().toISOString();
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return new Date().toISOString();
    }
    return parsed.toISOString();
  };

  const normalizedStatus = DELIVERY_NOTE_STATUSES.includes(
    record.status as DeliveryNote["status"]
  )
    ? (record.status as DeliveryNote["status"])
    : "draft";

  const fallbackCustomerName =
    snapshot?.customerName ?? current?.customerName ?? "";
  const fallbackCustomerAddress =
    snapshot?.customerAddress ?? current?.customerAddress ?? "";
  const fallbackProjectName = snapshot?.projectName ?? current?.projectName;
  const fallbackOrder = snapshot?.orderNumber ?? current?.orderNumber;
  const fallbackDeliveryAddress =
    snapshot?.deliveryAddress ?? current?.deliveryAddress;
  const fallbackNotes = snapshot?.notes ?? current?.notes;
  const fallbackMethod = snapshot?.deliveryMethod ?? current?.deliveryMethod;

  return {
    id: record.id,
    number: record.number,
    date: ensureDateOnly(record.issuedAt),
    customerId: record.customerId,
    customerName: fallbackCustomerName,
    customerAddress: fallbackCustomerAddress,
    projectId: record.projectId,
    projectName: fallbackProjectName,
    orderNumber: fallbackOrder,
    deliveryAddress: fallbackDeliveryAddress,
    items: record.items.map((item, index) => {
      const sectionMeta = item.metadata?.section as
        | {
            id?: string;
            title?: string;
            sortOrder?: number;
          }
        | undefined;

      return {
        id: item.id,
        description: item.description ?? "",
        quantity: Number(item.quantity ?? 0),
        unit: item.unit ?? "",
        deliveredQuantity:
          item.deliveredQuantity !== undefined
            ? Number(item.deliveredQuantity)
            : Number(item.quantity ?? 0),
        notes:
          typeof item.metadata?.notes === "string"
            ? item.metadata.notes
            : undefined,
        sectionId: item.sectionId ?? sectionMeta?.id,
        sectionTitle: item.sectionTitle ?? sectionMeta?.title,
        sortOrder:
          typeof item.sortOrder === "number"
            ? item.sortOrder
            : typeof sectionMeta?.sortOrder === "number"
            ? sectionMeta?.sortOrder
            : index,
      };
    }),
    notes: record.notes ?? fallbackNotes,
    status: normalizedStatus,
    createdBy: current?.createdBy ?? "system",
    createdAt: ensureIsoString(record.createdAt ?? record.issuedAt),
    updatedAt: ensureIsoString(record.updatedAt ?? record.issuedAt),
    deliveredAt: record.signedAt ? ensureIsoString(record.signedAt) : undefined,
    deliveryMethod: fallbackMethod,
    signature: current?.signature,
  };
};

export const DeliveryNoteDialog: React.FC<DeliveryNoteDialogProps> = ({
  open,
  onOpenChange,
  initialData,
  onDeliveryNoteSaved,
}) => {
  const { toast } = useToast();
  const [useApiDelivery, setUseApiDelivery] = useState(
    featureFlags.isEnabled("ENABLE_API_DELIVERY_NOTES")
  );
  const [activeTab, setActiveTab] = useState("form");
  const [deliveryNoteData, setDeliveryNoteData] = useState<DeliveryNote | null>(
    null
  );
  const [formSnapshot, setFormSnapshot] = useState<DeliveryNoteFormData | null>(
    null
  );

  useEffect(() => {
    const unsubscribe = featureFlags.subscribe((key, value) => {
      if (key === "ENABLE_API_DELIVERY_NOTES") {
        setUseApiDelivery(value);
      }
    });

    return unsubscribe;
  }, []);

  const validateFormData = (payload: DeliveryNoteFormData): string | null => {
    if (!payload.customerName?.trim()) {
      return "Bitte geben Sie einen Kundennamen an.";
    }
    if (!payload.customerAddress?.trim()) {
      return "Bitte geben Sie eine Lieferadresse an.";
    }
    if (!payload.date) {
      return "Bitte waehlen Sie ein Ausstellungsdatum aus.";
    }
    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      return "Fuegen Sie mindestens eine Position hinzu.";
    }

    for (const item of payload.items) {
      const description = item.description?.trim();
      const quantity = Number(item.quantity ?? 0);
      const unit = item.unit ?? "";
      const deliveredQuantity =
        item.deliveredQuantity !== undefined
          ? Number(item.deliveredQuantity)
          : quantity;

      const sectionTitle = item.sectionTitle?.trim();

      if (!sectionTitle) {
        return "Bitte vergeben Sie fuer jeden Abschnitt einen Titel.";
      }

      if (!description) {
        return "Bitte geben Sie eine Beschreibung fuer jede Position an.";
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return "Die Menge jeder Position muss groesser als 0 sein.";
      }
      if (!unit) {
        return "Bitte waehlen Sie eine Einheit fuer jede Position.";
      }
      if (!Number.isFinite(deliveredQuantity) || deliveredQuantity < 0) {
        return "Gelieferte Mengen duerfen nicht negativ sein.";
      }
      if (deliveredQuantity > quantity) {
        return "Gelieferte Mengen duerfen die bestellte Menge nicht ueberschreiten.";
      }
    }

    return null;
  };

  const normalizeFormData = (
    payload: DeliveryNoteFormData
  ): DeliveryNoteFormData => {
    const normalizedItems = payload.items.map((item, index) => {
      const quantity = Number(item.quantity ?? 0);
      const deliveredQuantity =
        item.deliveredQuantity !== undefined
          ? Number(item.deliveredQuantity)
          : quantity;
      const sectionId = item.sectionId?.trim();
      const sectionTitle = item.sectionTitle?.trim();

      return {
        ...item,
        description: item.description?.trim() ?? "",
        quantity,
        unit: item.unit ?? "",
        deliveredQuantity,
        notes: item.notes?.trim(),
        sectionId,
        sectionTitle,
        sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : index,
      };
    });

    return {
      ...payload,
      customerName: payload.customerName.trim(),
      customerAddress: payload.customerAddress.trim(),
      projectName: payload.projectName?.trim(),
      orderNumber: payload.orderNumber?.trim(),
      deliveryAddress: payload.deliveryAddress?.trim(),
      notes: payload.notes?.trim(),
      date: payload.date || new Date().toISOString().split("T")[0],
      deliveryMethod: payload.deliveryMethod ?? "pickup",
      items: normalizedItems,
    };
  };

  const isRemoteMode = useMemo(() => useApiDelivery, [useApiDelivery]);

  const validateRemoteContext = (
    data: DeliveryNoteFormData
  ): { title: string; description: string } | null => {
    if (!data.projectId) {
      return {
        title: "Projekt erforderlich",
        description: "Bitte weisen Sie den Lieferschein einem Projekt zu.",
      };
    }

    if (!data.customerId?.trim()) {
      return {
        title: "Kunde erforderlich",
        description: "Bitte waehlen Sie einen gueltigen Kunden aus.",
      };
    }

    return null;
  };

  const persistDeliveryNote = async (
    normalizedData: DeliveryNoteFormData
  ): Promise<DeliveryNote | null> => {
    if (isRemoteMode) {
      const validation = validateRemoteContext(normalizedData);
      if (validation) {
        toast({ ...validation, variant: "destructive" });
        return null;
      }

      const created = await createDeliveryNoteApi(normalizedData.projectId!, {
        customerId: normalizedData.customerId!,
        issueDate: normalizedData.date,
        notes: normalizedData.notes,
        items: normalizedData.items.map((item) => ({
          description: item.description ?? "",
          quantity: Number(item.quantity ?? 0),
          unit: item.unit,
          deliveredQuantity:
            item.deliveredQuantity ?? Number(item.quantity ?? 0),
          metadata: item.notes ? { notes: item.notes } : undefined,
        })),
      });

      return mapRecordToDeliveryNote(created, normalizedData, null);
    }

    return DeliveryNoteService.createDeliveryNote(normalizedData);
  };

  const applyStatusUpdate = async (
    targetStatus: DeliveryNote["status"],
    currentNote: DeliveryNote,
    snapshot: DeliveryNoteFormData | null
  ): Promise<DeliveryNote | null> => {
    if (isRemoteMode) {
      const updated = await updateDeliveryNoteStatusApi(
        currentNote.id,
        targetStatus as DeliveryNoteStatus
      );
      return mapRecordToDeliveryNote(updated, snapshot, currentNote);
    }

    return (
      DeliveryNoteService.updateDeliveryNoteStatus(
        currentNote.id,
        targetStatus
      ) ?? null
    );
  };

  const createDeliveryNoteMutation = useMutation({
    mutationFn: persistDeliveryNote,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      status,
      note,
      snapshot,
    }: {
      status: DeliveryNote["status"];
      note: DeliveryNote;
      snapshot: DeliveryNoteFormData | null;
    }) => applyStatusUpdate(status, note, snapshot),
  });

  const handleFormSubmit = async (data: DeliveryNoteFormData) => {
    const validationError = validateFormData(data);
    if (validationError) {
      toast({
        title: "Unvollstaendige Angaben",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    const normalizedData = normalizeFormData(data);

    try {
      const createdNote = await createDeliveryNoteMutation.mutateAsync(
        normalizedData
      );
      if (!createdNote) {
        return;
      }

      setDeliveryNoteData(createdNote);
      setFormSnapshot(normalizedData);
      setActiveTab("preview");

      toast({
        title: "Lieferschein erstellt",
        description: `Lieferschein ${createdNote.number} wurde erfolgreich erstellt.`,
      });

      onDeliveryNoteSaved?.(createdNote);
    } catch (error) {
      console.error("Failed to create delivery note:", error);
      toast({
        title: "Fehler",
        description: "Der Lieferschein konnte nicht erstellt werden.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (status: DeliveryNote["status"]) => {
    if (!deliveryNoteData || updateStatusMutation.isPending) {
      return;
    }

    if (!DELIVERY_NOTE_STATUSES.includes(status)) {
      toast({
        title: "Ungueltiger Status",
        description: "Der ausgewaehlte Status wird nicht unterstuetzt.",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedNote = await updateStatusMutation.mutateAsync({
        status,
        note: deliveryNoteData,
        snapshot: formSnapshot,
      });
      if (!updatedNote) {
        toast({
          title: "Aktualisierung fehlgeschlagen",
          description:
            "Der Lieferscheinstatus konnte nicht aktualisiert werden.",
          variant: "destructive",
        });
        return;
      }

      setDeliveryNoteData(updatedNote);
      onDeliveryNoteSaved?.(updatedNote);
      toast({
        title: "Status aktualisiert",
        description: `Lieferschein wurde als "${status}" markiert.`,
      });
    } catch (error) {
      console.error("Failed to update delivery note status:", error);
      toast({
        title: "Aktualisierung fehlgeschlagen",
        description: "Der Lieferscheinstatus konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  };

  return (
    <MultiWindowDialog open={open} onOpenChange={onOpenChange} modal={false}>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 overflow-hidden"
      >
        <DialogFrame
          title={
            <span className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Lieferschein erstellen
            </span>
          }
          description="Erstellen Sie einen neuen Lieferschein fuer Ihre Projekte."
          width="fit-content"
          minWidth={900}
          maxWidth={1600}
          preventOutsideClose={true}
          resizable={true}
          showFullscreenToggle
          headerActions={
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="form" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Formular
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                className="flex items-center gap-2"
                disabled={!deliveryNoteData}
              >
                <Eye className="h-4 w-4" />
                Vorschau
              </TabsTrigger>
            </TabsList>
          }
          footer={
            activeTab === "form" ? (
              <div className="flex-shrink-0">
                <Button
                  form="delivery-note-form"
                  type="submit"
                  disabled={createDeliveryNoteMutation.isPending}
                  className="shadow-md hover:shadow-lg transition-all active:scale-95 bg-blue-600 hover:bg-blue-700 text-white min-w-[200px]"
                >
                  {createDeliveryNoteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Lieferschein erstellen
                </Button>
              </div>
            ) : undefined
          }
        >
          <TabsContent value="form" className="space-y-4 pt-6">
            <DeliveryNoteForm
              initialData={initialData}
              onSubmit={handleFormSubmit}
              onCancel={() => onOpenChange(false)}
            />
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            {deliveryNoteData && (
              <DeliveryNotePreview
                deliveryNote={deliveryNoteData}
                onStatusChange={handleStatusChange}
                isStatusUpdating={updateStatusMutation.isPending}
              />
            )}
          </TabsContent>
        </DialogFrame>
      </Tabs>
    </MultiWindowDialog>
  );
};
