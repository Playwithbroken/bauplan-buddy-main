import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvoicesPageSkeleton } from "@/components/skeletons/InvoicesSkeletons";
import { usePageLoading } from "@/hooks/usePageLoading";
import AdvancedFilterDialog from "@/components/AdvancedFilterDialog";
import type {
  FilterDefinition,
  FilterCondition,
  FilterGroup,
} from "@/types/filtering";
import { LayoutWithSidebar } from "@/components/LayoutWithSidebar";
import { useLocation, useNavigate } from "react-router-dom";
import { slugifyCounterparty } from "@/utils/documentUpload";
import { useWorkflowDocumentUpload } from "@/hooks/useWorkflowDocumentUpload";
import {
  Receipt,
  Plus,
  Mail,
  Download,
  Edit,
  Trash2,
  Building,
  Calculator,
  Calendar,
  User,
  Phone,
  MapPin,
  Search,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  Filter,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { InvoiceGenerationDialog } from "@/components/dialogs/InvoiceGenerationDialog";

type OutgoingInvoice = {
  id: string;
  customer: string;
  project: string;
  amount: number;
  status: "sent" | "paid" | "overdue" | "pending" | "draft";
  date: string;
  dueDate: string;
  paidDate: string | null;
  contact: string;
  phone: string;
  address: string;
  positions: Array<{
    id: number;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
  }>;
  paymentHistory: Array<{
    date: string;
    amount: number;
    method: string;
    reference: string;
  }>;
  pdfFile?: string;
};

type IncomingInvoice = {
  id: string;
  supplier: string;
  project: string;
  amount: number;
  status: "pending" | "paid" | "overdue";
  date: string;
  dueDate: string;
  paidDate: string | null;
  contact: string;
  phone: string;
  address: string;
  description: string;
  pdfFile?: string;
};

const formatCurrency = (value: number) => {
  return `EUR ${value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const Invoices = () => {
  const { loading } = usePageLoading({ delay: 600 });
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [advancedFilter, setAdvancedFilter] = useState<FilterDefinition | null>(
    null
  );
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const {
    inputProps: uploadInputProps,
    startUpload: startWorkflowUpload,
    uploadedDocuments,
    isUploadingForKey,
  } = useWorkflowDocumentUpload();

  // Mock-Daten fuer Ausgangsrechnungen (AR)
  const demoOutgoing: OutgoingInvoice[] = [
    {
      id: "AR-2024-001",
      customer: "Familie Mueller",
      project: "Wohnhaus Muenchen",
      amount: 125000,
      status: "sent",
      date: "2024-02-01",
      dueDate: "2024-03-01",
      paidDate: null,
      contact: "Hans Mueller",
      phone: "+49 89 123456",
      address: "Musterstrasse 12, 80331 Muenchen",
      positions: [
        {
          id: 1,
          description: "Rohbau - 1. Rate",
          quantity: 1,
          unit: "Pauschal",
          unitPrice: 125000,
          total: 125000,
        },
      ],
      paymentHistory: [],
    },
    {
      id: "AR-2024-002",
      customer: "TechCorp GmbH",
      project: "Buerogebaeude Berlin",
      amount: 300000,
      status: "paid",
      date: "2024-01-15",
      dueDate: "2024-02-15",
      paidDate: "2024-02-10",
      contact: "Dr. Schmidt",
      phone: "+49 30 987654",
      address: "Alexanderplatz 5, 10178 Berlin",
      positions: [
        {
          id: 1,
          description: "Fundament - 1. Rate",
          quantity: 1,
          unit: "Pauschal",
          unitPrice: 300000,
          total: 300000,
        },
      ],
      paymentHistory: [
        {
          date: "2024-02-10",
          amount: 300000,
          method: "Ueberweisung",
          reference: "RE-2024-002",
        },
      ],
    },
    {
      id: "AR-2024-003",
      customer: "Hausverwaltung Nord",
      project: "Dachsanierung Hamburg",
      amount: 75000,
      status: "overdue",
      date: "2024-01-20",
      dueDate: "2024-02-20",
      paidDate: null,
      contact: "Frau Weber",
      phone: "+49 40 555123",
      address: "Hafenstrasse 88, 20359 Hamburg",
      positions: [
        {
          id: 1,
          description: "Dachdeckung - Abschluss",
          quantity: 1,
          unit: "Pauschal",
          unitPrice: 75000,
          total: 75000,
        },
      ],
      paymentHistory: [],
    },
  ];

  // Mock-Daten fuer Eingangsrechnungen (ER)
  const demoIncoming: IncomingInvoice[] = [
    {
      id: "ER-2024-001",
      supplier: "Bauhaus AG",
      project: "Wohnhaus Muenchen",
      amount: 45000,
      status: "pending",
      date: "2024-02-05",
      dueDate: "2024-03-05",
      paidDate: null,
      contact: "Max Mustermann",
      phone: "+49 89 111222",
      address: "Bauhausstrasse 1, 80339 Muenchen",
      description: "Zement und Beton fuer Rohbau",
      pdfFile: "ER-2024-001_Bauhaus.pdf",
    },
    {
      id: "ER-2024-002",
      supplier: "Stahlbau Schmidt",
      project: "Buerogebaeude Berlin",
      amount: 85000,
      status: "paid",
      date: "2024-01-25",
      dueDate: "2024-02-25",
      paidDate: "2024-02-20",
      contact: "Peter Schmidt",
      phone: "+49 30 333444",
      address: "Stahlstrasse 15, 10115 Berlin",
      description: "Stahltraeger und Bewehrung",
      pdfFile: "ER-2024-002_Stahlbau.pdf",
    },
    {
      id: "ER-2024-003",
      supplier: "Dachdecker Meier",
      project: "Dachsanierung Hamburg",
      amount: 28000,
      status: "overdue",
      date: "2024-01-30",
      dueDate: "2024-02-28",
      paidDate: null,
      contact: "Klaus Meier",
      phone: "+49 40 555666",
      address: "Dachstrasse 8, 20095 Hamburg",
      description: "Dachziegel und Daemmung",
      pdfFile: "ER-2024-003_Dachdecker.pdf",
    },
  ];

  const [outgoingInvoices, setOutgoingInvoices] =
    useState<OutgoingInvoice[]>(demoOutgoing);
  const [incomingInvoices, setIncomingInvoices] =
    useState<IncomingInvoice[]>(demoIncoming);

  const openInvoiceCreation = useCallback(() => {
    setShowInvoiceDialog(true);
  }, []);

  const locationWantsCreate =
    (location.state as { openCreate?: boolean } | undefined)?.openCreate ===
    true;

  useEffect(() => {
    if (locationWantsCreate) {
      openInvoiceCreation();
      navigate(location.pathname, { replace: true });
    }
  }, [locationWantsCreate, location.pathname, navigate, openInvoiceCreation]);

  useEffect(() => {
    const handleNewInvoice = () => openInvoiceCreation();
    window.addEventListener(
      "app:new-invoice",
      handleNewInvoice as EventListener
    );
    return () =>
      window.removeEventListener(
        "app:new-invoice",
        handleNewInvoice as EventListener
      );
  }, [openInvoiceCreation]);

  if (loading) return <InvoicesPageSkeleton />;

  const filteredOutgoing = outgoingInvoices.filter((invoice) => {
    const matchesSearch =
      invoice.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredIncoming = incomingInvoices.filter((invoice) => {
    const matchesSearch =
      invoice.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "default";
      case "sent":
        return "secondary";
      case "pending":
        return "outline";
      case "overdue":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Bezahlt";
      case "sent":
        return "Versendet";
      case "pending":
        return "Ausstehend";
      case "overdue":
        return "Ueberfaellig";
      default:
        return "Unbekannt";
    }
  };

  const handleInvoiceUpload = (
    invoice: OutgoingInvoice | IncomingInvoice,
    direction: "outgoing" | "incoming"
  ) => {
    const isOutgoing = direction === "outgoing";
    const counterpartyName = isOutgoing
      ? (invoice as OutgoingInvoice).customer
      : (invoice as IncomingInvoice).supplier;

    startWorkflowUpload({
      key: invoice.id,
      context: {
        workflowType: "rechnung",
        workflowId: invoice.id,
        counterpartyType: isOutgoing ? "kunde" : "lieferant",
        counterpartyId: slugifyCounterparty(counterpartyName),
      },
      metadata: {
        name: `${invoice.id}_${counterpartyName.replace(/\s+/g, "_")}`,
        description: `${isOutgoing ? "Ausgangs" : "Eingangs"}rechnung ${
          invoice.id
        }`,
        tags: ["rechnung", direction, invoice.id],
      },
      onSuccess: (documentName) => {
        if (isOutgoing) {
          setOutgoingInvoices((prev) =>
            prev.map((item) =>
              item.id === invoice.id ? { ...item, pdfFile: documentName } : item
            )
          );
        } else {
          setIncomingInvoices((prev) =>
            prev.map((item) =>
              item.id === invoice.id ? { ...item, pdfFile: documentName } : item
            )
          );
        }
      },
    });
  };

  const totalOutgoing = outgoingInvoices.reduce((sum, i) => sum + i.amount, 0);
  const totalIncoming = incomingInvoices.reduce((sum, i) => sum + i.amount, 0);
  const overdueOutgoing = outgoingInvoices
    .filter((i) => i.status === "overdue")
    .reduce((sum, i) => sum + i.amount, 0);
  const overdueIncoming = incomingInvoices
    .filter((i) => i.status === "overdue")
    .reduce((sum, i) => sum + i.amount, 0);

  const pageWrapperClass = isFullscreen
    ? "fixed inset-0 z-50 bg-background overflow-auto p-6"
    : "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8";
  const contentWrapperClass = isFullscreen
    ? "space-y-6 max-h-[calc(100vh-220px)] overflow-auto pr-1"
    : "space-y-6";
  const baseFilterRowClass =
    "flex flex-col gap-3 md:flex-row md:items-center md:justify-between";
  const filterRowClass = isFullscreen
    ? `${baseFilterRowClass} mb-6 sticky top-16 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border border-border/60 rounded-lg px-4 py-3 shadow-sm`
    : `${baseFilterRowClass} mb-6`;
  const statsGridClass = "grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-8";
  const tabsListClass = isFullscreen
    ? "sticky top-0 z-20 h-14 p-2 rounded-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border border-border/60"
    : "h-14 p-2 bg-muted/50 rounded-lg";

  const breadcrumbItems = [
    { label: "Home", href: "/dashboard" },
    { label: "Rechnungen" },
  ];

  return (
    <LayoutWithSidebar breadcrumbItems={breadcrumbItems}>
      <input {...uploadInputProps} />
      <div className={pageWrapperClass}>
        <div className="mb-8">
          <p className="text-sm text-muted-foreground">
            Ausgangs- und Eingangsrechnungen, Mahnwesen & PDF-Export
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 mb-4">
          <Button
            variant="subtle"
            size="compact"
            onClick={() => setIsFullscreen((prev) => !prev)}
            aria-label={
              isFullscreen ? "Ansicht verkleinern" : "Ansicht vergroessern"
            }
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="subtle"
            size="compact"
            onClick={() => setShowInvoiceDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Neue Rechnung
          </Button>
        </div>

        <div className={contentWrapperClass}>
          {/* Stats Cards */}
          <div className={statsGridClass}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium tracking-tight">
                  Ausgangsrechnungen
                </CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(totalOutgoing)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {outgoingInvoices.length} Rechnungen
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium tracking-tight">
                  Eingangsrechnungen
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(totalIncoming)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {incomingInvoices.length} Rechnungen
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium tracking-tight">
                  Ueberfaellig (AR)
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(overdueOutgoing)}
                </div>
                <p className="text-xs text-red-600">
                  {
                    outgoingInvoices.filter((i) => i.status === "overdue")
                      .length
                  }{" "}
                  Rechnungen
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium tracking-tight">
                  Faellig (ER)
                </CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(overdueIncoming)}
                </div>
                <p className="text-xs text-orange-600">
                  {
                    incomingInvoices.filter((i) => i.status === "overdue")
                      .length
                  }{" "}
                  Rechnungen
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className={tabsListClass}>
              <TabsTrigger
                value="overview"
                className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                Uebersicht
              </TabsTrigger>
              <TabsTrigger
                value="outgoing"
                className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                Ausgangsrechnungen
              </TabsTrigger>
              <TabsTrigger
                value="incoming"
                className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                Eingangsrechnungen
              </TabsTrigger>
              <TabsTrigger
                value="create"
                className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                Neue Rechnung
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Search and Filter */}
              <Card>
                <CardHeader>
                  <CardDescription>
                    Uebersicht aller Ausgangs- und Eingangsrechnungen
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={filterRowClass}>
                    <div className="relative flex-1 min-w-[220px]">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Rechnungen durchsuchen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowFilterDialog(true)}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>

                  {/* Critical Invoices */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4">
                      Kritische Rechnungen
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Overdue Outgoing */}
                      <Card className="border-red-200 dark:border-red-800">
                        <CardHeader className="pb-3">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            <CardTitle className="text-sm tracking-tight">
                              Ueberfaellige Ausgangsrechnungen
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {outgoingInvoices
                              .filter((i) => i.status === "overdue")
                              .map((invoice) => (
                                <div
                                  key={invoice.id}
                                  className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
                                >
                                  <div>
                                    <p className="font-medium">{invoice.id}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {invoice.customer}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold">
                                      {formatCurrency(invoice.amount)}
                                    </p>
                                    <p className="text-sm text-red-600">
                                      Faellig: {invoice.dueDate}
                                    </p>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Overdue Incoming */}
                      <Card className="border-orange-200 dark:border-orange-800">
                        <CardHeader className="pb-3">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-5 w-5 text-orange-500" />
                            <CardTitle className="text-sm tracking-tight">
                              Faellige Eingangsrechnungen
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {incomingInvoices
                              .filter((i) => i.status === "overdue")
                              .map((invoice) => (
                                <div
                                  key={invoice.id}
                                  className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg"
                                >
                                  <div>
                                    <p className="font-medium">{invoice.id}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {invoice.supplier}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold">
                                      {formatCurrency(invoice.amount)}
                                    </p>
                                    <p className="text-sm text-orange-600">
                                      Faellig: {invoice.dueDate}
                                    </p>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Letzte Aktivitaeten
                    </h3>
                    <div className="space-y-3">
                      {[...outgoingInvoices, ...incomingInvoices]
                        .sort(
                          (a, b) =>
                            new Date(b.date).getTime() -
                            new Date(a.date).getTime()
                        )
                        .slice(0, 5)
                        .map((invoice) => (
                          <div
                            key={invoice.id}
                            className="flex items-center space-x-4 p-4 border rounded-lg"
                          >
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                "supplier" in invoice
                                  ? "bg-blue-100 dark:bg-blue-900"
                                  : "bg-green-100 dark:bg-green-900"
                              }`}
                            >
                              {"supplier" in invoice ? (
                                <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              ) : (
                                <Receipt className="h-5 w-5 text-green-600 dark:text-green-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{invoice.id}</p>
                              <p className="text-sm text-muted-foreground">
                                {"supplier" in invoice
                                  ? invoice.supplier
                                  : invoice.customer}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">
                                {formatCurrency(invoice.amount)}
                              </p>
                              <Badge variant={getStatusColor(invoice.status)}>
                                {getStatusText(invoice.status)}
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="outgoing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ausgangsrechnungen (AR)</CardTitle>
                  <CardDescription>
                    Kundenrechnungen mit Nummernkreis, PDF & Mail-Versand
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredOutgoing.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="border rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                              <Receipt className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold">
                                {invoice.id}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {invoice.customer} | {invoice.project}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="text-2xl font-bold">
                                {formatCurrency(invoice.amount)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Faellig: {invoice.dueDate}
                              </p>
                            </div>
                            <Badge variant={getStatusColor(invoice.status)}>
                              {getStatusText(invoice.status)}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span>{invoice.contact}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{invoice.phone}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>{invoice.address}</span>
                          </div>
                        </div>

                        {/* Payment History */}
                        {invoice.paymentHistory.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium mb-2">
                              Zahlungshistorie
                            </h4>
                            <div className="space-y-2">
                              {invoice.paymentHistory.map((payment, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                                >
                                  <div className="flex items-center space-x-3">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <div>
                                      <p className="text-sm font-medium">
                                        {formatCurrency(payment.amount)}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {payment.method} | {payment.reference}
                                      </p>
                                    </div>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {payment.date}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Erstellt: {invoice.date} |{" "}
                            {invoice.positions.length} Positionen
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4 mr-2" />
                                Bearbeiten
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleInvoiceUpload(invoice, "outgoing")
                                }
                                disabled={isUploadingForKey(invoice.id)}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                {isUploadingForKey(invoice.id)
                                  ? "Laedt..."
                                  : "Dokument"}
                              </Button>
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                PDF
                              </Button>
                              <Button variant="outline" size="sm">
                                <Mail className="h-4 w-4 mr-2" />
                                Versenden
                              </Button>
                              {invoice.status !== "paid" && (
                                <Button variant="outline" size="sm">
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Als bezahlt markieren
                                </Button>
                              )}
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            {(uploadedDocuments[invoice.id] ??
                              invoice.pdfFile) && (
                              <span className="text-xs text-muted-foreground">
                                Zuletzt hochgeladen:{" "}
                                {uploadedDocuments[invoice.id] ??
                                  invoice.pdfFile}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="incoming" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Eingangsrechnungen (ER)</CardTitle>
                  <CardDescription>
                    Lieferantenrechnungen mit PDF-Upload & Faelligkeitspruefung
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredIncoming.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="border rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                              <CreditCard className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold">
                                {invoice.id}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {invoice.supplier} | {invoice.project}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="text-2xl font-bold">
                                {formatCurrency(invoice.amount)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Faellig: {invoice.dueDate}
                              </p>
                            </div>
                            <Badge variant={getStatusColor(invoice.status)}>
                              {getStatusText(invoice.status)}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span>{invoice.contact}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{invoice.phone}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>{invoice.address}</span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {invoice.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="text-sm text-muted-foreground">
                              Erstellt: {invoice.date}
                            </div>
                            {(uploadedDocuments[invoice.id] ||
                              invoice.pdfFile) && (
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-blue-600" />
                                <span className="text-sm text-blue-600">
                                  {uploadedDocuments[invoice.id] ??
                                    invoice.pdfFile}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleInvoiceUpload(invoice, "incoming")
                                }
                                disabled={isUploadingForKey(invoice.id)}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                {isUploadingForKey(invoice.id)
                                  ? "Laedt..."
                                  : "Dokument"}
                              </Button>
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                PDF anzeigen
                              </Button>
                              {invoice.status !== "paid" && (
                                <Button variant="outline" size="sm">
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Als bezahlt markieren
                                </Button>
                              )}
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            {uploadedDocuments[invoice.id] &&
                              !invoice.pdfFile && (
                                <span className="text-xs text-muted-foreground">
                                  Zuletzt hochgeladen:{" "}
                                  {uploadedDocuments[invoice.id]}
                                </span>
                              )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="create" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Neue Ausgangsrechnung erstellen</CardTitle>
                  <CardDescription>
                    Erstellen Sie eine neue Kundenrechnung mit automatischem
                    Nummernkreis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold">Kundendaten</h4>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="customer">Kunde</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Kunde auswaehlen" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mueller">
                                Familie Mueller
                              </SelectItem>
                              <SelectItem value="techcorp">
                                TechCorp GmbH
                              </SelectItem>
                              <SelectItem value="hausverwaltung">
                                Hausverwaltung Nord
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="project">Projekt</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Projekt auswaehlen" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mueller-haus">
                                Wohnhaus Muenchen
                              </SelectItem>
                              <SelectItem value="techcorp-buero">
                                Buerogebaeude Berlin
                              </SelectItem>
                              <SelectItem value="dach-hamburg">
                                Dachsanierung Hamburg
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="invoiceNumber">Rechnungsnummer</Label>
                          <Input
                            id="invoiceNumber"
                            value="AR-2024-004"
                            readOnly
                            className="bg-gray-50"
                          />
                        </div>
                        <div>
                          <Label htmlFor="invoiceDate">Rechnungsdatum</Label>
                          <Input id="invoiceDate" type="date" />
                        </div>
                        <div>
                          <Label htmlFor="dueDate">Faelligkeitsdatum</Label>
                          <Input id="dueDate" type="date" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">Rechnungsdetails</h4>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="paymentTerms">
                            Zahlungsbedingungen
                          </Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Zahlungsbedingungen" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="14">14 Tage netto</SelectItem>
                              <SelectItem value="30">30 Tage netto</SelectItem>
                              <SelectItem value="60">60 Tage netto</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="currency">Waehrung</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Waehrung" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EUR">EUR (Euro)</SelectItem>
                              <SelectItem value="USD">USD ($)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="vatRate">MwSt.-Satz</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="MwSt.-Satz" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="19">19%</SelectItem>
                              <SelectItem value="7">7%</SelectItem>
                              <SelectItem value="0">0%</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="notes">Anmerkungen</Label>
                          <Textarea
                            id="notes"
                            placeholder="Zusaetzliche Anmerkungen zur Rechnung..."
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Positionen */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Rechnungspositionen</h4>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Position hinzufuegen
                      </Button>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-4 py-3 text-left">Pos.</th>
                            <th className="px-4 py-3 text-left">
                              Beschreibung
                            </th>
                            <th className="px-4 py-3 text-left">Menge</th>
                            <th className="px-4 py-3 text-left">Einheit</th>
                            <th className="px-4 py-3 text-left">EP (EUR)</th>
                            <th className="px-4 py-3 text-left">GP (EUR)</th>
                            <th className="px-4 py-3 text-left">Aktionen</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t">
                            <td className="px-4 py-3">1</td>
                            <td className="px-4 py-3">
                              <Input placeholder="Beschreibung der Leistung" />
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                type="number"
                                placeholder="1"
                                className="w-20"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Select>
                                <SelectTrigger className="w-24">
                                  <SelectValue placeholder="Einheit" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="stk">Stk</SelectItem>
                                  <SelectItem value="m">m</SelectItem>
                                  <SelectItem value="m2">m2</SelectItem>
                                  <SelectItem value="m3">m3</SelectItem>
                                  <SelectItem value="pauschal">
                                    Pauschal
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                type="number"
                                placeholder="0,00"
                                className="w-24"
                              />
                            </td>
                            <td className="px-4 py-3 font-semibold">0,00</td>
                            <td className="px-4 py-3">
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Zusammenfassung */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-semibold">Rechnungssumme</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Nettobetrag:</span>
                        <span>EUR 0,00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>MwSt. (19%):</span>
                        <span>EUR 0,00</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-bold text-lg">
                          <span>Gesamtbetrag:</span>
                          <span>EUR 0,00</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Aktionen */}
                  <div className="flex justify-end space-x-4">
                    <Button variant="outline">Entwurf speichern</Button>
                    <Button>Rechnung erstellen</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Invoice Generation Dialog */}
        <InvoiceGenerationDialog
          open={showInvoiceDialog}
          onOpenChange={setShowInvoiceDialog}
        />
      </div>
      <AdvancedFilterDialog
        isOpen={showFilterDialog}
        onClose={() => setShowFilterDialog(false)}
        onSave={() => {
          setShowFilterDialog(false);
        }}
        title="Erweiterten Filter konfigurieren"
      />
    </LayoutWithSidebar>
  );
};

export default Invoices;
