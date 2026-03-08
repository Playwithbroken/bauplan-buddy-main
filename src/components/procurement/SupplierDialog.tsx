import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MultiWindowDialog } from "@/components/ui/dialog";
import { DialogFrame } from "@/components/ui/dialog-frame";
import { Button } from "@/components/ui/button";
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
import {
  useCreateSupplier,
  useUpdateSupplier,
} from "@/hooks/useProcurementApi";
import type { Supplier } from "@/types/procurement";
import { Building2 } from "lucide-react";

const supplierSchema = z.object({
  name: z.string().min(2, "Firmenname muss mindestens 2 Zeichen lang sein"),
  code: z.string().min(2, "Lieferantencode ist erforderlich"),
  contactPerson: z.string().optional(),
  email: z
    .string()
    .email("Ungültige E-Mail-Adresse")
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  paymentTerms: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

interface SupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier;
  onSuccess?: () => void;
}

export const SupplierDialog: React.FC<SupplierDialogProps> = ({
  open,
  onOpenChange,
  supplier,
  onSuccess,
}) => {
  const { toast } = useToast();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      code: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      paymentTerms: "30 Tage netto",
      status: "ACTIVE",
    },
  });

  const status = watch("status");

  // Load supplier data when editing
  useEffect(() => {
    if (supplier) {
      reset({
        name: supplier.name,
        code: supplier.code,
        contactPerson: supplier.contactPerson || "",
        email: supplier.email || "",
        phone: supplier.phone || "",
        address: supplier.address || "",
        paymentTerms: supplier.paymentTerms || "30 Tage netto",
        status: supplier.status,
      });
    } else {
      reset({
        name: "",
        code: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
        paymentTerms: "30 Tage netto",
        status: "ACTIVE",
      });
    }
  }, [supplier, reset]);

  const onSubmit = async (data: SupplierFormData) => {
    try {
      if (supplier) {
        // Update existing supplier
        await updateSupplier.mutateAsync({
          id: supplier.id,
          data: data,
        });
        toast({
          title: "Lieferant aktualisiert",
          description: `${data.name} wurde erfolgreich aktualisiert.`,
        });
      } else {
        // Create new supplier
        await createSupplier.mutateAsync(data);
        toast({
          title: "Lieferant angelegt",
          description: `${data.name} wurde erfolgreich angelegt.`,
        });
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Fehler",
        description: supplier
          ? "Lieferant konnte nicht aktualisiert werden."
          : "Lieferant konnte nicht angelegt werden.",
        variant: "destructive",
      });
    }
  };

  const footerContent = (
    <div className="flex w-full justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => onOpenChange(false)}
        disabled={isSubmitting}
      >
        Abbrechen
      </Button>
      <Button type="submit" disabled={isSubmitting} form="supplier-form">
        {isSubmitting
          ? "Wird gespeichert..."
          : supplier
          ? "Aktualisieren"
          : "Anlegen"}
      </Button>
    </div>
  );

  return (
    <MultiWindowDialog open={open} onOpenChange={onOpenChange}>
      <DialogFrame
        title={
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <span>{supplier ? "Lieferant bearbeiten" : "Neuer Lieferant"}</span>
          </div>
        }
        description={
          supplier
            ? "Bearbeiten Sie die Lieferantendaten."
            : "Legen Sie einen neuen Lieferanten an."
        }
        width="max-w-2xl"
        onClose={() => onOpenChange(false)}
        footer={footerContent}
      >
        <form
          id="supplier-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          {/* Firmenname + Code side-by-side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Firmenname <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Baustoff Weber GmbH"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">
                Lieferantencode <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                {...register("code")}
                placeholder="SUP-001"
                disabled={!!supplier}
              />
              {errors.code && (
                <p className="text-sm text-red-500">{errors.code.message}</p>
              )}
              {supplier && (
                <p className="text-xs text-muted-foreground">
                  Code kann nach Anlage nicht geändert werden
                </p>
              )}
            </div>
          </div>

          {/* Ansprechpartner + Email side-by-side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Ansprechpartner</Label>
              <Input
                id="contactPerson"
                {...register("contactPerson")}
                placeholder="Hans Weber"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="info@lieferant.de"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Phone + Payment Terms side-by-side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="+49 89 123456"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Zahlungsbedingungen</Label>
              <Input
                id="paymentTerms"
                {...register("paymentTerms")}
                placeholder="30 Tage netto"
              />
            </div>
          </div>

          {/* Address + Status side-by-side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                {...register("address")}
                placeholder="Industriestraße 15, 80805 München"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setValue("status", value as "ACTIVE" | "INACTIVE" | "BLOCKED")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Aktiv</SelectItem>
                  <SelectItem value="INACTIVE">Inaktiv</SelectItem>
                  <SelectItem value="BLOCKED">Gesperrt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>
      </DialogFrame>
    </MultiWindowDialog>
  );
};
