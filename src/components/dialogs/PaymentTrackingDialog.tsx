import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, CreditCard, Calendar, DollarSign, FileText, Trash2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiWindowDialog } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Invoice, InvoicePayment } from '@/types/invoice';
import { InvoiceService } from '@/services/enhancedInvoiceService';
import { featureFlags } from '@/lib/featureFlags';
import { useToast } from '@/hooks/use-toast';
import { DialogFrame } from '@/components/ui/dialog-frame';

// Payment form validation schema
const paymentSchema = z.object({
  amount: z.number().min(0.01, 'Betrag muss größer als 0 sein'),
  paymentDate: z.string().min(1, 'Zahlungsdatum ist erforderlich'),
  paymentMethod: z.enum(['bank_transfer', 'cash', 'card', 'check'], {
    required_error: 'Zahlungsart ist erforderlich',
  }),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentTrackingDialogProps {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentAdded: (payment: InvoicePayment) => void;
}

const PaymentTrackingDialog: React.FC<PaymentTrackingDialogProps> = ({
  invoice,
  open,
  onOpenChange,
  onPaymentAdded,
}) => {
  const { toast } = useToast();
  const [payments, setPayments] = useState<InvoicePayment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCloudInvoiceMode, setIsCloudInvoiceMode] = useState(
    featureFlags.isEnabled('ENABLE_API_INVOICES')
  );

  useEffect(() => {
    const unsubscribe = featureFlags.subscribe((key, value) => {
      if (key === 'ENABLE_API_INVOICES') {
        setIsCloudInvoiceMode(value);
      }
    });
    return unsubscribe;
  }, []);

  const showCloudUnavailableToast = useCallback(() => {
    toast({
      title: 'Bald verfügbar',
      description: 'Zahlungserfassung für Cloud-Rechnungen ist demnächst verfügbar. Bitte nutzen Sie bis dahin lokale Prozesse.',
    });
  }, [toast]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: invoice.totals.totalDue,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'bank_transfer',
      reference: '',
      notes: '',
    },
  });

  const watchedAmount = watch('amount');

  const loadPayments = useCallback(() => {
    // In a real app, this would fetch from the API
    const allPayments = JSON.parse(localStorage.getItem('bauplan-buddy-invoice-payments') || '[]');
    const invoicePayments = allPayments.filter((p: InvoicePayment) => p.invoiceId === invoice.id);
    setPayments(invoicePayments);
  }, [invoice.id]);

  // Load existing payments when dialog opens
  useEffect(() => {
    if (open) {
      loadPayments();
    }
  }, [open, loadPayments]);

  const onSubmit = async (data: PaymentFormData) => {
    if (isCloudInvoiceMode) {
      showCloudUnavailableToast();
      return;
    }
    setIsLoading(true);
    try {
      const payment = InvoiceService.addPayment({
        invoiceId: invoice.id,
        amount: data.amount,
        paymentDate: data.paymentDate,
        paymentMethod: data.paymentMethod,
        reference: data.reference,
        notes: data.notes,
      });

      setPayments(prev => [...prev, payment]);
      onPaymentAdded(payment);
      reset();
    } catch (error) {
      console.error('Error adding payment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deletePayment = (paymentId: string) => {
    if (isCloudInvoiceMode) {
      showCloudUnavailableToast();
      return;
    }
    // In a real app, this would call the API
    const allPayments = JSON.parse(localStorage.getItem('bauplan-buddy-invoice-payments') || '[]');
    const updatedPayments = allPayments.filter((p: InvoicePayment) => p.id !== paymentId);
    localStorage.setItem('bauplan-buddy-invoice-payments', JSON.stringify(updatedPayments));
    
    setPayments(prev => prev.filter(p => p.id !== paymentId));
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      bank_transfer: 'Banküberweisung',
      cash: 'Barzahlung',
      card: 'Kartenzahlung',
      check: 'Scheck',
    };
    return labels[method as keyof typeof labels] || method;
  };

  const getPaymentStatusBadge = (invoice: Invoice, payments: InvoicePayment[]) => {
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalDue = invoice.totals.totalGross;
    
    if (totalPaid === 0) {
      return <Badge variant="destructive">Unbezahlt</Badge>;
    } else if (totalPaid >= totalDue) {
      return <Badge variant="default" className="bg-green-600">Bezahlt</Badge>;
    } else {
      return <Badge variant="secondary">Teilzahlung</Badge>;
    }
  };

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingAmount = invoice.totals.totalGross - totalPaid;

  return (
    <MultiWindowDialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogFrame
        title={
          <span className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Zahlungen verwalten - Rechnung {invoice.number}
          </span>
        }
        description="Verwalten Sie Zahlungen für diese Rechnung und verfolgen Sie den Zahlungsstatus"
        defaultFullscreen
        showFullscreenToggle

      >
        {isCloudInvoiceMode && (
          <Alert>
            <AlertDescription>
              Zahlungserfassung fuer Cloud-Rechnungen ist noch nicht freigeschaltet. Diese Funktion steht in Kuerze zur Verfuegung.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Invoice Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                Rechnungsübersicht
                {getPaymentStatusBadge(invoice, payments)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Rechnungssumme</p>
                  <p className="font-semibold">{invoice.totals.totalGross.toFixed(2)} {invoice.currency}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Bereits bezahlt</p>
                  <p className="font-semibold text-green-600">{totalPaid.toFixed(2)} {invoice.currency}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Offener Betrag</p>
                  <p className="font-semibold text-red-600">{remainingAmount.toFixed(2)} {invoice.currency}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fälligkeitsdatum</p>
                  <p className="font-semibold">{new Date(invoice.dueDate).toLocaleDateString('de-DE')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Neue Zahlung hinzufügen</CardTitle>
              <CardDescription>Tragen Sie eine neue Zahlung für diese Rechnung ein</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Betrag *</Label>
                    <Input type="number" step="0.01" {...register('amount', { valueAsNumber: true })} disabled={isCloudInvoiceMode} className={errors.amount ? 'border-red-500' : ''} />
                    {errors.amount && (<p className="text-sm text-red-600">{errors.amount.message}</p>)}
                    {watchedAmount > remainingAmount && remainingAmount > 0 && (
                      <Alert>
                        <AlertDescription>
                          Der eingegebene Betrag ist höher als der offene Betrag von {remainingAmount.toFixed(2)} {invoice.currency}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentDate">Zahlungsdatum *</Label>
                    <Input type="date" {...register('paymentDate')} disabled={isCloudInvoiceMode} className={errors.paymentDate ? 'border-red-500' : ''} />
                    {errors.paymentDate && (<p className="text-sm text-red-600">{errors.paymentDate.message}</p>)}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Zahlungsart *</Label>
                    <Select {...register('paymentMethod')} disabled={isCloudInvoiceMode}>
                      <SelectTrigger className={errors.paymentMethod ? 'border-red-500' : ''} disabled={isCloudInvoiceMode}>
                        <SelectValue placeholder="Zahlungsart wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Banküberweisung</SelectItem>
                        <SelectItem value="cash">Barzahlung</SelectItem>
                        <SelectItem value="card">Kartenzahlung</SelectItem>
                        <SelectItem value="check">Scheck</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.paymentMethod && (<p className="text-sm text-red-600">{errors.paymentMethod.message}</p>)}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference">Referenz</Label>
                    <Input {...register('reference')} placeholder="Zahlungsreferenz oder Transaktions-ID" disabled={isCloudInvoiceMode} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notizen</Label>
                  <Textarea {...register('notes')} placeholder="Zusätzliche Notizen zur Zahlung..." disabled={isCloudInvoiceMode} className="min-h-[80px]" />
                </div>
                <Button type="submit" disabled={isSubmitting || isLoading || isCloudInvoiceMode} className="w-full md:w-auto">
                  {isSubmitting || isLoading ? (<>Zahlung wird hinzugefügt...</>) : (<><Plus className="h-4 w-4 mr-2" />Zahlung hinzufügen</>)}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Existing Payments */}
          {payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bisherige Zahlungen</CardTitle>
                <CardDescription>Übersicht aller eingegangenen Zahlungen</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="font-medium">{payment.amount.toFixed(2)} {invoice.currency}</p>
                          <p className="text-sm text-muted-foreground">{getPaymentMethodLabel(payment.paymentMethod)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{new Date(payment.paymentDate).toLocaleDateString('de-DE')}</p>
                          <p className="text-sm text-muted-foreground">Zahlungsdatum</p>
                        </div>
                        <div>
                          {payment.reference && (<><p className="text-sm font-medium">{payment.reference}</p><p className="text-sm text-muted-foreground">Referenz</p></>)}
                        </div>
                        <div>
                          {payment.notes && (<><p className="text-sm">{payment.notes}</p><p className="text-sm text-muted-foreground">Notizen</p></>)}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => deletePayment(payment.id)} disabled={isCloudInvoiceMode} className="ml-4">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Gesamte Zahlungen</p>
                      <p className="font-bold text-lg">{totalPaid.toFixed(2)} {invoice.currency}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Verbleibendes Guthaben</p>
                      <p className={`font-bold text-lg ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>{remainingAmount.toFixed(2)} {invoice.currency}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <div className="pt-1">
                        {remainingAmount <= 0 ? (
                          <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Vollständig bezahlt</Badge>
                        ) : (
                          <Badge variant="secondary">{totalPaid > 0 ? 'Teilweise bezahlt' : 'Unbezahlt'}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogFrame>
    </MultiWindowDialog>
  );
};

export default PaymentTrackingDialog;
