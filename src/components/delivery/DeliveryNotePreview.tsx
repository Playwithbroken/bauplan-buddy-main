import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Printer, Download, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DeliveryNoteService, { type DeliveryNote } from '@/services/deliveryNoteService';

interface DeliveryNotePreviewProps {
  deliveryNote: DeliveryNote;
  onPrint?: () => void;
  onDownload?: () => void;
  onStatusChange?: (status: DeliveryNote['status']) => void;
  isStatusUpdating?: boolean;
}

const statusOptions: { value: DeliveryNote['status']; label: string }[] = [
  { value: 'draft', label: 'Entwurf' },
  { value: 'sent', label: 'Versendet' },
  { value: 'delivered', label: 'Geliefert' },
  { value: 'cancelled', label: 'Storniert' }
];

const deliveryMethodLabel: Record<string, string> = {
  pickup: 'Abholung',
  delivery: 'Lieferung',
  express: 'Express-Lieferung',
  special: 'Sondertransport'
};

const formatDate = (value?: string) => {
  if (!value) {
    return '-';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value || '-';
  }
  return parsed.toLocaleDateString('de-DE');
};

export const DeliveryNotePreview: React.FC<DeliveryNotePreviewProps> = ({
  deliveryNote,
  onPrint,
  onDownload,
  onStatusChange,
  isStatusUpdating = false
}) => {
  const { toast } = useToast();
  const statusDisabled = !onStatusChange || isStatusUpdating;
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }
    window.print();
  };

  const handleDownload = async () => {
    if (onDownload) {
      onDownload();
      return;
    }

    try {
      setIsDownloading(true);
      const blob = await DeliveryNoteService.generatePDF(deliveryNote);
      const filename = `${(deliveryNote.number || 'lieferschein').toLowerCase().replace(/\s+/g, '_')}.pdf`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      toast({
        title: 'PDF erstellt',
        description: `Der Lieferschein wurde als ${filename} gespeichert.`
      });
    } catch (error) {
      toast({
        title: 'Download fehlgeschlagen',
        description:
          error instanceof Error ? error.message : 'Das PDF konnte nicht erstellt werden.',
        variant: 'destructive'
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-3">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>Status</span>
          <Select
            value={deliveryNote.status}
            onValueChange={value => onStatusChange?.(value as DeliveryNote['status'])}
            disabled={statusDisabled}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status waehlen" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Drucken
          </Button>
          <Button variant="outline" onClick={handleDownload} disabled={isDownloading}>
            {isDownloading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isDownloading ? 'Speichert...' : 'PDF speichern'}
          </Button>
          {onStatusChange && deliveryNote.status !== 'delivered' && (
            <Button onClick={() => onStatusChange('delivered')} disabled={isStatusUpdating}>
              {isStatusUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Aktualisiere...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Als geliefert markieren
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <Card className="max-w-4xl mx-auto border">
        <CardContent className="p-8 space-y-8">
          <div className="border-b pb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">LIEFERSCHEIN</h1>
                <p className="text-sm text-muted-foreground">Bauplan Buddy GmbH</p>
                <p className="text-sm text-muted-foreground">Musterstrasse 123</p>
                <p className="text-sm text-muted-foreground">12345 Musterstadt</p>
                <p className="text-sm text-muted-foreground">Telefon: +49 123 456789</p>
                <p className="text-sm text-muted-foreground">E-Mail: info@bauplan-buddy.de</p>
              </div>
              <div className="text-sm text-muted-foreground space-y-1 text-right">
                <p className="text-lg font-semibold text-foreground">Nummer: {deliveryNote.number}</p>
                <p>Datum: {formatDate(deliveryNote.date)}</p>
                {deliveryNote.orderNumber && <p>Bestellnummer: {deliveryNote.orderNumber}</p>}
                {deliveryNote.deliveredAt && <p>Geliefert am: {formatDate(deliveryNote.deliveredAt)}</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-semibold mb-2">Empfaenger</h2>
              <p className="font-medium text-foreground">{deliveryNote.customerName}</p>
              <p className="text-sm whitespace-pre-line text-muted-foreground">
                {deliveryNote.customerAddress}
              </p>
              {deliveryNote.projectName && (
                <p className="text-sm text-muted-foreground mt-2">
                  Projekt: {deliveryNote.projectName}
                </p>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-2">Lieferadresse</h2>
              <p className="text-sm whitespace-pre-line text-muted-foreground">
                {deliveryNote.deliveryAddress || deliveryNote.customerAddress}
              </p>
              {deliveryNote.deliveryMethod && (
                <p className="text-sm text-muted-foreground mt-4">
                  Versandart:{' '}
                  {deliveryMethodLabel[deliveryNote.deliveryMethod] || deliveryNote.deliveryMethod}
                </p>
              )}
            </div>
          </div>

          <div>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="py-2 px-4 font-semibold">Beschreibung</th>
                  <th className="py-2 px-4 font-semibold text-right">Menge</th>
                  <th className="py-2 px-4 font-semibold">Einheit</th>
                  <th className="py-2 px-4 font-semibold text-right">Geliefert</th>
                  <th className="py-2 px-4 font-semibold">Anmerkungen</th>
                </tr>
              </thead>
              <tbody>
                {deliveryNote.items.map(item => (
                  <tr key={item.id} className="border-b last:border-b-0">
                    <td className="py-3 px-4">{item.description}</td>
                    <td className="py-3 px-4 text-right">{item.quantity}</td>
                    <td className="py-3 px-4">{item.unit}</td>
                    <td className="py-3 px-4 text-right">{item.deliveredQuantity}</td>
                    <td className="py-3 px-4">{item.notes || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {deliveryNote.notes && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Anmerkungen</h2>
              <p className="text-sm whitespace-pre-line text-muted-foreground">
                {deliveryNote.notes}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t">
            <div className="space-y-8">
              <p>Lieferdatum: ________________________</p>
              <p>Unterschrift Empfaenger: ________________________</p>
            </div>
            <div className="space-y-8 text-right">
              <p>Datum: ________________________</p>
              <p>Unterschrift Spedition: ________________________</p>
            </div>
          </div>

          <div className="pt-6 border-t text-center text-xs text-muted-foreground">
            <p>Bauplan Buddy GmbH | Musterstrasse 123 | 12345 Musterstadt</p>
            <p>Geschaeftsfuehrer: Max Mustermann | Handelsregister: Amtsgericht Musterstadt HRB 12345</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

