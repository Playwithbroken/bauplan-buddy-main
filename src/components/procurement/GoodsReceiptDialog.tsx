import React, { useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { ProcurementService, ProcurementOrder } from '@/services/procurementService';
import { PackageCheck, AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
// Add DialogFrame for standardized layout
import { DialogFrame } from '@/components/ui/dialog-frame';

const receiptLineSchema = z.object({
  lineId: z.string(),
  receivedQuantity: z.coerce.number().min(0, 'Menge muss positiv sein'),
  isComplete: z.boolean(),
  qualityCheck: z.enum(['passed', 'failed', 'pending']).default('pending'),
  notes: z.string().optional(),
});

const goodsReceiptSchema = z.object({
  orderId: z.string().min(1, 'Bestellung erforderlich'),
  receivedBy: z.string().min(1, 'Empf盲nger erforderlich'),
  receiptDate: z.date({
    required_error: 'Eingangsdatum erforderlich',
  }),
  overallQuality: z.enum(['passed', 'partial', 'failed']).default('passed'),
  deliveryNotes: z.string().optional(),
  lines: z.array(receiptLineSchema).min(1, 'Mindestens eine Position erforderlich'),
});

type GoodsReceiptFormValues = z.infer<typeof goodsReceiptSchema>;

interface GoodsReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: ProcurementOrder;
  onSuccess?: () => void;
}

export const GoodsReceiptDialog: React.FC<GoodsReceiptDialogProps> = ({
  open,
  onOpenChange,
  order,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<GoodsReceiptFormValues>({
    resolver: zodResolver(goodsReceiptSchema),
    defaultValues: {
      orderId: order.id,
      receivedBy: 'Admin User',
      receiptDate: new Date(),
      overallQuality: 'passed',
      deliveryNotes: '',
      lines: order.lines.map((line) => ({
        lineId: line.lineId,
        receivedQuantity: line.status === 'pending' ? line.quantity : 0,
        isComplete: line.status === 'pending',
        qualityCheck: 'pending' as const,
        notes: '',
      })),
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: 'lines',
  });

  const totalReceived = useMemo(() => {
    return fields.reduce((total, _, index) => {
      const quantity = form.watch(`lines.${index}.receivedQuantity`) || 0;
      return total + quantity;
    }, 0);
  }, [fields, form]);

  const allLinesComplete = useMemo(() => {
    return fields.every((_, index) => {
      const isComplete = form.watch(`lines.${index}.isComplete`);
      return isComplete;
    });
  }, [fields, form]);

  const onSubmit = async (data: GoodsReceiptFormValues) => {
    setIsSubmitting(true);
    try {
      // Process goods receipt
      for (const line of data.lines) {
        if (line.receivedQuantity > 0) {
          const orderLine = order.lines.find((ol) => ol.lineId === line.lineId);
          if (orderLine) {
            // Update inventory
            ProcurementService.updateInventoryQuantity(
              orderLine.inventoryId,
              line.receivedQuantity,
              `Wareneingang ${order.orderNumber} - ${line.receivedQuantity} empfangen`
            );
          }
        }
      }

      toast({
        title: 'Wareneingang gebucht',
        description: `${totalReceived} Artikel wurden zum Lager hinzugef眉gt.`,
        variant: 'default',
      });

      onSuccess?.();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast({
        title: 'Fehler',
        description:
          error instanceof Error ? error.message : 'Wareneingang konnte nicht gebucht werden.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
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
            <PackageCheck className="h-5 w-5" />
            Wareneingang - {order.orderNumber}
          </span>
        }
        description={
          <DialogDescription>
            Erfassen Sie den Wareneingang und prüfen Sie die gelieferte Ware.
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
            <Button type="submit" form="goods-receipt-form" disabled={isSubmitting || totalReceived === 0}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Wird gebucht...' : 'Wareneingang buchen'}
            </Button>
          </div>
        }
      >
        <Form {...form}>
          <form id="goods-receipt-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-6">
              {/* Order Information */}
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="grid gap-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Lieferant:</span>
                    <span className="font-medium">{order.supplierName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Bestellnummer:</span>
                    <span className="font-medium">{order.orderNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Erwartete Lieferung:</span>
                    <span className="font-medium">
                      {format(new Date(order.expectedDelivery), 'dd.MM.yyyy', { locale: de })}
                    </span>
                  </div>
                  {order.projectName && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Projekt:</span>
                      <span className="font-medium">{order.projectName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Receipt Details */}
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="receivedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empfangen von *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Name des Empfängers" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="receiptDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Eingangsdatum</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="overallQuality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gesamtbewertung</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="passed">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span>Akzeptiert - Keine Mängel</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="partial">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <span>Teilweise akzeptiert - Mit Vorbehalten</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="failed">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span>Abgelehnt - Qualitätsmängel</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Receipt Lines */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Positionen prüfen</h3>

                {fields.map((field, index) => {
                  const orderLine = order.lines[index];
                  const receivedQty = form.watch(`lines.${index}.receivedQuantity`) || 0;
                  const isComplete = form.watch(`lines.${index}.isComplete`);
                  const qualityCheck = form.watch(`lines.${index}.qualityCheck`);
                  const completionPercentage = Math.min(
                    (receivedQty / orderLine.quantity) * 100,
                    100
                  );

                  return (
                    <div key={field.id} className="space-y-4 rounded-lg border bg-card p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium">{orderLine.description}</h4>
                          <p className="text-xs text-muted-foreground">SKU: {orderLine.sku}</p>
                          <div className="mt-2 flex items-center gap-4 text-xs">
                            <span className="text-muted-foreground">
                              Bestellt: <span className="font-medium">{orderLine.quantity}</span>
                            </span>
                            <Separator orientation="vertical" className="h-3" />
                            <span className="text-muted-foreground">
                              Ausstehend:{' '}
                              <span className="font-medium">
                                {orderLine.quantity - receivedQty}
                              </span>
                            </span>
                          </div>
                        </div>
                        <FormField
                          control={form.control}
                          name={`lines.${index}.isComplete`}
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-xs font-normal">Vollständig</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Fortschritt</span>
                          <span className="font-medium">{completionPercentage.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className={cn(
                              'h-full transition-all',
                              completionPercentage >= 100
                                ? 'bg-green-600'
                                : completionPercentage >= 50
                                ? 'bg-blue-600'
                                : 'bg-amber-600'
                            )}
                            style={{ width: `${completionPercentage}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.receivedQuantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Empfangene Menge *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  max={orderLine.quantity}
                                  step="1"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormDescription className="text-xs">
                                Max: {orderLine.quantity}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`lines.${index}.qualityCheck`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Qualität</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="pending">Ausstehend</SelectItem>
                                  <SelectItem value="passed">Akzeptiert</SelectItem>
                                  <SelectItem value="failed">Abgelehnt</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex flex-col justify-end">
                          <FormLabel>Status</FormLabel>
                          <div className="flex h-10 items-center">
                            <Badge
                              variant={
                                qualityCheck === 'passed'
                                  ? 'default'
                                  : qualityCheck === 'failed'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {qualityCheck === 'passed'
                                ? 'Geprüft'
                                : qualityCheck === 'failed'
                                ? 'Beanstandet'
                                : 'Prüfung ausst.'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name={`lines.${index}.notes`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Anmerkungen</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Notizen zu dieser Position (z.B. Schäden, Abweichungen)..."
                                rows={2}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Delivery Notes */}
              <FormField
                control={form.control}
                name="deliveryNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lieferschein / Allgemeine Notizen</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Lieferscheinnummer, Bemerkungen zum Transport, etc..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Summary */}
              <div className="rounded-lg border bg-muted/50 p-4">
                <h4 className="mb-3 text-sm font-semibold">Zusammenfassung</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Gesamt empfangen:</span>
                    <span className="font-medium">{totalReceived} Artikel</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={allLinesComplete ? 'default' : 'secondary'}>
                      {allLinesComplete ? 'Komplett' : 'Teillieferung'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </DialogFrame>
    </Dialog>
  );
};
