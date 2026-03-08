import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { PageSkeleton } from "@/components/skeletons/PageSkeleton";
import { usePageLoading } from "@/hooks/usePageLoading";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import AdvancedFilterDialog from "../components/AdvancedFilterDialog";
import type {
  FilterDefinition,
  FilterCondition,
  FilterGroup,
} from "@/types/filtering";
import { useWorkflowDocumentUpload } from "@/hooks/useWorkflowDocumentUpload";
import { slugifyCounterparty } from "@/utils/documentUpload";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Search,
  FileText,
  Eye,
  Edit,
  Download,
  Mail,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Euro,
  Calendar,
  User,
  Building,
  Filter,
  Plus,
  RefreshCw,
  Upload,
  Send,
  MoreHorizontal,
  TrendingUp,
  Activity,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import OrderConfirmationStatusService, {
  OrderConfirmationStatus,
} from "../services/orderConfirmationStatusService";
import { OrderConfirmationStatusManager } from "../components/status/OrderConfirmationStatusManager";
import { useToast } from "../hooks/use-toast";
import { LayoutWithSidebar } from "@/components/LayoutWithSidebar";

interface OrderConfirmation {
  id: string;
  number: string;
  date: string;
  customerName: string;
  customerId: string;
  customerEmail?: string;
  projectName?: string;
  quoteReference?: string;
  total: number;
  status: "draft" | "sent" | "confirmed" | "cancelled";
  deliveryDate: string;
  validityDate: string;
  createdAt: string;
  sentAt?: string;
  confirmedAt?: string;
  positions: number; // number of positions
}

const OrderConfirmations = () => {
  const { loading } = usePageLoading({ delay: 600 });
  const { toast } = useToast();
  const statusService = OrderConfirmationStatusService.getInstance();

  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedConfirmations, setSelectedConfirmations] = useState<string[]>(
    []
  );
  const [selectedConfirmationForStatus, setSelectedConfirmationForStatus] =
    useState<OrderConfirmation | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [advancedFilter, setAdvancedFilter] = useState<FilterDefinition | null>(
    null
  );

  const {
    inputProps: uploadInputProps,
    startUpload: startWorkflowUpload,
    uploadedDocuments,
    isUploadingForKey,
  } = useWorkflowDocumentUpload();

  if (loading) return <PageSkeleton type="table" />;

  const handleOrderUpload = (confirmation: OrderConfirmation) => {
    startWorkflowUpload({
      key: confirmation.number,
      context: {
        workflowType: "bestellung",
        workflowId: confirmation.number,
        counterpartyType: "kunde",
        counterpartyId: slugifyCounterparty(confirmation.customerName),
        customerId: confirmation.customerId,
      },
      metadata: {
        name: `${confirmation.number}_${confirmation.customerName.replace(
          /\s+/g,
          "_"
        )}`,
        description: `Bestellung ${confirmation.number} fuer ${confirmation.customerName}`,
        tags: ["bestellung", confirmation.number],
      },
      successMessage: `Dokument der Bestellung ${confirmation.number} zugeordnet.`,
    });
  };

  // Mock data for order confirmations
  const orderConfirmations: OrderConfirmation[] = [
    {
      id: "1",
      number: "AB-2024-000001",
      date: "2024-02-15",
      customerName: "TechCorp GmbH",
      customerId: "CUST-002",
      customerEmail: "schmidt@techcorp.de",
      projectName: "Bürogebäude Berlin",
      quoteReference: "ANG-2024-002",
      total: 1200000,
      status: "confirmed",
      deliveryDate: "2024-05-15",
      validityDate: "2024-03-15",
      createdAt: "2024-02-15T10:30:00Z",
      sentAt: "2024-02-15T14:45:00Z",
      confirmedAt: "2024-02-18T09:15:00Z",
      positions: 3,
    },
    {
      id: "2",
      number: "AB-2024-000002",
      date: "2024-02-18",
      customerName: "Familie Müller",
      customerId: "CUST-001",
      customerEmail: "mueller@email.com",
      projectName: "Wohnhaus München",
      quoteReference: "ANG-2024-001",
      total: 450000,
      status: "sent",
      deliveryDate: "2024-06-01",
      validityDate: "2024-03-18",
      createdAt: "2024-02-18T11:20:00Z",
      sentAt: "2024-02-18T15:30:00Z",
      positions: 3,
    },
    {
      id: "3",
      number: "AB-2024-000003",
      date: "2024-02-20",
      customerName: "Hausverwaltung Nord",
      customerId: "CUST-003",
      customerEmail: "weber@hausverwaltung-nord.de",
      projectName: "Dachsanierung Hamburg",
      quoteReference: "ANG-2024-003",
      total: 75000,
      status: "draft",
      deliveryDate: "2024-04-15",
      validityDate: "2024-03-20",
      createdAt: "2024-02-20T16:45:00Z",
      positions: 2,
    },
    {
      id: "4",
      number: "AB-2024-000004",
      date: "2024-02-12",
      customerName: "Gewerbe AG",
      customerId: "CUST-005",
      customerEmail: "info@gewerbe-ag.de",
      projectName: "Lagerhalle Köln",
      quoteReference: "ANG-2024-005",
      total: 890000,
      status: "cancelled",
      deliveryDate: "2024-07-01",
      validityDate: "2024-03-12",
      createdAt: "2024-02-12T08:30:00Z",
      sentAt: "2024-02-12T12:00:00Z",
      positions: 4,
    },
  ];

  const evalCond = (oc: OrderConfirmation, c: FilterCondition): boolean => {
    const valStr = (v: unknown) => (v ?? "").toString().toLowerCase();
    const map = (field: string) => {
      switch (field) {
        case "title":
          return `${oc.number} ${oc.projectName ?? ""} ${oc.customerName}`;
        case "type":
          return oc.status;
        case "date":
          return oc.date;
        default:
          return `${oc.number} ${oc.customerName}`;
      }
    };
    const cnd = valStr(map(c.field));
    const v = valStr(c.value);
    switch (c.operator) {
      case "equals":
        return cnd === v;
      case "not_equals":
        return cnd !== v;
      case "contains":
        return cnd.includes(v);
      case "not_contains":
        return !cnd.includes(v);
      case "starts_with":
        return cnd.startsWith(v);
      case "ends_with":
        return cnd.endsWith(v);
      default:
        return true;
    }
  };
  const evalGroup = (oc: OrderConfirmation, g: FilterGroup): boolean => {
    const cond = (g.conditions || []).map((cc) => evalCond(oc, cc));
    const own = g.operator === "AND" ? cond.every(Boolean) : cond.some(Boolean);
    const childs = (g.groups || []).map((gg) => evalGroup(oc, gg));
    const child =
      g.operator === "AND"
        ? childs.length
          ? childs.every(Boolean)
          : true
        : childs.length
        ? childs.some(Boolean)
        : false;
    return g.operator === "AND" ? own && child : own || child;
  };
  const matchAdv = (oc: OrderConfirmation) =>
    !advancedFilter ||
    !advancedFilter.isActive ||
    evalGroup(oc, advancedFilter.group);

  const filteredConfirmations = orderConfirmations.filter((confirmation) => {
    const matchesSearch =
      confirmation.customerName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      confirmation.projectName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      confirmation.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      confirmation.quoteReference
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || confirmation.status === statusFilter;

    return matchesSearch && matchesStatus && matchAdv(confirmation);
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default";
      case "sent":
        return "secondary";
      case "draft":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Bestätigt";
      case "sent":
        return "Versendet";
      case "draft":
        return "Entwurf";
      case "cancelled":
        return "Storniert";
      default:
        return "Unbekannt";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />;
      case "sent":
        return <Clock className="h-4 w-4" />;
      case "draft":
        return <Edit className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const handleStatusChange = (confirmationId: string, newStatus: string) => {
    // In a real app, this would update the database
    console.log(`Changing status of ${confirmationId} to ${newStatus}`);
  };

  const handleBulkAction = (action: string) => {
    // In a real app, this would perform bulk operations
    console.log(`Performing bulk action: ${action} on:`, selectedConfirmations);
  };

  const calculateStats = () => {
    const total = orderConfirmations.length;
    const confirmed = orderConfirmations.filter(
      (oc) => oc.status === "confirmed"
    ).length;
    const sent = orderConfirmations.filter((oc) => oc.status === "sent").length;
    const draft = orderConfirmations.filter(
      (oc) => oc.status === "draft"
    ).length;
    const totalValue = orderConfirmations.reduce(
      (sum, oc) => sum + oc.total,
      0
    );
    const confirmedValue = orderConfirmations
      .filter((oc) => oc.status === "confirmed")
      .reduce((sum, oc) => sum + oc.total, 0);

    return { total, confirmed, sent, draft, totalValue, confirmedValue };
  };

  const stats = calculateStats();

  return (
    <LayoutWithSidebar
      breadcrumbItems={[
        { label: "Home", href: "/dashboard" },
        { label: "Auftragsbestätigungen" },
      ]}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <input {...uploadInputProps} />
        {/* Page Header */}
        <div className="mb-8">
          <p className="text-gray-600 dark:text-gray-300">
            Verwaltung und Übersicht aller Auftragsbestätigungen
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gesamt</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Auftragsbestätigungen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bestätigt</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.confirmed}</div>
              <p className="text-xs text-green-600">
                €{stats.confirmedValue.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Versendet</CardTitle>
              <Send className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.sent}</div>
              <p className="text-xs text-muted-foreground">
                Warten auf Bestätigung
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entwürfe</CardTitle>
              <Edit className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.draft}</div>
              <p className="text-xs text-muted-foreground">
                Noch nicht versendet
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gesamtwert</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                €{stats.totalValue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Aller Aufträge</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="h-14 p-2 bg-muted/50 rounded-lg">
            <TabsTrigger
              value="overview"
              className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              Übersicht
            </TabsTrigger>
            <TabsTrigger
              value="tracking"
              className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              Status-Tracking
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              Auswertungen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Search and Filter */}
            <Card>
              <CardHeader>
                <CardDescription>
                  Alle Auftragsbestätigungen im Überblick
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Auftragsbestätigungen durchsuchen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">Alle Status</option>
                      <option value="draft">Entwürfe</option>
                      <option value="sent">Versendet</option>
                      <option value="confirmed">Bestätigt</option>
                      <option value="cancelled">Storniert</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    {selectedConfirmations.length > 0 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBulkAction("send")}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Bulk Versenden ({selectedConfirmations.length})
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBulkAction("export")}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Exportieren
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilterDialog(true)}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Aktualisieren
                    </Button>
                  </div>
                </div>

                {/* Order Confirmations List */}
                <div className="space-y-4">
                  {filteredConfirmations.map((confirmation) => (
                    <div
                      key={confirmation.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <input
                            type="checkbox"
                            checked={selectedConfirmations.includes(
                              confirmation.id
                            )}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedConfirmations((prev) => [
                                  ...prev,
                                  confirmation.id,
                                ]);
                              } else {
                                setSelectedConfirmations((prev) =>
                                  prev.filter((id) => id !== confirmation.id)
                                );
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <FileText className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {confirmation.number}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {confirmation.customerName} •{" "}
                              {confirmation.projectName}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-2xl font-bold">
                              €{confirmation.total.toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Lieferung:{" "}
                              {new Date(
                                confirmation.deliveryDate
                              ).toLocaleDateString("de-DE")}
                            </p>
                          </div>
                          <Badge
                            variant={getStatusColor(confirmation.status)}
                            className="flex items-center gap-2 shadow-sm"
                          >
                            {getStatusIcon(confirmation.status)}
                            {getStatusText(confirmation.status)}
                          </Badge>
                        </div>
                      </div>
                      {uploadedDocuments[confirmation.number] && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Zuletzt hochgeladen:{" "}
                          {uploadedDocuments[confirmation.number]}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{confirmation.customerName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span>{confirmation.projectName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>
                            Erstellt:{" "}
                            {new Date(confirmation.date).toLocaleDateString(
                              "de-DE"
                            )}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span>Angebot: {confirmation.quoteReference}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          {confirmation.positions} Positionen •
                          {confirmation.sentAt &&
                            ` Versendet: ${new Date(
                              confirmation.sentAt
                            ).toLocaleDateString("de-DE")}`}
                          {confirmation.confirmedAt &&
                            ` • Bestätigt: ${new Date(
                              confirmation.confirmedAt
                            ).toLocaleDateString("de-DE")}`}
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Anzeigen
                          </Button>

                          {/* Status-based actions */}
                          {statusService.isEditable(
                            confirmation.status as OrderConfirmationStatus
                          ) && (
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-2" />
                              Bearbeiten
                            </Button>
                          )}

                          {statusService.isSendable(
                            confirmation.status as OrderConfirmationStatus
                          ) && (
                            <Button variant="outline" size="sm">
                              <Mail className="h-4 w-4 mr-2" />
                              Versenden
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOrderUpload(confirmation)}
                            disabled={isUploadingForKey(confirmation.number)}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {isUploadingForKey(confirmation.number)
                              ? "Laedt..."
                              : "Dokument"}
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            PDF
                          </Button>

                          {/* More actions dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedConfirmationForStatus(
                                    confirmation
                                  );
                                  setShowStatusDialog(true);
                                }}
                              >
                                <Activity className="h-4 w-4 mr-2" />
                                Status ändern
                              </DropdownMenuItem>
                              {statusService.isCancellable(
                                confirmation.status as OrderConfirmationStatus
                              ) && (
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Stornieren
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredConfirmations.length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Keine Auftragsbestätigungen gefunden
                      </h3>
                      <p className="text-gray-500">
                        {searchTerm || statusFilter !== "all"
                          ? "Versuchen Sie eine andere Suche oder Filter-Einstellung."
                          : "Es wurden noch keine Auftragsbestätigungen erstellt."}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Status-Tracking</CardTitle>
                <CardDescription>
                  Verfolgen Sie den Status Ihrer Auftragsbestätigungen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Status Flow Diagram */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                    <h4 className="font-semibold mb-4">
                      Auftragsbestätigungs-Workflow
                    </h4>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                          <Edit className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-sm font-medium">Entwurf</span>
                        <span className="text-xs text-muted-foreground">
                          {stats.draft} Bestätigungen
                        </span>
                      </div>
                      <div className="flex-1 h-px bg-gray-300 mx-4"></div>
                      <div className="flex flex-col items-center space-y-2">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                          <Send className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-sm font-medium">Versendet</span>
                        <span className="text-xs text-muted-foreground">
                          {stats.sent} Bestätigungen
                        </span>
                      </div>
                      <div className="flex-1 h-px bg-gray-300 mx-4"></div>
                      <div className="flex flex-col items-center space-y-2">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-sm font-medium">Bestätigt</span>
                        <span className="text-xs text-muted-foreground">
                          {stats.confirmed} Bestätigungen
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Status Changes */}
                  <div>
                    <h4 className="font-semibold mb-4">
                      Aktuelle Statusänderungen
                    </h4>
                    <div className="space-y-3">
                      {orderConfirmations
                        .filter((oc) => oc.status !== "draft")
                        .sort(
                          (a, b) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime()
                        )
                        .slice(0, 5)
                        .map((confirmation) => (
                          <div
                            key={confirmation.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              {getStatusIcon(confirmation.status)}
                              <div>
                                <p className="font-medium">
                                  {confirmation.number}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {confirmation.customerName}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant={getStatusColor(confirmation.status)}
                                className="shadow-sm"
                              >
                                {getStatusText(confirmation.status)}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                {confirmation.status === "sent" &&
                                  confirmation.sentAt &&
                                  `Versendet: ${new Date(
                                    confirmation.sentAt
                                  ).toLocaleDateString("de-DE")}`}
                                {confirmation.status === "confirmed" &&
                                  confirmation.confirmedAt &&
                                  `Bestätigt: ${new Date(
                                    confirmation.confirmedAt
                                  ).toLocaleDateString("de-DE")}`}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bestätigungsrate</CardTitle>
                  <CardDescription>
                    Verhältnis von versendeten zu bestätigten Aufträgen
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Bestätigungsrate:</span>
                      <span className="text-2xl font-bold">
                        {stats.sent + stats.confirmed > 0
                          ? Math.round(
                              (stats.confirmed /
                                (stats.sent + stats.confirmed)) *
                                100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Bestätigt:</span>
                        <span>
                          {stats.confirmed} von {stats.sent + stats.confirmed}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${
                              stats.sent + stats.confirmed > 0
                                ? (stats.confirmed /
                                    (stats.sent + stats.confirmed)) *
                                  100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Durchschnittliche Bearbeitungszeit</CardTitle>
                  <CardDescription>
                    Zeit von Erstellung bis Bestätigung
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Durchschnitt:</span>
                      <span className="text-2xl font-bold">3,2 Tage</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Schnellste Bestätigung:</span>
                        <span>1 Tag</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Längste Bestätigung:</span>
                        <span>7 Tage</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Workflow-Effizienz</CardTitle>
                  <CardDescription>
                    Optimierungspotentiale im Bestätigungsprozess
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Automatisierungsgrad:</span>
                      <span className="text-2xl font-bold">67%</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Manuelle Eingriffe:</span>
                        <span>{stats.total - stats.confirmed} Fälle</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Optimierungspotential:</span>
                        <span className="text-green-600">Hoch</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Status Management Dialog */}
        {selectedConfirmationForStatus && (
          <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>
                  Status verwalten - {selectedConfirmationForStatus.number}
                </DialogTitle>
              </DialogHeader>
              <OrderConfirmationStatusManager
                orderConfirmationId={selectedConfirmationForStatus.id}
                currentStatus={
                  selectedConfirmationForStatus.status as OrderConfirmationStatus
                }
                onStatusChange={(newStatus, event) => {
                  // Update the confirmation in the list (in a real app, this would update the database)
                  console.log("Status changed:", { newStatus, event });
                  toast({
                    title: "Status aktualisiert",
                    description: `Auftragsbestätigung ${
                      selectedConfirmationForStatus.number
                    } wurde zu "${
                      statusService.getStatusInfo(newStatus).label
                    }" geändert`,
                  });
                  setShowStatusDialog(false);
                  setSelectedConfirmationForStatus(null);
                }}
                showHistory={true}
                context={{
                  hasPositions: selectedConfirmationForStatus.positions > 0,
                  hasCustomerEmail:
                    !!selectedConfirmationForStatus.customerEmail,
                  customerConfirmation:
                    selectedConfirmationForStatus.status === "confirmed",
                }}
              />
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowStatusDialog(false)}
                >
                  Schließen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        {/* Advanced Filter Dialog */}
        <AdvancedFilterDialog
          isOpen={showFilterDialog}
          onClose={() => setShowFilterDialog(false)}
          onSave={(filter) => {
            setAdvancedFilter(filter);
            setShowFilterDialog(false);
          }}
          title="Erweiterten Filter konfigurieren"
        />
      </div>
    </LayoutWithSidebar>
  );
};

export default OrderConfirmations;
