import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import {
  Building,
  Calendar,
  Euro,
  Phone,
  Mail,
  MapPin,
  User,
  FileText,
  Printer,
  Download
} from 'lucide-react';

interface DocumentData {
  id: string;
  number: string;
  type: 'quote' | 'order_confirmation';
  customer: {
    name: string;
    company?: string;
    email: string;
    phone: string;
    address: string;
  };
  project: {
    name: string;
    address: string;
    description?: string;
  };
  positions: Array<{
    position: number;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
  }>;
  summary: {
    subtotal: number;
    discount?: number;
    netAmount: number;
    taxAmount: number;
    grossAmount: number;
    taxRate: number;
  };
  dates: {
    created: string;
    validUntil?: string;
    delivered?: string;
  };
  terms: string;
  notes?: string;
  status: string;
}

interface DocumentPreviewProps {
  document: DocumentData;
  showBranding?: boolean;
  showPrintButton?: boolean;
  onPrint?: () => void;
  onDownload?: () => void;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  document,
  showBranding = true,
  showPrintButton = true,
  onPrint,
  onDownload
}) => {
  const getDocumentTitle = () => {
    return document.type === 'quote' ? 'ANGEBOT' : 'AUFTRAGSBESTÄTIGUNG';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return 'secondary';
      case 'sent': return 'outline';
      case 'confirmed': case 'accepted': return 'default';
      case 'cancelled': case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white text-black print:shadow-none">
      {/* Print Actions */}
      {showPrintButton && (
        <div className="mb-4 print:hidden flex gap-2">
          {onPrint && (
            <button
              onClick={onPrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Printer className="h-4 w-4" />
              Drucken
            </button>
          )}
          {onDownload && (
            <button
              onClick={onDownload}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              PDF Download
            </button>
          )}
        </div>
      )}

      {/* Document */}
      <Card className="print:shadow-none print:border-none">
        <CardContent className="p-8 print:p-6">
          {/* Header with Branding */}
          {showBranding && (
            <div className="mb-8 print:mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Building className="h-8 w-8 text-blue-600" />
                    <div>
                      <h1 className="text-2xl font-bold text-blue-600">Bauplan Buddy</h1>
                      <p className="text-sm text-gray-600">Ihr Partner für Bauprojekte</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Musterstraße 123</p>
                    <p>12345 Musterstadt</p>
                    <p>Tel: +49 123 456789</p>
                    <p>E-Mail: info@bauplan-buddy.de</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">{getDocumentTitle()}</h2>
                  <div className="space-y-1">
                    <p className="text-lg font-semibold">{document.number}</p>
                    <Badge variant={getStatusColor(document.status)} className="text-xs">
                      {document.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
              <Separator className="mt-6" />
            </div>
          )}

          {/* Customer and Project Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Kunde
              </h3>
              <div className="space-y-2 text-sm">
                <p className="font-semibold">{document.customer.name}</p>
                {document.customer.company && (
                  <p className="text-gray-600">{document.customer.company}</p>
                )}
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{document.customer.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{document.customer.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{document.customer.email}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building className="h-5 w-5" />
                Projekt
              </h3>
              <div className="space-y-2 text-sm">
                <p className="font-semibold">{document.project.name}</p>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{document.project.address}</span>
                </div>
                {document.project.description && (
                  <p className="text-gray-600">{document.project.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Document Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="text-sm">
              <p className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Erstellt am
              </p>
              <p>{new Date(document.dates.created).toLocaleDateString('de-DE')}</p>
            </div>
            {document.dates.validUntil && (
              <div className="text-sm">
                <p className="font-semibold">Gültig bis</p>
                <p>{new Date(document.dates.validUntil).toLocaleDateString('de-DE')}</p>
              </div>
            )}
            {document.dates.delivered && (
              <div className="text-sm">
                <p className="font-semibold">Lieferung bis</p>
                <p>{new Date(document.dates.delivered).toLocaleDateString('de-DE')}</p>
              </div>
            )}
          </div>

          {/* Positions Table */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Positionen
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Pos.</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Beschreibung</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Menge</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Einheit</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">EP €</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">GP €</th>
                  </tr>
                </thead>
                <tbody>
                  {document.positions.map((position, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                      <td className="px-4 py-3 text-sm">{position.position}</td>
                      <td className="px-4 py-3 text-sm">{position.description}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        {position.quantity.toLocaleString('de-DE')}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">{position.unit}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        {position.unitPrice.toLocaleString('de-DE', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">
                        {position.total.toLocaleString('de-DE', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="flex justify-end mb-8">
            <div className="w-80">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Euro className="h-5 w-5" />
                  Zusammenfassung
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Zwischensumme:</span>
                    <span>€{document.summary.subtotal.toLocaleString('de-DE', {
                      minimumFractionDigits: 2
                    })}</span>
                  </div>
                  
                  {document.summary.discount && document.summary.discount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Rabatt:</span>
                      <span>-€{document.summary.discount.toLocaleString('de-DE', {
                        minimumFractionDigits: 2
                      })}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span>Nettobetrag:</span>
                    <span>€{document.summary.netAmount.toLocaleString('de-DE', {
                      minimumFractionDigits: 2
                    })}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>MwSt. ({document.summary.taxRate}%):</span>
                    <span>€{document.summary.taxAmount.toLocaleString('de-DE', {
                      minimumFractionDigits: 2
                    })}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>Gesamtbetrag:</span>
                    <span>€{document.summary.grossAmount.toLocaleString('de-DE', {
                      minimumFractionDigits: 2
                    })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {document.notes && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3">Anmerkungen</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm whitespace-pre-line">{document.notes}</p>
              </div>
            </div>
          )}

          {/* Terms and Conditions */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">Allgemeine Geschäftsbedingungen</h3>
            <div className="text-sm text-gray-700 whitespace-pre-line">
              {document.terms}
            </div>
          </div>

          {/* Footer */}
          {showBranding && (
            <div className="border-t pt-6 mt-8">
              <div className="text-xs text-gray-500 text-center space-y-1">
                <p>Bauplan Buddy GmbH • Geschäftsführer: Max Mustermann • Amtsgericht Musterstadt HRB 12345</p>
                <p>USt-IdNr.: DE123456789 • Bankverbindung: Musterbank • IBAN: DE12 3456 7890 1234 5678 90</p>
                <p>www.bauplan-buddy.de • info@bauplan-buddy.de • +49 123 456789</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentPreview;