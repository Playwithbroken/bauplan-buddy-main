import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { SupplierPerformance, ProcurementService } from '@/services/procurementService';
import {
  Factory,
  TrendingUp,
  TrendingDown,
  Clock,
  Star,
  Package,
  AlertTriangle,
  CheckCircle2,
  Euro,
  Calendar,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SupplierPerformanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: SupplierPerformance;
}

// Mock additional supplier data
interface SupplierDetails {
  supplierId: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  paymentTerms: string;
  deliveryTerms: string;
  certifications: string[];
  since: string;
}

interface DeliveryHistory {
  orderId: string;
  orderDate: string;
  expectedDelivery: string;
  actualDelivery: string;
  status: 'on-time' | 'early' | 'late';
  items: number;
  amount: number;
  quality: 'passed' | 'partial' | 'failed';
}

interface QualityIssue {
  date: string;
  orderId: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
}

const mockSupplierDetails: Record<string, SupplierDetails> = {
  'SUP-001': {
    supplierId: 'SUP-001',
    name: 'Baustoff Weber GmbH',
    contactPerson: 'Herr Thomas Weber',
    email: 'thomas.weber@baustoff-weber.de',
    phone: '+49 89 1234567',
    address: 'Industriestraße 45, 80331 München',
    paymentTerms: '30 Tage netto',
    deliveryTerms: 'Frei Baustelle',
    certifications: ['ISO 9001', 'DIN EN 206', 'CE-Kennzeichnung'],
    since: '2018-03-15',
  },
  'SUP-004': {
    supplierId: 'SUP-004',
    name: 'Zementwerke Süd AG',
    contactPerson: 'Frau Sabine Müller',
    email: 's.mueller@zementwerke-sued.de',
    phone: '+49 711 9876543',
    address: 'Zementstraße 12, 70174 Stuttgart',
    paymentTerms: '14 Tage 2% Skonto, 30 Tage netto',
    deliveryTerms: 'Ab Werk',
    certifications: ['ISO 14001', 'Blauer Engel', 'EMAS'],
    since: '2015-11-20',
  },
  'SUP-009': {
    supplierId: 'SUP-009',
    name: 'KlimaTech Solutions',
    contactPerson: 'Herr Dr. Michael Klein',
    email: 'm.klein@klimatech.de',
    phone: '+49 30 5551234',
    address: 'Technologiepark 7, 10115 Berlin',
    paymentTerms: '45 Tage netto',
    deliveryTerms: 'Frei Haus, Installation inklusive',
    certifications: ['ISO 50001', 'VDI 6022', 'F-Gas'],
    since: '2020-06-01',
  },
};

const mockDeliveryHistory: Record<string, DeliveryHistory[]> = {
  'SUP-001': [
    {
      orderId: 'PO-2025-001',
      orderDate: '2025-01-10',
      expectedDelivery: '2025-01-17',
      actualDelivery: '2025-01-16',
      status: 'early',
      items: 3,
      amount: 7200,
      quality: 'passed',
    },
    {
      orderId: 'PO-2024-156',
      orderDate: '2024-12-20',
      expectedDelivery: '2024-12-28',
      actualDelivery: '2024-12-28',
      status: 'on-time',
      items: 5,
      amount: 12450,
      quality: 'passed',
    },
    {
      orderId: 'PO-2024-142',
      orderDate: '2024-11-15',
      expectedDelivery: '2024-11-22',
      actualDelivery: '2024-11-25',
      status: 'late',
      items: 2,
      amount: 5600,
      quality: 'partial',
    },
  ],
  'SUP-004': [
    {
      orderId: 'PO-2025-002',
      orderDate: '2025-01-05',
      expectedDelivery: '2025-01-12',
      actualDelivery: '2025-01-14',
      status: 'late',
      items: 1,
      amount: 2250,
      quality: 'passed',
    },
  ],
  'SUP-009': [
    {
      orderId: 'PO-2024-189',
      orderDate: '2024-12-01',
      expectedDelivery: '2024-12-29',
      actualDelivery: '2024-12-27',
      status: 'early',
      items: 2,
      amount: 36500,
      quality: 'passed',
    },
  ],
};

const mockQualityIssues: Record<string, QualityIssue[]> = {
  'SUP-001': [
    {
      date: '2024-11-25',
      orderId: 'PO-2024-142',
      description: 'Teillieferung: 2 Stäbe mit leichter Rostbildung',
      severity: 'low',
      resolved: true,
    },
  ],
  'SUP-004': [
    {
      date: '2025-01-14',
      orderId: 'PO-2025-002',
      description: 'Lieferverzögerung aufgrund Transportprobleme',
      severity: 'medium',
      resolved: true,
    },
  ],
};

export const SupplierPerformanceDialog: React.FC<SupplierPerformanceDialogProps> = ({
  open,
  onOpenChange,
  supplier,
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const details = mockSupplierDetails[supplier.supplierId];
  const deliveryHistory = useMemo(() => mockDeliveryHistory[supplier.supplierId] || [], [supplier.supplierId]);
  const qualityIssues = useMemo(() => mockQualityIssues[supplier.supplierId] || [], [supplier.supplierId]);

  const eurFormatter = useMemo(
    () =>
      new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }),
    []
  );

  const getOnTimeColor = (rate: number) => {
    if (rate >= 0.9) return 'text-green-600';
    if (rate >= 0.75) return 'text-amber-600';
    return 'text-red-600';
  };

  const getQualityColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 3.5) return 'text-amber-600';
    return 'text-red-600';
  };

  const deliveryStats = useMemo(() => {
    const total = deliveryHistory.length;
    const onTime = deliveryHistory.filter((d) => d.status === 'on-time' || d.status === 'early').length;
    const late = deliveryHistory.filter((d) => d.status === 'late').length;
    const early = deliveryHistory.filter((d) => d.status === 'early').length;

    return { total, onTime, late, early };
  }, [deliveryHistory]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w- max-h-[90vh] flex flex-col5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5" />
            {supplier.supplierName}
          </DialogTitle>
          <DialogDescription>
            Detaillierte Leistungsmetriken und Lieferhistorie
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="history">Historie</TabsTrigger>
            <TabsTrigger value="contact">Kontakt</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 pr-4">
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardDescription className="text-xs">On-Time Delivery</CardDescription>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={cn('text-2xl font-bold', getOnTimeColor(supplier.onTimeDeliveryRate))}>
                      {(supplier.onTimeDeliveryRate * 100).toFixed(0)}%
                    </div>
                    <Progress
                      value={supplier.onTimeDeliveryRate * 100}
                      className="mt-2"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardDescription className="text-xs">Qualitätsbewertung</CardDescription>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={cn('text-2xl font-bold', getQualityColor(supplier.qualityScore))}>
                      {supplier.qualityScore.toFixed(1)} / 5.0
                    </div>
                    <Progress
                      value={(supplier.qualityScore / 5) * 100}
                      className="mt-2"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardDescription className="text-xs">Ø Lieferzeit</CardDescription>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {supplier.averageLeadTime} Tage
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Durchschnittliche Bearbeitungszeit
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardDescription className="text-xs">Umsatz YTD</CardDescription>
                    <Euro className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {eurFormatter.format(supplier.totalSpendYtd)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {supplier.openOrders} offene Bestellungen
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Certifications */}
              {details && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Zertifizierungen</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {details.certifications.map((cert) => (
                        <Badge key={cert} variant="secondary" className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quality Issues */}
              {qualityIssues.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Qualitätsmeldungen</CardTitle>
                    <CardDescription>Letzte Beanstandungen</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {qualityIssues.map((issue, idx) => (
                      <div key={idx} className="flex items-start gap-3 rounded-lg border p-3">
                        <AlertTriangle
                          className={cn(
                            'h-5 w-5 mt-0.5',
                            issue.severity === 'high'
                              ? 'text-red-600'
                              : issue.severity === 'medium'
                              ? 'text-amber-600'
                              : 'text-blue-600'
                          )}
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{issue.description}</p>
                            {issue.resolved && (
                              <Badge variant="outline" className="text-green-600">
                                Behoben
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(issue.date), 'dd.MM.yyyy', { locale: de })} - Bestellung:{' '}
                            {issue.orderId}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Lieferstatistik</CardTitle>
                  <CardDescription>Auswertung aller Lieferungen</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Gesamt</span>
                        <span className="font-medium">{deliveryStats.total}</span>
                      </div>
                      <Progress value={100} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Pünktlich/Früher</span>
                        <span className="font-medium text-green-600">{deliveryStats.onTime}</span>
                      </div>
                      <Progress
                        value={(deliveryStats.onTime / deliveryStats.total) * 100}
                        className="[&>div]:bg-green-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Verspätet</span>
                        <span className="font-medium text-red-600">{deliveryStats.late}</span>
                      </div>
                      <Progress
                        value={(deliveryStats.late / deliveryStats.total) * 100}
                        className="[&>div]:bg-red-600"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Liefertreue Trend</h4>
                      <div className="flex items-center gap-2">
                        {supplier.onTimeDeliveryRate >= 0.85 ? (
                          <>
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            <span className="text-sm text-green-600">Positiv</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-5 w-5 text-red-600" />
                            <span className="text-sm text-red-600">Verbesserungspotenzial</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Qualitätstrend</h4>
                      <div className="flex items-center gap-2">
                        {supplier.qualityScore >= 4.0 ? (
                          <>
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            <span className="text-sm text-green-600">Sehr gut</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-5 w-5 text-amber-600" />
                            <span className="text-sm text-amber-600">Akzeptabel</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Einkaufsvolumen</CardTitle>
                  <CardDescription>Umsatzentwicklung</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Year-to-Date</span>
                    <span className="text-lg font-bold">
                      {eurFormatter.format(supplier.totalSpendYtd)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Durchschn. Bestellwert</span>
                    <span className="text-lg font-medium">
                      {eurFormatter.format(
                        deliveryHistory.length > 0
                          ? deliveryHistory.reduce((sum, d) => sum + d.amount, 0) / deliveryHistory.length
                          : 0
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Anzahl Bestellungen</span>
                    <span className="text-lg font-medium">{deliveryHistory.length}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Lieferhistorie</CardTitle>
                  <CardDescription>Chronologische Übersicht aller Bestellungen</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bestellung</TableHead>
                        <TableHead>Bestelldatum</TableHead>
                        <TableHead>Erwartet</TableHead>
                        <TableHead>Geliefert</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Qualität</TableHead>
                        <TableHead className="text-right">Betrag</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deliveryHistory.map((delivery) => (
                        <TableRow key={delivery.orderId}>
                          <TableCell className="font-medium">{delivery.orderId}</TableCell>
                          <TableCell>
                            {format(new Date(delivery.orderDate), 'dd.MM.yyyy', { locale: de })}
                          </TableCell>
                          <TableCell>
                            {format(new Date(delivery.expectedDelivery), 'dd.MM.yyyy', {
                              locale: de,
                            })}
                          </TableCell>
                          <TableCell>
                            {format(new Date(delivery.actualDelivery), 'dd.MM.yyyy', { locale: de })}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                delivery.status === 'on-time' || delivery.status === 'early'
                                  ? 'default'
                                  : 'destructive'
                              }
                            >
                              {delivery.status === 'early'
                                ? 'Früher'
                                : delivery.status === 'on-time'
                                ? 'Pünktlich'
                                : 'Verspätet'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                delivery.quality === 'passed'
                                  ? 'default'
                                  : delivery.quality === 'partial'
                                  ? 'secondary'
                                  : 'destructive'
                              }
                            >
                              {delivery.quality === 'passed'
                                ? 'OK'
                                : delivery.quality === 'partial'
                                ? 'Teilweise'
                                : 'Beanstandet'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {eurFormatter.format(delivery.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="space-y-4 mt-4">
              {details && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Kontaktinformationen</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Telefon</p>
                              <a
                                href={`tel:${details.phone}`}
                                className="text-sm text-blue-600 hover:underline"
                              >
                                {details.phone}
                              </a>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">E-Mail</p>
                              <a
                                href={`mailto:${details.email}`}
                                className="text-sm text-blue-600 hover:underline"
                              >
                                {details.email}
                              </a>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Adresse</p>
                              <p className="text-sm text-muted-foreground">{details.address}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Geschäftsbeziehung seit</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(details.since), 'dd.MM.yyyy', { locale: de })}
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-medium mb-1">Ansprechpartner</p>
                            <p className="text-sm text-muted-foreground">{details.contactPerson}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Konditionen</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <p className="text-sm font-medium">Zahlungsbedingungen</p>
                          <p className="text-sm text-muted-foreground">{details.paymentTerms}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Lieferbedingungen</p>
                          <p className="text-sm text-muted-foreground">{details.deliveryTerms}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Website besuchen
                    </Button>
                    <Button variant="outline" size="sm">
                      <Mail className="mr-2 h-4 w-4" />
                      E-Mail senden
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
