import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  MultiWindowDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Truck,
  Hammer,
  Construction,
  HardHat,
  MapPin,
  Calendar,
  Wrench,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  FileText,
  Loader2,
} from "lucide-react";

// Add DialogFrame for standardized layout
import { DialogFrame } from "@/components/ui/dialog-frame";
import { resourceService } from "@/services/ResourceService";

// Validation schema
const equipmentSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen lang sein"),
  type: z.string().min(2, "Typ ist erforderlich"),
  category: z.enum(["vehicle", "tool", "machinery", "safety"]),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.number().min(0, "Kaufpreis muss positiv sein").optional(),
  currentValue: z.number().min(0, "Aktueller Wert muss positiv sein"),
  status: z.enum(["available", "in-use", "maintenance", "broken"]),
  location: z.string().min(2, "Standort ist erforderlich"),
  assignedTo: z.string().optional(),
  currentProject: z.string().optional(),
  lastMaintenanceDate: z.string().optional(),
  nextMaintenanceDate: z.string().optional(),
  maintenanceInterval: z
    .number()
    .min(0, "Wartungsintervall muss positiv sein")
    .optional(),
  insurancePolicy: z.string().optional(),
  insuranceExpiry: z.string().optional(),
  notes: z.string().optional(),
});

type EquipmentFormData = z.infer<typeof equipmentSchema>;

export interface Equipment extends EquipmentFormData {
  id: string;
}

interface EquipmentProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment?: Equipment;
  onSuccess?: () => void;
}

const categoryConfig = {
  vehicle: {
    label: "Fahrzeug",
    icon: Truck,
    color: "bg-blue-100 text-blue-700 border-blue-300",
  },
  tool: {
    label: "Werkzeug",
    icon: Hammer,
    color: "bg-green-100 text-green-700 border-green-300",
  },
  machinery: {
    label: "Maschine",
    icon: Construction,
    color: "bg-purple-100 text-purple-700 border-purple-300",
  },
  safety: {
    label: "Sicherheit",
    icon: HardHat,
    color: "bg-orange-100 text-orange-700 border-orange-300",
  },
};

const statusConfig = {
  available: {
    label: "Verfügbar",
    color: "bg-green-100 text-green-700 border-green-300",
    icon: CheckCircle,
  },
  "in-use": {
    label: "Im Einsatz",
    color: "bg-blue-100 text-blue-700 border-blue-300",
    icon: Package,
  },
  maintenance: {
    label: "Wartung",
    color: "bg-yellow-100 text-yellow-700 border-yellow-300",
    icon: Wrench,
  },
  broken: {
    label: "Defekt",
    color: "bg-red-100 text-red-700 border-red-300",
    icon: AlertTriangle,
  },
};

export function EquipmentProfileDialog({
  open,
  onOpenChange,
  equipment,
  onSuccess,
}: EquipmentProfileDialogProps) {
  const { toast } = useToast();
  const isEditing = !!equipment;

  const form = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: "",
      type: "",
      category: "tool",
      manufacturer: "",
      model: "",
      serialNumber: "",
      purchaseDate: "",
      purchasePrice: 0,
      currentValue: 0,
      status: "available",
      location: "",
      assignedTo: "",
      currentProject: "",
      lastMaintenanceDate: "",
      nextMaintenanceDate: "",
      maintenanceInterval: 30,
      insurancePolicy: "",
      insuranceExpiry: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (equipment) {
      form.reset({
        name: equipment.name,
        type: equipment.type,
        category: equipment.category,
        manufacturer: equipment.manufacturer || "",
        model: equipment.model || "",
        serialNumber: equipment.serialNumber || "",
        purchaseDate: equipment.purchaseDate || "",
        purchasePrice: equipment.purchasePrice || 0,
        currentValue: equipment.currentValue,
        status: equipment.status,
        location: equipment.location,
        assignedTo: equipment.assignedTo || "",
        currentProject: equipment.currentProject || "",
        lastMaintenanceDate: equipment.lastMaintenanceDate || "",
        nextMaintenanceDate: equipment.nextMaintenanceDate || "",
        maintenanceInterval: equipment.maintenanceInterval || 30,
        insurancePolicy: equipment.insurancePolicy || "",
        insuranceExpiry: equipment.insuranceExpiry || "",
        notes: equipment.notes || "",
      });
    } else {
      form.reset({
        name: "",
        type: "",
        category: "tool",
        manufacturer: "",
        model: "",
        serialNumber: "",
        purchaseDate: format(new Date(), "yyyy-MM-dd"),
        purchasePrice: 0,
        currentValue: 0,
        status: "available",
        location: "",
        assignedTo: "",
        currentProject: "",
        lastMaintenanceDate: "",
        nextMaintenanceDate: "",
        maintenanceInterval: 30,
        insurancePolicy: "",
        insuranceExpiry: "",
        notes: "",
      });
    }
  }, [equipment, form, open]);

  const onSubmit = async (data: EquipmentFormData) => {
    try {
      if (isEditing && equipment) {
        await resourceService.updateEquipment(equipment.id, {
          ...data,
          purchaseDate: data.purchaseDate
            ? new Date(data.purchaseDate)
            : undefined,
          lastMaintenanceDate: data.lastMaintenanceDate
            ? new Date(data.lastMaintenanceDate)
            : undefined,
          nextMaintenanceDate: data.nextMaintenanceDate
            ? new Date(data.nextMaintenanceDate)
            : undefined,
        } as any);
      } else {
        await resourceService.addEquipment({
          ...data,
          purchaseDate: data.purchaseDate
            ? new Date(data.purchaseDate)
            : undefined,
          lastMaintenanceDate: data.lastMaintenanceDate
            ? new Date(data.lastMaintenanceDate)
            : undefined,
          nextMaintenanceDate: data.nextMaintenanceDate
            ? new Date(data.nextMaintenanceDate)
            : undefined,
        } as any);
      }

      toast({
        title: isEditing ? "Ausrüstung aktualisiert" : "Ausrüstung hinzugefügt",
        description: `${data.name} wurde erfolgreich ${
          isEditing ? "aktualisiert" : "hinzugefügt"
        }.`,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Fehler",
        description:
          "Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    }
  };

  const eurFormatter = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  });

  const selectedCategory = form.watch("category");
  const selectedStatus = form.watch("status");
  const CategoryIcon = categoryConfig[selectedCategory].icon;
  const StatusIcon = statusConfig[selectedStatus].icon;

  return (
    <MultiWindowDialog open={open} onOpenChange={onOpenChange}>
      {/* Replaced DialogContent with DialogFrame using standardized layout */}
      <DialogFrame
        showFullscreenToggle
        defaultFullscreen
        width="fit-content"
        minWidth={700}
        maxWidth={1200}
        modal={false}
        onClose={() => onOpenChange(false)}
        title={
          <span className="flex items-center gap-2">
            <CategoryIcon className="h-5 w-5" />
            {isEditing ? "Ausrüstung bearbeiten" : "Neue Ausrüstung"}
          </span>
        }
        description={
          <DialogDescription>
            {isEditing
              ? "Bearbeiten Sie die Ausrüstungsinformationen und speichern Sie die Änderungen."
              : "Fügen Sie neue Ausrüstung hinzu und legen Sie Wartungspläne fest."}
          </DialogDescription>
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              form="equipment-form"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {form.formState.isSubmitting
                ? "Speichert..."
                : isEditing
                ? "Änderungen speichern"
                : "Ausrüstung hinzufügen"}
            </Button>
          </div>
        }
      >
        <form id="equipment-form" onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">Allgemein</TabsTrigger>
              <TabsTrigger value="maintenance">Wartung</TabsTrigger>
              <TabsTrigger value="financial">
                Finanzen & Versicherung
              </TabsTrigger>
            </TabsList>

            {/* Removed fixed-height ScrollArea; content will scroll via DialogFrame */}
            {/* General Tab */}
            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Package className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="z.B. Baukran LIEBHERR 130 EC-B"
                      className="pl-9"
                      {...form.register("name")}
                    />
                  </div>
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="type">
                    Typ <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="type"
                    placeholder="z.B. Turmdrehkran"
                    {...form.register("type")}
                  />
                  {form.formState.errors.type && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.type.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="category">
                    Kategorie <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.watch("category")}
                    onValueChange={(
                      value: "vehicle" | "tool" | "machinery" | "safety"
                    ) => form.setValue("category", value)}
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <config.icon className="h-4 w-4" />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="manufacturer">Hersteller</Label>
                  <Input
                    id="manufacturer"
                    placeholder="z.B. LIEBHERR"
                    {...form.register("manufacturer")}
                  />
                </div>

                <div>
                  <Label htmlFor="model">Modell</Label>
                  <Input
                    id="model"
                    placeholder="z.B. 130 EC-B"
                    {...form.register("model")}
                  />
                </div>

                <div>
                  <Label htmlFor="serialNumber">Seriennummer</Label>
                  <Input
                    id="serialNumber"
                    placeholder="z.B. SN-2024-001"
                    {...form.register("serialNumber")}
                  />
                </div>

                <div>
                  <Label htmlFor="status">
                    Status <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.watch("status")}
                    onValueChange={(
                      value: "available" | "in-use" | "maintenance" | "broken"
                    ) => form.setValue("status", value)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <config.icon className="h-4 w-4" />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="location">
                    Standort <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      placeholder="z.B. Baustelle München"
                      className="pl-9"
                      {...form.register("location")}
                    />
                  </div>
                  {form.formState.errors.location && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.location.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="assignedTo">Zugewiesen an</Label>
                  <Input
                    id="assignedTo"
                    placeholder="z.B. EMP-001"
                    {...form.register("assignedTo")}
                  />
                </div>

                <div>
                  <Label htmlFor="currentProject">Aktuelles Projekt</Label>
                  <Input
                    id="currentProject"
                    placeholder="z.B. PRJ-2024-001"
                    {...form.register("currentProject")}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="notes">Notizen</Label>
                  <Textarea
                    id="notes"
                    placeholder="Zusätzliche Informationen..."
                    rows={3}
                    {...form.register("notes")}
                  />
                </div>
              </div>

              {/* Status Preview */}
              <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-2">Vorschau:</p>
                <div className="flex items-center gap-3">
                  <Badge className={categoryConfig[selectedCategory].color}>
                    <CategoryIcon className="h-3 w-3 mr-1" />
                    {categoryConfig[selectedCategory].label}
                  </Badge>
                  <Badge className={statusConfig[selectedStatus].color}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig[selectedStatus].label}
                  </Badge>
                </div>
              </div>
            </TabsContent>

            {/* Maintenance Tab */}
            <TabsContent value="maintenance" className="space-y-4 mt-4">
              <div>
                <h3 className="text-sm font-medium mb-1">Wartungsplan</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Legen Sie Wartungsintervalle und -termine fest
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lastMaintenanceDate">Letzte Wartung</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="lastMaintenanceDate"
                      type="date"
                      className="pl-9"
                      {...form.register("lastMaintenanceDate")}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="nextMaintenanceDate">Nächste Wartung</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="nextMaintenanceDate"
                      type="date"
                      className="pl-9"
                      {...form.register("nextMaintenanceDate")}
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="maintenanceInterval">
                    Wartungsintervall (Tage)
                  </Label>
                  <Input
                    id="maintenanceInterval"
                    type="number"
                    min="0"
                    placeholder="30"
                    {...form.register("maintenanceInterval", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
              </div>

              {/* Maintenance Summary */}
              <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-2">Wartungsübersicht:</p>
                <div className="space-y-2 text-sm">
                  {form.watch("lastMaintenanceDate") && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Letzte Wartung:
                      </span>
                      <span className="font-medium">
                        {format(
                          new Date(form.watch("lastMaintenanceDate")),
                          "dd.MM.yyyy"
                        )}
                      </span>
                    </div>
                  )}
                  {form.watch("nextMaintenanceDate") && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Nächste Wartung:
                      </span>
                      <span className="font-medium">
                        {format(
                          new Date(form.watch("nextMaintenanceDate")),
                          "dd.MM.yyyy"
                        )}
                      </span>
                    </div>
                  )}
                  {form.watch("maintenanceInterval") && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Intervall:</span>
                      <span className="font-medium">
                        Alle {form.watch("maintenanceInterval")} Tage
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Financial Tab */}
            <TabsContent value="financial" className="space-y-4 mt-4">
              <div>
                <h3 className="text-sm font-medium mb-1">
                  Finanzinformationen
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Kaufpreis, aktueller Wert und Versicherungsdetails
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="purchaseDate">Kaufdatum</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="purchaseDate"
                      type="date"
                      className="pl-9"
                      {...form.register("purchaseDate")}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="purchasePrice">Kaufpreis (€)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="purchasePrice"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-9"
                      {...form.register("purchasePrice", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="currentValue">
                    Aktueller Wert (€) <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="currentValue"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-9"
                      {...form.register("currentValue", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  {form.formState.errors.currentValue && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.currentValue.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="insurancePolicy">Versicherungspolice</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="insurancePolicy"
                      placeholder="z.B. POL-2024-001"
                      className="pl-9"
                      {...form.register("insurancePolicy")}
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="insuranceExpiry">
                    Versicherung gültig bis
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="insuranceExpiry"
                      type="date"
                      className="pl-9"
                      {...form.register("insuranceExpiry")}
                    />
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-2">Finanzübersicht:</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kaufpreis:</span>
                    <span className="font-medium">
                      {eurFormatter.format(form.watch("purchasePrice") || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Aktueller Wert:
                    </span>
                    <span className="font-medium">
                      {eurFormatter.format(form.watch("currentValue") || 0)}
                    </span>
                  </div>
                  {form.watch("purchasePrice") &&
                    form.watch("currentValue") && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Wertverlust:
                        </span>
                        <span className="font-medium text-red-600">
                          {eurFormatter.format(
                            (form.watch("purchasePrice") || 0) -
                              (form.watch("currentValue") || 0)
                          )}
                        </span>
                      </div>
                    )}
                  {form.watch("insuranceExpiry") && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Versicherung gültig bis:
                      </span>
                      <span className="font-medium">
                        {format(
                          new Date(form.watch("insuranceExpiry")),
                          "dd.MM.yyyy"
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </DialogFrame>
    </MultiWindowDialog>
  );
}
