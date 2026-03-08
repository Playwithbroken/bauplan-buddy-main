import React, { useState, useEffect } from 'react';
import { MultiWindowDialog } from '../ui/dialog';
import { DialogFrame } from '../ui/dialog-frame';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Check,
  FileText,
  Mail,
  Download,
  Calendar,
  User,
  Euro,
  Hash,
  Loader2,
  Send
} from 'lucide-react';
import DocumentNumberingService from '../../services/documentNumberingService';
import OrderConfirmationStatusService, { OrderConfirmationStatus } from '../../services/orderConfirmationStatusService';
import { OrderConfirmationStatusManager } from '../status/OrderConfirmationStatusManager';
import { useToast } from '../../hooks/use-toast';

interface OrderConfirmationPosition {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  deliveryDate?: string;
  notes?: string;
}

interface OrderConfirmationData {
  id: string;
  number: string;
  date: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  customerEmail?: string;
  projectId?: string;
  projectName?: string;
  quoteReference?: string;
  positions: OrderConfirmationPosition[];
  subtotal: number;
  taxAmount: number;
  total: number;
  deliveryDate: string;
  validityDate: string;
  paymentTerms: string;
  deliveryTerms: string;
  notes?: string;
  status: 'draft' | 'sent' | 'confirmed' | 'cancelled';
  createdBy: string;
  createdAt: string;
  sentAt?: string;
}

interface OrderConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteData?: {
    id: string;
    number: string;
    customer: string;
    customerId: string;
    customerEmail?: string;
    customerAddress?: string;
    projectName?: string;
    positions: Array<{
      id: string;
      description: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      total: number;
    }>;
    amount: number;
  };
  onOrderConfirmationCreated?: (orderConfirmation: OrderConfirmationData) => void;
}

export function OrderConfirmationDialog({
  open,
  onOpenChange,
  quoteData,
  onOrderConfirmationCreated
}: OrderConfirmationDialogProps) {
  const { toast } = useToast();
  const numberingService = DocumentNumberingService;
  const statusService = OrderConfirmationStatusService.getInstance();

  const [activeTab, setActiveTab] = useState('details');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<OrderConfirmationStatus>('draft');

  const [orderData, setOrderData] = useState<Partial<OrderConfirmationData>>({
    number: '',
    date: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 weeks
    validityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 month
    customerId: '',
    customerName: '',
    customerAddress: '',
    customerEmail: '',
    projectName: '',
    positions: [],
    paymentTerms: 'Zahlbar nach Auftragsfertigstellung.',
    deliveryTerms: 'Lieferung frei Baustelle.',
    status: 'draft'
  });

  // Initialize order confirmation data when dialog opens
  useEffect(() => {
    if (open) {
      let initialData: Partial<OrderConfirmationData> = {
        number: numberingService.generateNumber('order_confirmation').number,
        date: new Date().toISOString().split('T')[0],
        deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        validityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        positions: [],
        paymentTerms: 'Zahlbar nach Auftragsfertigstellung.',
        deliveryTerms: 'Lieferung frei Baustelle.',
        status: 'draft'
      };

      if (quoteData) {
        initialData = {
          ...initialData,
          customerId: quoteData.customerId,
          customerName: quoteData.customer,
          customerEmail: quoteData.customerEmail || '',
          customerAddress: quoteData.customerAddress || '',
          projectName: quoteData.projectName || '',
          quoteReference: quoteData.number,
          positions: quoteData.positions.map(pos => ({
            ...pos,
            deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          })) as OrderConfirmationPosition[]
        };
      }

      setOrderData(initialData);
    }
  }, [open, quoteData, numberingService]);

  const calculateTotals = () => {
    if (!orderData.positions || orderData.positions.length === 0) {
      return { subtotal: 0, taxAmount: 0, total: 0 };
    }
    
    const subtotal = orderData.positions.reduce((sum, pos) => sum + pos.total, 0);
    const taxAmount = subtotal * 0.19; // 19% VAT
    const total = subtotal + taxAmount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  };

  const handleGenerateOrderConfirmation = async () => {
    if (!orderData.positions || orderData.positions.length === 0) {
      toast({
        title: "Keine Positionen",
        description: "Bitte fügen Sie mindestens eine Position hinzu.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const totals = calculateTotals();
      const completeOrderData: OrderConfirmationData = {
        ...orderData,
        id: orderData.id || Date.now().toString(),
        number: orderData.number!,
        customerId: orderData.customerId!,
        customerName: orderData.customerName!,
        customerAddress: orderData.customerAddress!,
        positions: orderData.positions!,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        total: totals.total,
        paymentTerms: orderData.paymentTerms!,
        deliveryTerms: orderData.deliveryTerms!,
        status: 'draft',
        createdBy: 'current-user',
        createdAt: new Date().toISOString(),
        date: orderData.date!,
        deliveryDate: orderData.deliveryDate!,
        validityDate: orderData.validityDate!
      };

      // Simulate PDF generation
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast({
        title: "Auftragsbestätigung erstellt",
        description: `Auftragsbestätigung ${orderData.number} wurde erfolgreich erstellt.`,
      });

      if (onOrderConfirmationCreated) {
        onOrderConfirmationCreated(completeOrderData);
      }

      setActiveTab('preview');
    } catch (error) {
      console.error('Failed to generate order confirmation:', error);
      toast({
        title: "Fehler",
        description: "Die Auftragsbestätigung konnte nicht erstellt werden.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!orderData.customerEmail) {
      toast({
        title: "Keine E-Mail Adresse",
        description: "Bitte geben Sie eine E-Mail Adresse des Kunden ein.",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    try {
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "E-Mail versendet",
        description: `Die Auftragsbestätigung wurde an ${orderData.customerEmail} gesendet.`,
      });

      // Update status to sent
      setOrderData(prev => ({ 
        ...prev, 
        status: 'sent',
        sentAt: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Failed to send email:', error);
      toast({
        title: "E-Mail Fehler",
        description: "Die E-Mail konnte nicht gesendet werden.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const totals = calculateTotals();

  return (
    <MultiWindowDialog open={open} onOpenChange={onOpenChange} modal={false}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
        <DialogFrame
          title={
            <span className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Auftragsbestätigung erstellen
            </span>
          }
          width="fit-content"
          minWidth={900}
          maxWidth={1600}
          preventOutsideClose={true}
          resizable={true}
          defaultFullscreen
          showFullscreenToggle
          headerActions={
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="positions">Positionen</TabsTrigger>
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="preview">Vorschau</TabsTrigger>
            </TabsList>
          }
          footer={
            <div className="flex-shrink-0">

              {activeTab === 'details' && (
                <Button onClick={handleGenerateOrderConfirmation} disabled={isGenerating}>
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Auftragsbestätigung erstellen
                </Button>
              )}
            </div>
          }
        >
          <div className="flex items-center justify-between mb-4 text-xs text-muted-foreground">
            <span>{/* backendInfo */}</span>
          </div>

          <div className="flex-1 overflow-auto">
            <TabsContent value="details" className="space-y-6 mt-4">
              {/* Order Details and Customer Details sections */}
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Auftragsdetails</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="number">Auftragsbestätigungsnummer</Label>
                      <Input id="number" value={orderData.number || ''} readOnly className="bg-gray-50 dark:bg-gray-800" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Datum</Label>
                        <Input id="date" type="date" value={orderData.date || ''} onChange={(e) => setOrderData(prev => ({ ...prev, date: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="validityDate">Gültig bis</Label>
                        <Input id="validityDate" type="date" value={orderData.validityDate || ''} onChange={(e) => setOrderData(prev => ({ ...prev, validityDate: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deliveryDate">Liefertermin</Label>
                      <Input id="deliveryDate" type="date" value={orderData.deliveryDate || ''} onChange={(e) => setOrderData(prev => ({ ...prev, deliveryDate: e.target.value }))} />
                    </div>
                    {quoteData && (
                      <div className="space-y-2">
                        <Label htmlFor="quoteReference">Angebotsbezug</Label>
                        <Input id="quoteReference" value={`Angebot ${quoteData.number}`} readOnly className="bg-gray-50 dark:bg-gray-800" />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Kundendaten</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerName">Kundenname</Label>
                      <Input id="customerName" value={orderData.customerName || ''} onChange={(e) => setOrderData(prev => ({ ...prev, customerName: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerAddress">Adresse</Label>
                      <Textarea id="customerAddress" value={orderData.customerAddress || ''} onChange={(e) => setOrderData(prev => ({ ...prev, customerAddress: e.target.value }))} rows={3} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerEmail">E-Mail</Label>
                      <Input id="customerEmail" type="email" value={orderData.customerEmail || ''} onChange={(e) => setOrderData(prev => ({ ...prev, customerEmail: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="projectName">Projektname</Label>
                      <Input id="projectName" value={orderData.projectName || ''} onChange={(e) => setOrderData(prev => ({ ...prev, projectName: e.target.value }))} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Zahlungsbedingungen</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea value={orderData.paymentTerms || ''} onChange={(e) => setOrderData(prev => ({ ...prev, paymentTerms: e.target.value }))} rows={3} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Lieferbedingungen</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea value={orderData.deliveryTerms || ''} onChange={(e) => setOrderData(prev => ({ ...prev, deliveryTerms: e.target.value }))} rows={3} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="positions" className="space-y-6 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Auftragspositionen</CardTitle>
                </CardHeader>
                <CardContent>
                  {orderData.positions && orderData.positions.length > 0 ? (
                    <div className="space-y-4">
                      {orderData.positions.map((position, index) => (
                        <div key={position.id} className="border rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                            <div className="md:col-span-2">
                              <Label className="text-sm">Beschreibung</Label>
                              <div className="font-medium">{position.description}</div>
                            </div>
                            <div>
                              <Label className="text-sm">Menge</Label>
                              <div>{position.quantity} {position.unit}</div>
                            </div>
                            <div>
                              <Label className="text-sm">Einzelpreis</Label>
                              <div>€{position.unitPrice.toFixed(2)}</div>
                            </div>
                            <div>
                              <Label className="text-sm">Gesamtpreis</Label>
                              <div className="font-semibold">€{position.total.toFixed(2)}</div>
                            </div>
                            <div>
                              <Label className="text-sm">Liefertermin</Label>
                              <Input
                                type="date"
                                value={position.deliveryDate || orderData.deliveryDate || ''}
                                onChange={(e) => {
                                  const updatedPositions = [...(orderData.positions || [])];
                                  updatedPositions[index] = { ...position, deliveryDate: e.target.value };
                                  setOrderData(prev => ({ ...prev, positions: updatedPositions }));
                                }}
                                className="text-sm"
                              />
                            </div>
                          </div>
                          {position.notes && (
                            <div className="mt-2">
                              <Label className="text-sm">Anmerkungen</Label>
                              <div className="text-sm text-muted-foreground">{position.notes}</div>
                            </div>
                          )}
                        </div>
                      ))}
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <div className="space-y-2">
                          <div className="flex justify-between"><span>Zwischensumme:</span><span>€{totals.subtotal.toFixed(2)}</span></div>
                          <div className="flex justify-between"><span>MwSt. (19%):</span><span>€{totals.taxAmount.toFixed(2)}</span></div>
                          <Separator />
                          <div className="flex justify-between font-bold text-lg"><span>Gesamtbetrag:</span><span>€{totals.total.toFixed(2)}</span></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Keine Positionen vorhanden</p>
                      <p className="text-sm">Positionen werden aus dem Angebot übernommen</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="status" className="space-y-6 mt-4">
              <OrderConfirmationStatusManager
                orderConfirmationId={orderData.id || 'new'}
                currentStatus={currentStatus}
                onStatusChange={(newStatus, event) => {
                  setCurrentStatus(newStatus);
                  setOrderData(prev => ({ 
                    ...prev, 
                    status: newStatus,
                    sentAt: newStatus === 'sent' ? new Date().toISOString() : prev.sentAt
                  }));
                  const statusInfo = statusService.getStatusInfo(newStatus);
                  toast({ title: 'Status aktualisiert', description: `Status wurde zu "${statusInfo.label}" geändert` });
                }}
                showHistory={true}
                context={{ hasPositions: orderData.positions && orderData.positions.length > 0, hasCustomerEmail: !!orderData.customerEmail, customerConfirmation: false }}
              />
            </TabsContent>

            <TabsContent value="preview" className="space-y-6 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Auftragsbestätigung Vorschau</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Check className="h-16 w-16 mx-auto mb-4 text-green-600" />
                    <h3 className="text-lg font-semibold mb-2">Auftragsbestätigung bereit</h3>
                    <p className="text-muted-foreground mb-4">Nummer: {orderData.number}</p>
                    <div className="flex justify-center gap-4">
                      <Button variant="outline"><Download className="h-4 w-4 mr-2" />PDF herunterladen</Button>
                      <Button onClick={handleSendEmail} disabled={isSending || !orderData.customerEmail}>
                        {isSending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                        Per E-Mail versenden
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </DialogFrame>
      </Tabs>
    </MultiWindowDialog>
  );
}
