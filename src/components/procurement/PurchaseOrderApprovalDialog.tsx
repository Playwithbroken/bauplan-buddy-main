import React, { useState } from 'react';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { ProcurementOrder } from '@/services/procurementService';
import { CheckCircle2, XCircle, Clock, User, AlertCircle, FileText, Euro, Calendar, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '@/lib/utils';
import { DialogFrame } from '@/components/ui/dialog-frame';

const approvalSchema = z.object({
  comment: z.string().optional(),
  action: z.enum(['approve', 'reject']),
});

type ApprovalFormValues = z.infer<typeof approvalSchema>;

interface PurchaseOrderApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: ProcurementOrder;
  onApprove?: (orderId: string, comment?: string) => void;
  onReject?: (orderId: string, comment: string) => void;
}

export const PurchaseOrderApprovalDialog: React.FC<PurchaseOrderApprovalDialogProps> = ({
  open,
  onOpenChange,
  order,
  onApprove,
  onReject,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject' | null>(null);

  const form = useForm<ApprovalFormValues>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      comment: '',
      action: 'approve',
    },
  });

  const eurFormatter = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  });

  const handleApproval = async (action: 'approve' | 'reject') => {
    setSelectedAction(action);
    form.setValue('action', action);

    if (action === 'reject' && !form.getValues('comment')) {
      toast({
        title: 'Kommentar erforderlich',
        description: 'Bitte geben Sie einen Grund für die Ablehnung an.',
        variant: 'destructive',
      });
      return;
    }

    const data = form.getValues();
    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call

      if (action === 'approve') {
        onApprove?.(order.id, data.comment);
        toast({
          title: 'Bestellung genehmigt',
          description: `Bestellung ${order.orderNumber} wurde freigegeben.`,
          variant: 'default',
        });
      } else {
        onReject?.(order.id, data.comment || 'Abgelehnt ohne Kommentar');
        toast({
          title: 'Bestellung abgelehnt',
          description: `Bestellung ${order.orderNumber} wurde abgelehnt.`,
          variant: 'destructive',
        });
      }

      onOpenChange(false);
      form.reset();
      setSelectedAction(null);
    } catch (error) {
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Aktion konnte nicht durchgeführt werden.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const requiresHigherApproval = order.totalAmount > 10000;
  const currentApprover = 'Max Schneider'; // Mock current user

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogFrame
        title={
          <span className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Bestellung genehmigen - {order.orderNumber}
          </span>
        }
        description="Prüfen Sie die Bestellung und entscheiden Sie über die Freigabe"
        defaultFullscreen
        showFullscreenToggle
        footer={
          <div className="flex gap-2 sm:justify-between flex-shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Abbrechen
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="destructive" onClick={() => handleApproval('reject')} disabled={isSubmitting} className="gap-2">
                {isSubmitting && selectedAction === 'reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                {isSubmitting && selectedAction === 'reject' ? 'Wird abgelehnt...' : 'Ablehnen'}
              </Button>
              <Button type="button" onClick={() => handleApproval('approve')} disabled={isSubmitting} className="gap-2">
                {isSubmitting && selectedAction === 'approve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {isSubmitting && selectedAction === 'approve' ? 'Wird genehmigt...' : 'Genehmigen'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bestellübersicht</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Anforderer</p>
                    <p className="text-sm font-medium">{order.requestedBy}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Lieferdatum</p>
                    <p className="text-sm font-medium">{format(new Date(order.expectedDelivery), 'dd.MM.yyyy', { locale: de })}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Lieferant</p>
                    <p className="text-sm font-medium">{order.supplierName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Euro className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Gesamtbetrag</p>
                    <p className="text-sm font-bold">{eurFormatter.format(order.totalAmount)}</p>
                  </div>
                </div>
              </div>

              {order.projectName && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Projekt</p>
                  <p className="text-sm font-medium">{order.projectName}</p>
                  {order.costCentre && <p className="text-xs text-muted-foreground mt-1">Kostenstelle: {order.costCentre}</p>}
                </div>
              )}

              {order.notes && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Notizen</p>
                  <p className="text-sm">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Lines */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Positionen ({order.lines.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {order.lines.map((line) => (
                <div key={line.lineId} className="flex items-start justify-between rounded-lg border p-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{line.description}</p>
                    <p className="text-xs text-muted-foreground">SKU: {line.sku}</p>
                    {line.targetProjectName && <Badge variant="secondary" className="mt-1 text-xs">{line.targetProjectName}</Badge>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{line.quantity} × {eurFormatter.format(line.unitPrice)}</p>
                    <p className="text-xs text-muted-foreground">= {eurFormatter.format(line.quantity * line.unitPrice)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Approval Requirements */}
          {requiresHigherApproval && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-amber-900">
                  <AlertCircle className="h-5 w-5" />
                  Genehmigung erforderlich
                </CardTitle>
                <CardDescription className="text-amber-700">Bestellungen über 10.000 EUR erfordern eine zusätzliche Genehmigung</CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Approval History */}
          {order.timeline && order.timeline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Verlauf</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.timeline.map((event, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium capitalize">{event.status === 'submitted' ? 'Erstellt' : event.status === 'approved' ? 'Genehmigt' : event.status}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(event.timestamp), 'dd.MM.yyyy HH:mm', { locale: de })}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">von {event.actor}</p>
                      {event.comment && <p className="text-xs text-muted-foreground mt-1 italic">"{event.comment}"</p>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Comment Section */}
          <Form {...form}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Kommentar</CardTitle>
                <CardDescription>{selectedAction === 'reject' ? 'Bitte geben Sie einen Grund für die Ablehnung an' : 'Optional: Fügen Sie einen Kommentar hinzu'}</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea {...field} placeholder="Kommentar zur Genehmigung/Ablehnung..." rows={4} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </Form>

          {/* Current Approver Info */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm text-blue-900"><strong>Genehmiger:</strong> {currentApprover}</p>
            <p className="text-xs text-blue-700 mt-1">Sie sind befugt, diese Bestellung {requiresHigherApproval ? 'vorzuprüfen' : 'freizugeben'}.</p>
          </div>
        </div>
      </DialogFrame>
    </Dialog>
  );
};
