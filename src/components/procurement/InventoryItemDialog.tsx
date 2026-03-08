import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { InventoryItem } from '@/services/procurementService';
import { Package, Loader2 } from 'lucide-react';
// Add DialogFrame for standardized layout
import { DialogFrame } from '@/components/ui/dialog-frame';
import { PresetService, type ProductPreset } from '@/services/presetService';

const inventoryItemSchema = z.object({
  sku: z.string().min(1, 'Artikelnummer erforderlich'),
  name: z.string().min(1, 'Artikelname erforderlich'),
  category: z.string().min(1, 'Kategorie erforderlich'),
  unit: z.enum(['pcs', 'm', 'kg', 'l', 'set']),
  onHand: z.coerce.number().min(0, 'Bestand muss positiv sein'),
  reserved: z.coerce.number().min(0, 'Reserviert muss positiv sein'),
  incoming: z.coerce.number().min(0, 'Eingehend muss positiv sein'),
  reorderPoint: z.coerce.number().min(0, 'Mindestbestand muss positiv sein'),
  reorderQuantity: z.coerce.number().min(1, 'Nachbestellmenge muss größer als 0 sein'),
  averageDailyUsage: z.coerce.number().min(0, 'Durchschnittsverbrauch muss positiv sein'),
  leadTimeDays: z.coerce.number().min(0, 'Lieferzeit muss positiv sein'),
  supplierId: z.string().min(1, 'Lieferant erforderlich'),
  supplierName: z.string().min(1, 'Lieferantenname erforderlich'),
  storageLocation: z.string().min(1, 'Lagerplatz erforderlich'),
  unitPrice: z.coerce.number().min(0, 'Preis muss positiv sein'),
});

type InventoryItemFormValues = z.infer<typeof inventoryItemSchema>;

interface InventoryItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: InventoryItem;
  onSuccess?: () => void;
}

const mockSuppliers = [
  { id: 'SUP-001', name: 'Baustoff Weber GmbH' },
  { id: 'SUP-002', name: 'Holz & Mehr AG' },
  { id: 'SUP-003', name: 'Elektro Schmidt' },
  { id: 'SUP-004', name: 'Zementwerke Süd AG' },
  { id: 'SUP-005', name: 'Sanitaer Profi' },
  { id: 'SUP-006', name: 'Dach & Wand Systeme' },
  { id: 'SUP-007', name: 'Farben & Lacke GmbH' },
  { id: 'SUP-008', name: 'Gerüstbau Nord' },
  { id: 'SUP-009', name: 'KlimaTech Solutions' },
  { id: 'SUP-010', name: 'Werkzeug Discount' },
];

const categories = [
  'Stahl & Bewehrung',
  'Beton & Mörtel',
  'Holz & Holzwerkstoffe',
  'Elektromaterial',
  'Sanitär & Heizung',
  'Dach & Fassade',
  'Farben & Lacke',
  'Werkzeuge & Geräte',
  'Technische Gebäudeausrüstung',
  'Dämstoffe',
  'Fliesen & Bodenbelag',
  'Sonstige',
];

export const InventoryItemDialog: React.FC<InventoryItemDialogProps> = ({
  open,
  onOpenChange,
  item,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!item;
  const [productPresets, setProductPresets] = useState<ProductPreset[]>([]);
  const [selectedProductPresetId, setSelectedProductPresetId] = useState<string>('');

  useEffect(() => {
    setProductPresets(PresetService.listProductPresets());
  }, []);

  const form = useForm<InventoryItemFormValues>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: item
      ? {
          sku: item.sku,
          name: item.name,
          category: item.category,
          unit: item.unit,
          onHand: item.onHand,
          reserved: item.reserved,
          incoming: item.incoming,
          reorderPoint: item.reorderPoint,
          reorderQuantity: item.reorderQuantity,
          averageDailyUsage: item.averageDailyUsage,
          leadTimeDays: item.leadTimeDays,
          supplierId: item.supplierId,
          supplierName: item.supplierName,
          storageLocation: item.storageLocation,
          unitPrice: item.unitPrice,
        }
      : {
          sku: '',
          name: '',
          category: '',
          unit: 'pcs',
          onHand: 0,
          reserved: 0,
          incoming: 0,
          reorderPoint: 100,
          reorderQuantity: 500,
          averageDailyUsage: 10,
          leadTimeDays: 7,
          supplierId: '',
          supplierName: '',
          storageLocation: '',
          unitPrice: 0,
        },
  });

  const handleSupplierChange = (supplierId: string) => {
    const supplier = mockSuppliers.find((s) => s.id === supplierId);
    if (supplier) {
      form.setValue('supplierId', supplier.id);
      form.setValue('supplierName', supplier.name);
    }
  };

  const onSubmit = async (data: InventoryItemFormValues) => {
    setIsSubmitting(true);
    try {
      // In a real implementation, this would call ProcurementService.updateInventoryItem or createInventoryItem
      // For now, we'll just show a toast
      await new Promise((resolve) => setTimeout(resolve, 500));

      toast({
        title: isEditMode ? 'Artikel aktualisiert' : 'Artikel erstellt',
        description: `${data.name} wurde erfolgreich ${isEditMode ? 'aktualisiert' : 'erstellt'}.`,
        variant: 'default',
      });

      onSuccess?.();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast({
        title: 'Fehler',
        description:
          error instanceof Error ? error.message : 'Artikel konnte nicht gespeichert werden.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableStock = form.watch('onHand') - form.watch('reserved');
  const status =
    availableStock <= 0 ? 'critical' : availableStock < form.watch('reorderPoint') ? 'warning' : 'healthy';

  const applyProductPreset = () => {
    if (!selectedProductPresetId) return;
    const preset = productPresets.find(p => p.id === selectedProductPresetId);
    if (!preset) return;
    if (preset.sku) form.setValue('sku', preset.sku);
    if (preset.name) form.setValue('name', preset.name);
    if (preset.category) form.setValue('category', preset.category);
    if (preset.unit) form.setValue('unit', preset.unit);
    if (preset.defaultUnitPrice !== undefined) form.setValue('unitPrice', preset.defaultUnitPrice);
    if (preset.supplierId) form.setValue('supplierId', preset.supplierId);
    if (preset.supplierName) form.setValue('supplierName', preset.supplierName);
  };

  const saveProductPresetFromForm = () => {
    const values = form.getValues();
    if (!values.name) return;
    const created = PresetService.createProductPreset({
      name: values.name,
      sku: values.sku,
      category: values.category,
      unit: values.unit,
      defaultUnitPrice: values.unitPrice,
      supplierId: values.supplierId,
      supplierName: values.supplierName,
      currency: 'EUR',
    });
    setProductPresets((prev) => [created, ...prev]);
    setSelectedProductPresetId(created.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogFrame
        showFullscreenToggle
        defaultFullscreen
        width="fit-content"
        minWidth={700}
        maxWidth={1200}
        title={
          <span className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {isEditMode ? 'Artikel bearbeiten' : 'Neuer Lagerartikel'}
          </span>
        }
        description={
          <DialogDescription>
            {isEditMode
              ? 'Bearbeiten Sie die Details des Lagerartikels.'
              : 'Fügen Sie einen neuen Artikel zum Lagerbestand hinzu.'}
          </DialogDescription>
        }
        footer={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
            <Button type="submit" form="inventory-item-form" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting
                ? 'Wird gespeichert...'
                : isEditMode
                ? 'Aktualisieren'
                : 'Erstellen'}
            </Button>
          </div>
        }
      >
        <Form {...form}>
          <form id="inventory-item-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Grunddaten</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={selectedProductPresetId} onValueChange={setSelectedProductPresetId}>
                    <SelectTrigger className="w-[240px]">
                      <SelectValue placeholder="Produkt-Preset wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {productPresets.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}{p.sku ? ` (${p.sku})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="sm" onClick={applyProductPreset} disabled={!selectedProductPresetId}>
                    Preset anwenden
                  </Button>
                  <Button type="button" size="sm" onClick={saveProductPresetFromForm}>
                    Als Preset speichern
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Artikelnummer *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="z.B. STEEL-12MM" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Artikelname *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="z.B. Bewehrungsstahl 12mm" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kategorie *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Kategorie wählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Einheit *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pcs">Stück (pcs)</SelectItem>
                            <SelectItem value="m">Meter (m)</SelectItem>
                            <SelectItem value="kg">Kilogramm (kg)</SelectItem>
                            <SelectItem value="l">Liter (l)</SelectItem>
                            <SelectItem value="set">Set</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stückpreis (EUR) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Inventory Levels */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Bestandsinformationen</h3>
                  <Badge
                    variant={
                      status === 'critical'
                        ? 'destructive'
                        : status === 'warning'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {status === 'critical'
                      ? 'Kritisch'
                      : status === 'warning'
                      ? 'Beobachten'
                      : 'Stabil'}
                  </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="onHand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lagerbestand *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Aktueller physischer Bestand
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reserved"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reserviert</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Für Projekte reserviert
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="incoming"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Eingehend</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          In Bestellung befindlich
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Verfügbar:</span>
                    <span className="font-semibold">
                      {availableStock} {form.watch('unit')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reorder Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Nachbestellungsparameter</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="reorderPoint"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mindestbestand *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Nachbestellung auslösen bei diesem Bestand
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reorderQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nachbestellmenge *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Standardmenge bei Nachbestellung
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="averageDailyUsage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Durchschn. Tagesverbrauch *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Für Bedarfsprognose
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="leadTimeDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lieferzeit (Tage) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Durchschnittliche Lieferzeit
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Supplier & Location */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Lieferant & Lagerort</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hauptlieferant *</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleSupplierChange(value);
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Lieferant auswählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mockSuppliers.map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="storageLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lagerplatz *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="z.B. Lagerplatz A1, Silo 2" />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Physischer Lagerort
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </form>
        </Form>
      </DialogFrame>
    </Dialog>
  );
};
