import React, { useCallback, useEffect, useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import {
  ProcurementService,
  InventoryItem as LegacyInventoryItem,
  ProcurementOrder,
  ProcurementKPIs,
  ReorderSuggestion,
  SupplierPerformance as LegacySupplierPerformance,
} from "@/services/procurementService";
import {
  useInventoryItems,
  usePurchaseOrders,
  useSuppliers,
} from "@/hooks/useProcurementApi";
import type { InventoryItem, Supplier } from "@/types/procurement";
import type {
  InventoryItem as LegacyInventoryItemType,
  ProcurementOrderLine,
} from "@/services/procurementService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  Box,
  ClipboardList,
  Factory,
  Gauge,
  Package,
  RefreshCcw,
  TrendingDown,
  Truck,
  Warehouse,
  Plus,
  ShoppingCart,
  Edit,
  ExternalLink,
  CheckCircle2,
  Wallet,
  Scan,
  BrainCircuit,
  FileText,
  Sparkles,
} from "lucide-react";
import { SmartInvoiceDialog } from "./SmartInvoiceDialog";
import { PurchaseOrderDialog } from "./PurchaseOrderDialog";
import { InventoryItemDialog } from "./InventoryItemDialog";
import { GoodsReceiptDialog } from "./GoodsReceiptDialog";
import { SupplierPerformanceDialog } from "./SupplierPerformanceDialog";
import { PurchaseOrderApprovalDialog } from "./PurchaseOrderApprovalDialog";
import { BudgetTrackingDialog } from "./BudgetTrackingDialog";
import { SupplierDialog } from "./SupplierDialog";
import { StockAdjustmentDialog } from "./StockAdjustmentDialog";
import { ProcurementAnalytics } from "./ProcurementAnalytics";
import { ProcurementAIInsights } from "./ProcurementAIInsights";
import { RFQDialog } from "./RFQDialog";
import { BarcodeScannerDialog } from "./BarcodeScannerDialog";
import { ProcurementDashboardSkeleton } from "./ProcurementSkeletons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
// Type adapter import removed - inline mapping used instead
import { seedProcurementDemo } from "@/utils/procurementSeed";

type ItemStatus = "healthy" | "warning" | "critical";

const statusColorMap: Record<ItemStatus, string> = {
  healthy: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  warning: "bg-amber-100 text-amber-700 border border-amber-200",
  critical: "bg-red-100 text-red-700 border border-red-200",
};

const urgencyBadgeStyle: Record<ReorderSuggestion["urgency"], string> = {
  high: "bg-red-100 text-red-700 border border-red-200",
  medium: "bg-amber-100 text-amber-700 border border-amber-200",
  low: "bg-sky-100 text-sky-700 border border-sky-200",
};

const reasonLabel: Record<ReorderSuggestion["reason"], string> = {
  below_reorder_point: "Unter Mindestbestand",
  upcoming_projects: "Projektbedarf",
  seasonal_demand: "Saisonbedarf",
  supplier_lead_time: "Lieferzeitpuffer",
};

const orderStatusLabel: Record<ProcurementOrder["status"], string> = {
  draft: "Entwurf",
  submitted: "Uebermittelt",
  approved: "Freigegeben",
  receiving: "Wareneingang",
  completed: "Abgeschlossen",
  cancelled: "Storniert",
};

const priorityLabel: Record<ProcurementOrder["priority"], string> = {
  low: "Niedrig",
  medium: "Normal",
  high: "Hoch",
  critical: "Kritisch",
};

const riskBadgeStyle: Record<ProcurementOrder["riskLevel"], string> = {
  low: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
};

const onTimeBadge = (value: number) => {
  if (value >= 0.9) {
    return "bg-emerald-100 text-emerald-700";
  }
  if (value >= 0.75) {
    return "bg-amber-100 text-amber-700";
  }
  return "bg-red-100 text-red-700";
};

const ProcurementDashboard: React.FC = () => {
  // React Query hooks for data fetching
  const {
    data: inventory = [],
    isLoading: inventoryLoading,
    isError: inventoryError,
  } = useInventoryItems();
  const {
    data: purchaseOrders = [],
    isLoading: ordersLoading,
    isError: ordersError,
  } = usePurchaseOrders();
  const {
    data: suppliers = [],
    isLoading: suppliersLoading,
    isError: suppliersError,
  } = useSuppliers();

  // Legacy state for features not yet migrated
  const [kpis, setKpis] = useState<ProcurementKPIs>(() =>
    ProcurementService.getKPIs()
  );
  const [reorderSuggestions, setReorderSuggestions] = useState<
    ReorderSuggestion[]
  >(() => ProcurementService.getReorderSuggestions());
  const [supplierPerformance, setSupplierPerformance] = useState<
    LegacySupplierPerformance[]
  >(() => ProcurementService.getSupplierPerformance());

  const [isPurchaseOrderDialogOpen, setIsPurchaseOrderDialogOpen] =
    useState(false);
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] = useState(false);
  const [isGoodsReceiptDialogOpen, setIsGoodsReceiptDialogOpen] =
    useState(false);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [isStockAdjustmentDialogOpen, setIsStockAdjustmentDialogOpen] =
    useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [isSmartInvoiceDialogOpen, setIsSmartInvoiceDialogOpen] =
    useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<
    InventoryItem | undefined
  >(undefined);
  const [selectedSupplierForEdit, setSelectedSupplierForEdit] = useState<
    Supplier | undefined
  >(undefined);
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<
    ProcurementOrder | undefined
  >(undefined);
  const [selectedOrderForApproval, setSelectedOrderForApproval] = useState<
    ProcurementOrder | undefined
  >(undefined);
  const [selectedSupplier, setSelectedSupplier] = useState<
    LegacySupplierPerformance | undefined
  >(undefined);
  const [prefilledInventoryId, setPrefilledInventoryId] = useState<
    string | undefined
  >(undefined);
  const [selectedInventoryItemData, setSelectedInventoryItemData] = useState<
    LegacyInventoryItem | undefined
  >(undefined);
  const [isRFQDialogOpen, setIsRFQDialogOpen] = useState(false);
  const [isScannerDialogOpen, setIsScannerDialogOpen] = useState(false);
  const [selectedItemForRFQ, setSelectedItemForRFQ] = useState<any>(undefined);

  // Sync legacy state for features not yet migrated to React Query
  const syncLegacyState = useCallback(() => {
    setKpis(ProcurementService.getKPIs());
    setReorderSuggestions(ProcurementService.getReorderSuggestions());
    setSupplierPerformance(ProcurementService.getSupplierPerformance());
  }, []);

  useEffect(() => {
    if (
      !inventoryLoading &&
      !ordersLoading &&
      !inventoryError &&
      !ordersError &&
      inventory.length === 0 &&
      purchaseOrders.length === 0
    ) {
      seedProcurementDemo();
      syncLegacyState();
    }
  }, [
    inventoryLoading,
    ordersLoading,
    inventoryError,
    ordersError,
    inventory.length,
    purchaseOrders.length,
    syncLegacyState,
  ]);

  useEffect(() => {
    syncLegacyState();
    const unsubscribe = ProcurementService.addListener(syncLegacyState);
    return () => unsubscribe();
  }, [syncLegacyState]);

  // Calculate item status from inventory data
  const getItemStatus = (item: LegacyInventoryItemType): ItemStatus => {
    const available = item.onHand - item.reserved;
    if (available <= 0) return "critical";
    if (available < item.reorderPoint) return "warning";
    return "healthy";
  };

  const eurFormatter = useMemo(
    () =>
      new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }),
    []
  );

  const quantityFormatter = useMemo(
    () =>
      new Intl.NumberFormat("de-DE", {
        maximumFractionDigits: 0,
      }),
    []
  );

  const inventoryData: LegacyInventoryItemType[] = useMemo(() => {
    const fallback = ProcurementService.getInventory();
    if (inventoryError) return fallback;
    if (!inventory.length && fallback.length) return fallback;
    // Map API inventory items to legacy format
    return inventory.map(
      (item) =>
        ({
          id: item.id,
          sku: item.sku,
          name: item.name,
          category: item.category,
          unit: item.unit as LegacyInventoryItemType["unit"],
          unitPrice: item.unitPrice,
          currency: "EUR",
          supplierId: item.supplierId || "",
          supplierName: item.supplier?.name || "Unknown",
          onHand: item.onHand,
          reserved: item.reserved,
          incoming: item.incoming,
          reorderPoint: item.reorderPoint,
          reorderQuantity: item.reorderQuantity,
          storageLocation: item.storageLocation || "",
          status:
            (item.available ?? item.onHand - item.reserved) <= 0
              ? "critical"
              : (item.available ?? item.onHand - item.reserved) <
                item.reorderPoint
              ? "warning"
              : "healthy",
          lastUpdated: item.updatedAt,
          projectAllocations: [],
          averageDailyUsage: 0,
          leadTimeDays: 0,
        } satisfies LegacyInventoryItemType)
    );
  }, [inventory, inventoryError]);

  const purchaseOrdersData: ProcurementOrder[] = useMemo(() => {
    const source = (() => {
      const fallback = ProcurementService.getPurchaseOrders();
      if (ordersError) return fallback;
      if (!purchaseOrders.length && fallback.length) return fallback;
      return purchaseOrders;
    })();
    return source.map((order) => ({
      ...order,
      status: (typeof order.status === "string"
        ? order.status.toLowerCase()
        : order.status) as ProcurementOrder["status"],
    }));
  }, [ordersError, purchaseOrders]);

  const suppliersData = useMemo(
    () => (suppliersError ? [] : suppliers),
    [suppliers, suppliersError]
  );

  const sortedInventory = useMemo(() => {
    return [...inventoryData].sort((a, b) => {
      const statusRank: Record<ItemStatus, number> = {
        critical: 0,
        warning: 1,
        healthy: 2,
      };
      const aStatus = getItemStatus(a);
      const bStatus = getItemStatus(b);
      if (statusRank[aStatus] !== statusRank[bStatus]) {
        return statusRank[aStatus] - statusRank[bStatus];
      }
      const aAvailable = a.onHand - a.reserved;
      const bAvailable = b.onHand - b.reserved;
      return aAvailable - bAvailable;
    });
  }, [inventoryData]);

  const openOrders = useMemo(() => {
    return purchaseOrdersData.filter(
      (order) => order.status !== "completed" && order.status !== "cancelled"
    );
  }, [purchaseOrdersData]);

  const delayedCount = useMemo(() => {
    const now = Date.now();
    return openOrders.filter((order) => {
      return (
        order.expectedDelivery &&
        new Date(order.expectedDelivery).getTime() < now &&
        order.status !== "completed"
      );
    }).length;
  }, [openOrders]);

  const trendIcon = (value: number) => {
    if (value >= 0) {
      return <TrendingDown className="h-4 w-4 text-emerald-600" />;
    }
    return <TrendingDown className="h-4 w-4 rotate-180 text-red-600" />;
  };

  const formatDate = (input: string) => {
    try {
      return format(new Date(input), "dd.MM.yyyy", { locale: de });
    } catch {
      return "-";
    }
  };

  // Show loading skeleton while data is being fetched
  if (inventoryLoading || ordersLoading) {
    return <ProcurementDashboardSkeleton />;
  }

  // Errors fallback to legacy data above

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Warehouse className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Beschaffung</h1>
              <p className="text-sm text-muted-foreground">
                Lagerbestand, offene Bestellungen und Lieferantenperformance im
                Blick.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <Button
              size="compact"
              variant="outline"
              onClick={() => setIsScannerDialogOpen(true)}
              className="bg-primary/5 border-primary/20 hover:bg-primary/10"
            >
              <Scan className="mr-2 h-4 w-4" />
              Scan & Buchen
            </Button>
            <Button
              size="compact"
              variant="outline"
              onClick={() => {
                setSelectedSupplierForEdit(undefined);
                setIsSupplierDialogOpen(true);
              }}
            >
              <Factory className="mr-2 h-4 w-4" />
              Lieferant anlegen
            </Button>
            <Button
              size="compact"
              variant="outline"
              onClick={() => setIsBudgetDialogOpen(true)}
            >
              <Wallet className="mr-2 h-4 w-4" />
              Budget-Tracking
            </Button>
            <Button
              size="compact"
              variant="outline"
              onClick={() => {
                setSelectedInventoryItem(undefined);
                setIsInventoryDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Artikel anlegen
            </Button>
            <Button
              size="compact"
              variant="outline"
              className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
              onClick={() => setIsSmartInvoiceDialogOpen(true)}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              KI-Rechnungsimport
            </Button>
            <Button onClick={() => setIsPurchaseOrderDialogOpen(true)}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Bestellung erstellen
            </Button>
          </div>
        </div>
      </div>

      <section>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription>Lagerwert</CardDescription>
              <Box className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {eurFormatter.format(kpis.inventoryValue)}
              </div>
              <p className="text-xs text-muted-foreground">
                inkl. verfuegbare und angekuendigte Bestaende
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription>Lagerumschlag</CardDescription>
              <Gauge className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold">
                  {kpis.inventoryTurns.toFixed(1)}x
                </span>
                {trendIcon(kpis.inventoryTurns - 5.4)}
              </div>
              <p className="text-xs text-muted-foreground">
                Ziel 6,0x - Massnahmen fuer Schnelllaeufer pruefen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription>Kritische Artikel</CardDescription>
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{kpis.criticalItems}</div>
              <p className="text-xs text-muted-foreground">
                Benoetigt Aufmerksamkeit (unter Mindestbestand)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription>Offene Bestellungen</CardDescription>
              <Truck className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{kpis.openOrders}</div>
              <p className="text-xs text-muted-foreground">
                {delayedCount > 0
                  ? `${delayedCount} Lieferungen verspaetet`
                  : "Planmaessig unterwegs"}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Reorder-Empfehlungen</CardTitle>
              <CardDescription>
                Priorisierte Vorschlaege basierend auf Verbrauch und Projekten
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={syncLegacyState}
            >
              <RefreshCcw className="h-4 w-4" />
              Aktualisieren
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {reorderSuggestions.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                <Package className="mb-2 h-6 w-6 text-muted-foreground" />
                <span>
                  Aktuell keine dringenden Nachbestellungen erforderlich.
                </span>
              </div>
            )}

            {reorderSuggestions.slice(0, 4).map((suggestion) => (
              <div
                key={suggestion.id}
                className="rounded-lg border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {suggestion.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {suggestion.sku}
                    </p>
                  </div>
                  <Badge className={urgencyBadgeStyle[suggestion.urgency]}>
                    {suggestion.urgency === "high"
                      ? "Dringend"
                      : suggestion.urgency === "medium"
                      ? "Bald"
                      : "Planbar"}
                  </Badge>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Verfuegbar</span>
                    <span className="font-medium">
                      {quantityFormatter.format(suggestion.currentStock)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">
                      Empfohlene Menge
                    </span>
                    <span className="font-medium">
                      {quantityFormatter.format(suggestion.reorderQuantity)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Deckung</span>
                    <span className="font-medium">
                      {suggestion.projectedDaysOfSupply === Infinity
                        ? "n/a"
                        : `${suggestion.projectedDaysOfSupply.toFixed(1)} Tage`}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Empfohlen bis</span>
                    <span className="font-medium">
                      {formatDate(suggestion.recommendedOrderDate)}
                    </span>
                  </div>
                </div>

                <Separator className="my-3" />

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{suggestion.supplierName}</Badge>
                    <Badge variant="outline">
                      {reasonLabel[suggestion.reason]}
                    </Badge>
                    {suggestion.targetProjects.slice(0, 2).map((project) => (
                      <Badge key={project.projectId} variant="secondary">
                        {project.projectName} -{" "}
                        {quantityFormatter.format(project.quantity)}
                      </Badge>
                    ))}
                    {suggestion.targetProjects.length > 2 && (
                      <Badge variant="outline">
                        +{suggestion.targetProjects.length - 2} weitere
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 gap-1 bg-blue-50/50 hover:bg-blue-100/50 border-blue-200 text-blue-700"
                      onClick={() => {
                        setSelectedItemForRFQ(suggestion);
                        setIsRFQDialogOpen(true);
                      }}
                    >
                      <FileText className="h-3 w-3" />
                      Anfragen
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-8"
                      onClick={() => {
                        setPrefilledInventoryId(suggestion.inventoryId);
                        setIsPurchaseOrderDialogOpen(true);
                      }}
                    >
                      Bestellen
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Lagerbestand (Top-Kategorien)</CardTitle>
            <CardDescription>
              Nach Status und Offene Bestellungen priorisiert
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {inventoryLoading ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Lade Lagerbestand...
              </div>
            ) : sortedInventory.length === 0 ? (
              <div className="text-center py-12">
                <Warehouse className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Kein Lagerbestand vorhanden
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Fügen Sie Ihren ersten Lagerartikel hinzu, um mit der
                  Bestandsverwaltung zu beginnen.
                </p>
                <Button onClick={() => setIsInventoryDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Artikel hinzufügen
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Artikel</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead className="text-right">Verfuegbar</TableHead>
                    <TableHead className="text-right">Reserviert</TableHead>
                    <TableHead className="text-right">Offen</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px]">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedInventory.slice(0, 6).map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/40">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">
                            {item.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {item.sku}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.category}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {quantityFormatter.format(
                          Math.max(item.onHand - item.reserved, 0)
                        )}{" "}
                        {item.unit}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {quantityFormatter.format(item.reserved)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {quantityFormatter.format(item.incoming)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${
                            statusColorMap[getItemStatus(item)]
                          } text-xs font-medium`}
                        >
                          {getItemStatus(item) === "healthy"
                            ? "Stabil"
                            : getItemStatus(item) === "warning"
                            ? "Beobachten"
                            : "Kritisch"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedInventoryItemData(item);
                              setIsInventoryDialogOpen(true);
                            }}
                            title="Artikel bearbeiten"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedInventoryItem(
                                item as unknown as import("@/types/procurement").InventoryItem
                              );
                              setIsStockAdjustmentDialogOpen(true);
                            }}
                            title="Bestand anpassen"
                          >
                            <RefreshCcw className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Offene Bestellungen</CardTitle>
            <CardDescription>Status, Budget und Liefertermine</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {openOrders.length === 0 && (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                Keine offenen Bestellungen vorhanden.
              </div>
            )}

            {openOrders.slice(0, 5).map((order) => {
              const isLate =
                order.expectedDelivery &&
                new Date(order.expectedDelivery).getTime() < Date.now() &&
                order.status !== "completed";
              const needsApproval = order.status === "submitted";
              return (
                <div
                  key={order.id}
                  className="space-y-3 rounded-lg border bg-card p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.supplierName || "N/A"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {priorityLabel[order.priority]}
                      </Badge>
                      <Badge
                        className={
                          order.priority === "critical" ||
                          order.priority === "high"
                            ? "bg-red-100 text-red-700"
                            : order.priority === "medium"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }
                      >
                        {order.priority === "critical"
                          ? "Dringend"
                          : order.priority === "high"
                          ? "Hoch"
                          : order.priority === "medium"
                          ? "Mittel"
                          : "Niedrig"}
                      </Badge>
                      {/* TODO: Approval/Receipt dialogs need adapter for new PurchaseOrder type */}
                      {order.status === "submitted" && (
                        <span className="text-xs text-muted-foreground">
                          Genehmigung ausstehend
                        </span>
                      )}
                      {(order.status === "approved" ||
                        order.status === "receiving") && (
                        <span className="text-xs text-muted-foreground">
                          Wareneingang ausstehend
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{eurFormatter.format(order.totalAmount)}</span>
                    <Separator orientation="vertical" className="h-3" />
                    <span>{orderStatusLabel[order.status]}</span>
                    <Separator orientation="vertical" className="h-3" />
                    <span>
                      Lieferung{" "}
                      {order.expectedDelivery
                        ? formatDistanceToNow(
                            new Date(order.expectedDelivery),
                            { addSuffix: true, locale: de }
                          )
                        : "N/A"}
                    </span>
                    {isLate && (
                      <Badge
                        variant="destructive"
                        className="flex items-center gap-1"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        Verzoegert
                      </Badge>
                    )}
                  </div>

                  <div className="grid gap-3 rounded-md bg-muted/40 p-3 text-xs">
                    {order.lines?.map((line: ProcurementOrderLine) => {
                      return (
                        <div
                          key={line.lineId}
                          className="flex flex-wrap items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2">
                            <ClipboardList className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">
                              {line.description || line.sku || "N/A"}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                            <span>
                              {quantityFormatter.format(line.quantity)}
                            </span>
                            <Separator orientation="vertical" className="h-3" />
                            <span>
                              {line.requiredDate
                                ? formatDate(line.requiredDate)
                                : "-"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lieferantenleistung</CardTitle>
            <CardDescription>KPIs der wichtigsten Partner</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {supplierPerformance.map((supplier) => (
              <div
                className="rounded-lg border bg-card p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  setSelectedSupplier(supplier);
                  setIsSupplierDialogOpen(true);
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {supplier.supplierName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {" "}
                      Lieferzeit {supplier.averageLeadTime} Tage
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <Factory className="h-3 w-3" />
                      {supplier.openOrders} offen
                    </Badge>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">On-Time</span>
                    <Badge
                      className={`${onTimeBadge(
                        supplier.onTimeDeliveryRate
                      )} justify-center font-medium`}
                    >
                      {(supplier.onTimeDeliveryRate * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Qualitaet</span>
                    <Badge
                      variant="secondary"
                      className="justify-center font-medium"
                    >
                      {supplier.qualityScore.toFixed(1)} / 5,0
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Spend YTD</span>
                    <span className="font-medium text-foreground">
                      {eurFormatter.format(supplier.totalSpendYtd)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Analytics Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900">
            <BrainCircuit className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              AI Optimierung & Insights
            </h2>
            <p className="text-sm text-muted-foreground">
              KI-gestützte Prognosen für Preise und Bedarf
            </p>
          </div>
        </div>
        <ProcurementAIInsights />
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              Beschaffungs-Analytics
            </h2>
            <p className="text-sm text-muted-foreground">
              Kennzahlen, Trends und Performance
            </p>
          </div>
        </div>
        <ProcurementAnalytics />
      </section>

      {/* Dialogs */}
      <PurchaseOrderDialog
        open={isPurchaseOrderDialogOpen}
        onOpenChange={(open) => {
          setIsPurchaseOrderDialogOpen(open);
          if (!open) setPrefilledInventoryId(undefined);
        }}
        onSuccess={() => {
          syncLegacyState();
        }}
        prefilledInventoryId={prefilledInventoryId}
      />

      <InventoryItemDialog
        open={isInventoryDialogOpen}
        onOpenChange={(open) => {
          setIsInventoryDialogOpen(open);
          if (!open) setSelectedInventoryItemData(undefined);
        }}
        item={selectedInventoryItemData}
        onSuccess={() => {
          syncLegacyState();
        }}
      />

      {selectedOrderForReceipt && (
        <GoodsReceiptDialog
          open={isGoodsReceiptDialogOpen}
          onOpenChange={(open) => {
            setIsGoodsReceiptDialogOpen(open);
            if (!open) setSelectedOrderForReceipt(undefined);
          }}
          order={selectedOrderForReceipt}
          onSuccess={() => {
            syncLegacyState();
          }}
        />
      )}

      {selectedSupplier && (
        <SupplierPerformanceDialog
          open={isSupplierDialogOpen}
          onOpenChange={(open) => {
            setIsSupplierDialogOpen(open);
            if (!open) setSelectedSupplier(undefined);
          }}
          supplier={selectedSupplier}
        />
      )}

      {selectedOrderForApproval && (
        <PurchaseOrderApprovalDialog
          open={isApprovalDialogOpen}
          onOpenChange={(open) => {
            setIsApprovalDialogOpen(open);
            if (!open) setSelectedOrderForApproval(undefined);
          }}
          order={selectedOrderForApproval}
          onApprove={(orderId, comment) => {
            console.log("Approved:", orderId, comment);
            syncLegacyState();
          }}
          onReject={(orderId, comment) => {
            console.log("Rejected:", orderId, comment);
            syncLegacyState();
          }}
        />
      )}

      <BudgetTrackingDialog
        open={isBudgetDialogOpen}
        onOpenChange={setIsBudgetDialogOpen}
      />

      {/* Supplier Dialog */}
      <SupplierDialog
        open={isSupplierDialogOpen}
        onOpenChange={(open) => {
          setIsSupplierDialogOpen(open);
          if (!open) setSelectedSupplierForEdit(undefined);
        }}
        supplier={selectedSupplierForEdit}
        onSuccess={() => {
          // Refresh suppliers list
        }}
      />

      {/* Stock Adjustment Dialog */}
      {selectedInventoryItem && (
        <StockAdjustmentDialog
          open={isStockAdjustmentDialogOpen}
          onOpenChange={(open) => {
            setIsStockAdjustmentDialogOpen(open);
            if (!open) setSelectedInventoryItem(undefined);
          }}
          item={selectedInventoryItem}
          onSuccess={() => {
            syncLegacyState();
          }}
        />
      )}

      <RFQDialog
        open={isRFQDialogOpen}
        onOpenChange={setIsRFQDialogOpen}
        item={selectedItemForRFQ}
      />

      <BarcodeScannerDialog
        open={isScannerDialogOpen}
        onOpenChange={setIsScannerDialogOpen}
        onScan={(sku) => {
          console.log("Scanned SKU:", sku);
          syncLegacyState();
        }}
      />

      <SmartInvoiceDialog
        open={isSmartInvoiceDialogOpen}
        onOpenChange={setIsSmartInvoiceDialogOpen}
        onSuccess={() => {
          // Re-fetch invoices or KPIs if needed
          window.location.reload(); // Temporary measure to ensure full state refresh
        }}
      />
    </div>
  );
};

export default ProcurementDashboard;
