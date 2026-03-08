import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAdjustStock } from '@/hooks/useProcurementApi';
import type { InventoryItem } from '@/types/procurement';
import { Package, TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const adjustmentSchema = z.object({
  adjustmentType: z.enum(['increase', 'decrease', 'set']),
  quantity: z.number().positive('Menge muss größer als 0 sein'),
  reason: z.string().min(3, 'Bitte geben Sie einen Grund an'),
  reference: z.string().optional(),
});

type AdjustmentFormData = z.infer<typeof adjustmentSchema>;

interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: InventoryItem;
  onSuccess?: () => void;
}

export const StockAdjustmentDialog: React.FC<StockAdjustmentDialogProps> = ({
  open,
  onOpenChange,
  item,
  onSuccess,
}) => {
  const { toast } = useToast();
  const adjustStock = useAdjustStock();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      adjustmentType: 'increase',
      quantity: 0,
      reason: '',
      reference: '',
    },
  });

  const adjustmentType = watch('adjustmentType');
  const quantity = watch('quantity');

  const calculateNewStock = () => {
    if (!item || !quantity) return item?.onHand || 0;
    
    switch (adjustmentType) {
      case 'increase':
        return item.onHand + quantity;
      case 'decrease':
        return Math.max(0, item.onHand - quantity);
      case 'set':
        return quantity;
      default:
        return item.onHand;
    }
  };

  const onSubmit = async (data: AdjustmentFormData) => {
    if (!item) return;

    try {
      await adjustStock.mutateAsync({
        id: item.id,
        adjustmentType: data.adjustmentType,
        quantity: data.quantity,
        reason: data.reason,
        reference: data.reference,
      });

      toast({
        title: 'Bestand angepasst',
        description: `Lagerbestand für ${item.name} wurde erfolgreich angepasst.`,
      });

      onOpenChange(false);
      reset();
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Bestandsanpassung fehlgeschlagen.',
        variant: 'destructive',
      });
    }
  };

  if (!item) return null;

  const newStock = calculateNewStock();
  const available = item.onHand - item.reserved;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <DialogTitle>Lagerbestand anpassen</DialogTitle>
          </div>
          <DialogDescription>
            Passen Sie den Lagerbestand für {item.name} ({item.sku}) an.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Stock Info */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Aktuell</p>
                <p className="text-lg font-semibold">{item.onHand} {item.unit}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Reserviert</p>
                <p className="text-lg font-semibold">{item.reserved} {item.unit}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Verfügbar</p>
                <p className="text-lg font-semibold">{available} {item.unit}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Adjustment Type */}
            <div className="space-y-2">
              <Label htmlFor="adjustmentType">
                Anpassungstyp <span className="text-red-500">*</span>
              </Label>
              <Select
                value={adjustmentType}
                onValueChange={(value) =>
                  setValue('adjustmentType', value as 'increase' | 'decrease' | 'set')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="increase">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span>Erhöhen (Zugang)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="decrease">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <span>Verringern (Abgang)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="set">
                    <div className="flex items-center gap-2">
                      <RefreshCcw className="h-4 w-4 text-blue-600" />
                      <span>Setzen (Inventur)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Menge ({item.unit}) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                {...register('quantity', { valueAsNumber: true })}
                placeholder="0"
              />
              {errors.quantity && (
                <p className="text-sm text-red-500">{errors.quantity.message}</p>
              )}
            </div>

            {/* New Stock Preview */}
            {quantity > 0 && (
              <div className="rounded-lg border bg-primary/5 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Neuer Bestand:</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={newStock >= item.reorderPoint ? 'default' : 'destructive'}>
                      {newStock} {item.unit}
                    </Badge>
                    {adjustmentType === 'increase' && (
                      <span className="text-xs text-green-600">+{quantity}</span>
                    )}
                    {adjustmentType === 'decrease' && (
                      <span className="text-xs text-red-600">-{quantity}</span>
                    )}
                  </div>
                </div>
                {newStock < item.reorderPoint && (
                  <p className="mt-2 text-xs text-amber-600">
                    ⚠️ Achtung: Neuer Bestand liegt unter dem Mindestbestand ({item.reorderPoint} {item.unit})
                  </p>
                )}
              </div>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">
                Grund <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reason"
                {...register('reason')}
                placeholder="z.B. Inventurkorrektur, Schwund, manuelle Korrektur..."
                rows={3}
              />
              {errors.reason && (
                <p className="text-sm text-red-500">{errors.reason.message}</p>
              )}
            </div>

            {/* Reference */}
            <div className="space-y-2">
              <Label htmlFor="reference">Referenz (optional)</Label>
              <Input
                id="reference"
                {...register('reference')}
                placeholder="Belegnummer, Inventur-ID, etc."
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  reset();
                }}
                disabled={isSubmitting}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Wird gespeichert...' : 'Bestand anpassen'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
