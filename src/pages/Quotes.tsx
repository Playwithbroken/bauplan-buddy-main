import React, { useState, useMemo, useEffect, useCallback } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FileText,
  Plus,
  Mail,
  Download,
  Edit,
  Trash2,
  Building,
  Calculator,
  Euro,
  Calendar,
  User,
  Phone,
  MapPin,
  Search,
  ArrowRight,
  CheckCircle,
  Zap,
  Settings,
  Users,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Clock,
  AlertCircle,
  Filter,
  SortAsc,
  SortDesc,
  Calendar as CalendarIcon,
  Eye,
  RefreshCw,
  Upload,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { QuoteToProjectConverter } from "@/components/dialogs/QuoteToProjectConverter";
import { OrderConfirmationDialog } from "@/components/dialogs/OrderConfirmationDialog";
import { QuoteBatchOperations } from "@/components/batch/QuoteBatchOperations";
import { useWorkflowDocumentUpload } from "@/hooks/useWorkflowDocumentUpload";
import { slugifyCounterparty } from "@/utils/documentUpload";
import { LayoutWithSidebar } from "@/components/LayoutWithSidebar";
import { Checkbox } from "@/components/ui/checkbox";
import { EnhancedQuoteCreation } from "@/components/forms/EnhancedQuoteCreation";
import { useToast } from "@/hooks/use-toast";
import { QuoteTemplatesManager } from "@/components/templates/QuoteTemplatesManager";
import AdvancedFilterDialog from "@/components/AdvancedFilterDialog";
import type {
  FilterDefinition,
  FilterCondition,
  FilterGroup,
} from "@/types/filtering";

type QuoteItem = {
  id: string;
  customer: string;
  project: string;
  amount: number;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired" | "pending";
  date: string;
  validUntil: string;
  contact: string;
  phone: string;
  address: string;
  positions: Array<{
    id: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
    category: string;
  }>;
};

const Quotes = () => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const openQuoteCreation = useCallback(() => {
    setActiveTab("create");
    window.requestAnimationFrame(() => {
      const projectNameInput = document.getElementById(
        "projectName"
      ) as HTMLInputElement | null;
      projectNameInput?.focus();
    });
  }, [setActiveTab]);

  const locationWantsCreate =
    (location.state as { openCreate?: boolean } | undefined)?.openCreate ===
    true;

  useEffect(() => {
    if (locationWantsCreate) {
      openQuoteCreation();
      navigate(location.pathname, { replace: true });
    }
  }, [locationWantsCreate, location.pathname, navigate, openQuoteCreation]);

  useEffect(() => {
    const handleNewQuote = () => openQuoteCreation();
    window.addEventListener("app:new-quote", handleNewQuote as EventListener);
    return () => {
      window.removeEventListener(
        "app:new-quote",
        handleNewQuote as EventListener
      );
    };
  }, [openQuoteCreation]);

  const [isConvertingToProject, setIsConvertingToProject] = useState(false);
  const [convertingQuoteId, setConvertingQuoteId] = useState("");
  const [showQuoteToProjectDialog, setShowQuoteToProjectDialog] =
    useState(false);
  const [showOrderConfirmationDialog, setShowOrderConfirmationDialog] =
    useState(false);
  const [showBatchOperations, setShowBatchOperations] = useState(false);
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>([]);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [advancedFilter, setAdvancedFilter] = useState<FilterDefinition | null>(
    null
  );
  const [selectAll, setSelectAll] = useState(false);
  const {
    inputProps: uploadInputProps,
    startUpload: startWorkflowUpload,
    uploadedDocuments,
    isUploadingForKey,
  } = useWorkflowDocumentUpload();

  const handleQuoteUpload = (quote: QuoteItem) => {
    startWorkflowUpload({
      key: quote.id,
      context: {
        workflowType: "angebot",
        workflowId: quote.id,
        counterpartyType: "kunde",
        counterpartyId: slugifyCounterparty(quote.customer),
      },
      metadata: {
        name: `${quote.id}_${quote.customer.replace(/\s+/g, "_")}`,
        description: `Angebot ${quote.id} fuer ${quote.customer}`,
        tags: ["angebot", quote.id],
      },
      successMessage: `Dokument dem Angebot ${quote.id} zugeordnet.`,
    });
  };
  const [sortBy, setSortBy] = useState<
    "date" | "amount" | "customer" | "status"
  >("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<
    "week" | "month" | "quarter" | "year"
  >("month");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedQuoteForConversion, setSelectedQuoteForConversion] = useState<{
    id: string;
    number: string;
    customer: string;
    customerId: string;
    project: string;
    amount: number;
    status: "draft" | "sent" | "accepted" | "rejected" | "expired";
    date: string;
    validUntil: string;
    positions: {
      id: string;
      description: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      total: number;
      category: string;
    }[];
    estimatedDuration?: number;
  } | null>(null);
  const [
    selectedQuoteForOrderConfirmation,
    setSelectedQuoteForOrderConfirmation,
  ] = useState<{
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
  } | null>(null);

  // Quote to Project conversion function
  const convertQuoteToProject = (quote: {
    id: string;
    customer: string;
    project: string;
    amount: number;
    status: string;
  }) => {
    setIsConvertingToProject(true);
    setConvertingQuoteId(quote.id);

    // Simulate API call
    setTimeout(() => {
      alert(`Angebot ${quote.id} wurde erfolgreich in ein Projekt umgewandelt!

Projekt-ID: PRJ-${quote.id.replace("ANG", "PROJECT")}
Name: ${quote.project}
Kunde: ${quote.customer}
Budget: ${quote.amount.toLocaleString()}`);
      setIsConvertingToProject(false);
      setConvertingQuoteId("");
    }, 2000);
  };

  // Mock-Daten fr Angebote
  const quotes = useMemo<QuoteItem[]>(
    () => [
      {
        id: "ANG-2024-001",
        customer: "Familie Mller",
        project: "Wohnhaus Mnchen",
        amount: 450000,
        status: "sent",
        date: "2024-02-10",
        validUntil: "2024-03-10",
        contact: "Hans Mller",
        phone: "+49 89 123456",
        address: "Musterstrae 12, 80331 Mnchen",
        positions: [
          {
            id: "1",
            description: "Rohbau",
            quantity: 1,
            unit: "Pauschal",
            unitPrice: 180000,
            total: 180000,
            category: "construction",
          },
          {
            id: "2",
            description: "Dacharbeiten",
            quantity: 120,
            unit: "m",
            unitPrice: 850,
            total: 102000,
            category: "roofing",
          },
          {
            id: "3",
            description: "Innenausbau",
            quantity: 1,
            unit: "Pauschal",
            unitPrice: 168000,
            total: 168000,
            category: "interior",
          },
        ],
      },
      {
        id: "ANG-2024-002",
        customer: "TechCorp GmbH",
        project: "Brogebude Berlin",
        amount: 1200000,
        status: "accepted",
        date: "2024-01-25",
        validUntil: "2024-02-25",
        contact: "Dr. Schmidt",
        phone: "+49 30 987654",
        address: "Alexanderplatz 5, 10178 Berlin",
        positions: [
          {
            id: "1",
            description: "Fundament",
            quantity: 1,
            unit: "Pauschal",
            unitPrice: 250000,
            total: 250000,
            category: "foundation",
          },
          {
            id: "2",
            description: "Stahlbeton",
            quantity: 800,
            unit: "m",
            unitPrice: 450,
            total: 360000,
            category: "concrete",
          },
          {
            id: "3",
            description: "Fassade",
            quantity: 2400,
            unit: "m",
            unitPrice: 245,
            total: 588000,
            category: "exterior",
          },
        ],
      },
      {
        id: "ANG-2024-003",
        customer: "Hausverwaltung Nord",
        project: "Dachsanierung Hamburg",
        amount: 75000,
        status: "pending",
        date: "2024-02-12",
        validUntil: "2024-03-12",
        contact: "Frau Weber",
        phone: "+49 40 555123",
        address: "Hafenstrae 88, 20359 Hamburg",
        positions: [
          {
            id: "1",
            description: "Dachdeckung",
            quantity: 180,
            unit: "m",
            unitPrice: 320,
            total: 57600,
            category: "roofing",
          },
          {
            id: "2",
            description: "Dachdmmung",
            quantity: 180,
            unit: "m",
            unitPrice: 95,
            total: 17100,
            category: "insulation",
          },
        ],
      },
    ],
    []
  );

  const evaluateCondition = (
    quote: QuoteItem,
    condition: FilterCondition
  ): boolean => {
    const valStr = (v: unknown) => (v ?? "").toString().toLowerCase();
    const field = condition.field;
    const value = condition.value;
    const op = condition.operator;
    // Map generic fields to quote fields
    const candidate = (() => {
      switch (field) {
        case "title":
          return `${quote.project} ${quote.id} ${quote.customer}`;
        case "location":
          return quote.address;
        case "type":
          return quote.status;
        case "date":
          return quote.date;
        default:
          return `${quote.project} ${quote.id} ${quote.customer}`;
      }
    })();
    const c = valStr(candidate);
    const v = valStr(value);
    switch (op) {
      case "equals":
        return c === v;
      case "not_equals":
        return c !== v;
      case "contains":
        return c.includes(v);
      case "not_contains":
        return !c.includes(v);
      case "starts_with":
        return c.startsWith(v);
      case "ends_with":
        return c.endsWith(v);
      default:
        return true; // unsupported operators treated as pass
    }
  };

  const evaluateGroup = (quote: QuoteItem, group: FilterGroup): boolean => {
    const condResults = (group.conditions || []).map((c) =>
      evaluateCondition(quote, c)
    );
    const own =
      group.operator === "AND"
        ? condResults.every(Boolean)
        : condResults.some(Boolean);
    const childResults = (group.groups || []).map((g) =>
      evaluateGroup(quote, g)
    );
    const child =
      group.operator === "AND"
        ? childResults.length
          ? childResults.every(Boolean)
          : true
        : childResults.length
        ? childResults.some(Boolean)
        : false;
    return group.operator === "AND" ? own && child : own || child;
  };

  const matchesAdvancedFilter = (quote: QuoteItem): boolean => {
    if (!advancedFilter || !advancedFilter.isActive) return true;
    return evaluateGroup(quote, advancedFilter.group);
  };

  const filteredQuotes = quotes.filter((quote) => {
    const matchesSearch =
      quote.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || quote.status === statusFilter;
    return matchesSearch && matchesAdvancedFilter(quote) && matchesStatus;
  });

  // Interactive Analytics Calculations
  const analytics = useMemo(() => {
    const totalValue = quotes.reduce((sum, q) => sum + q.amount, 0);
    const acceptedQuotes = quotes.filter((q) => q.status === "accepted");
    const acceptedValue = acceptedQuotes.reduce((sum, q) => sum + q.amount, 0);
    const pendingQuotes = quotes.filter((q) => q.status === "pending");
    const pendingValue = pendingQuotes.reduce((sum, q) => sum + q.amount, 0);
    const sentQuotes = quotes.filter((q) => q.status === "sent");
    const sentValue = sentQuotes.reduce((sum, q) => sum + q.amount, 0);
    const rejectedQuotes = quotes.filter((q) => q.status === "rejected");

    const successRate =
      quotes.length > 0 ? (acceptedQuotes.length / quotes.length) * 100 : 0;
    const avgQuoteValue = quotes.length > 0 ? totalValue / quotes.length : 0;
    const conversionRate = acceptedQuotes.length;

    // Calculate trends (mock data for demonstration)
    const lastMonthAccepted = Math.round(acceptedQuotes.length * 0.8);
    const acceptedTrend =
      ((acceptedQuotes.length - lastMonthAccepted) / lastMonthAccepted) * 100;
    const lastMonthValue = totalValue * 0.85;
    const valueTrend = ((totalValue - lastMonthValue) / lastMonthValue) * 100;

    return {
      totalQuotes: quotes.length,
      totalValue,
      acceptedQuotes: acceptedQuotes.length,
      acceptedValue,
      pendingQuotes: pendingQuotes.length,
      pendingValue,
      sentQuotes: sentQuotes.length,
      sentValue,
      rejectedQuotes: rejectedQuotes.length,
      successRate,
      avgQuoteValue,
      conversionRate,
      acceptedTrend,
      valueTrend,
    };
  }, [quotes]);

  // Enhanced sorting
  const sortedQuotes = useMemo(() => {
    const sorted = [...filteredQuotes].sort((a, b) => {
      let compareValue = 0;
      switch (sortBy) {
        case "date":
          compareValue =
            new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "amount":
          compareValue = a.amount - b.amount;
          break;
        case "customer":
          compareValue = a.customer.localeCompare(b.customer);
          break;
        case "status":
          compareValue = a.status.localeCompare(b.status);
          break;
        default:
          compareValue = 0;
      }
      return sortOrder === "asc" ? compareValue : -compareValue;
    });
    return sorted;
  }, [filteredQuotes, sortBy, sortOrder]);

  // Refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
    toast({
      title: "Daten aktualisiert",
      description: "Angebotsdaten wurden erfolgreich aktualisiert",
    });
  };

  // Batch selection handlers
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedQuoteIds(sortedQuotes.map((q) => q.id));
    } else {
      setSelectedQuoteIds([]);
    }
  };

  const handleSelectQuote = (quoteId: string, checked: boolean) => {
    if (checked) {
      setSelectedQuoteIds((prev) => [...prev, quoteId]);
    } else {
      setSelectedQuoteIds((prev) => prev.filter((id) => id !== quoteId));
      setSelectAll(false);
    }
  };

  const handleBatchOperationComplete = () => {
    setSelectedQuoteIds([]);
    setSelectAll(false);
    setShowBatchOperations(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "default";
      case "sent":
        return "secondary";
      case "pending":
        return "outline";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "accepted":
        return "Angenommen";
      case "sent":
        return "Versendet";
      case "pending":
        return "Wartend";
      case "rejected":
        return "Abgelehnt";
      default:
        return "Unbekannt";
    }
  };

  const pageWrapperClass = isFullscreen
    ? "fixed inset-0 z-50 bg-background overflow-auto p-6"
    : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8";

  const contentWrapperClass = isFullscreen
    ? "space-y-6 max-h-[calc(100vh-220px)] overflow-auto pr-1"
    : "space-y-6";

  const filterRowClass = isFullscreen
    ? "flex flex-wrap gap-3 md:items-center sticky top-16 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border border-border/60 rounded-md p-3"
    : "flex flex-wrap gap-3 md:items-center";

  return (
    <LayoutWithSidebar
      breadcrumbItems={[
        { label: "Home", href: "/dashboard" },
        { label: "Angebote" },
      ]}
    >
      <div className={pageWrapperClass}>
        <input {...uploadInputProps} />
        {/* Page Header */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-gray-600 dark:text-gray-300">
              Positionen, Summen, PDF & Mail-Versand (Phase 1)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="icon"
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
            <Button variant="outline" onClick={openQuoteCreation}>
              <Plus className="h-4 w-4 mr-2" />
              Neues Angebot
            </Button>
            <Button variant="outline" onClick={() => setShowFilterDialog(true)}>
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        <div className={contentWrapperClass}>
          {/* Enhanced Interactive Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setStatusFilter("all")}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Gesamt Angebote
                </CardTitle>
                <div className="flex items-center space-x-1">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {analytics.acceptedTrend > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.totalQuotes}
                </div>
                <div className="flex items-center space-x-2">
                  <p className="text-xs text-muted-foreground">Dieses Jahr</p>
                  <Badge variant="outline" className="text-xs">
                    {analytics.acceptedTrend > 0 ? "+" : ""}
                    {analytics.acceptedTrend.toFixed(1)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setStatusFilter("all")}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Angebotssumme
                </CardTitle>
                <div className="flex items-center space-x-1">
                  <Euro className="h-4 w-4 text-muted-foreground" />
                  {analytics.valueTrend > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.totalValue.toLocaleString()}
                </div>
                <div className="flex items-center space-x-2">
                  <p className="text-xs text-muted-foreground">Gesamtwert</p>
                  <Badge variant="outline" className="text-xs">
                    {analytics.valueTrend > 0 ? "+" : ""}
                    {analytics.valueTrend.toFixed(1)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setStatusFilter("accepted")}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Angenommen
                </CardTitle>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <Target className="h-3 w-3 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.acceptedQuotes}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-green-600">
                    {analytics.acceptedValue.toLocaleString()}
                  </p>
                  <Progress
                    value={analytics.successRate}
                    className="w-16 h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Erfolgsrate
                </CardTitle>
                <div className="flex items-center space-x-1">
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                  <BarChart3 className="h-3 w-3 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.successRate.toFixed(1)}%
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Annahmequote</p>
                  <Badge
                    variant={
                      analytics.successRate > 50 ? "default" : "secondary"
                    }
                  >
                    {analytics.successRate > 50 ? "Gut" : "Verbesserbar"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setStatusFilter("accepted")}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Zu Projekte
                </CardTitle>
                <div className="flex items-center space-x-1">
                  <ArrowRight className="h-4 w-4 text-blue-600" />
                  <Activity className="h-3 w-3 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.conversionRate}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-blue-600">
                    Bereit fr Konvertierung
                  </p>
                  <Badge variant="outline" className="bg-blue-50">
                    {analytics.conversionRate > 0 ? "Verfgbar" : "Keine"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Interactive Dashboard Controls */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Interaktives Dashboard</span>
                  </CardTitle>
                  <CardDescription>
                    Erweiterte Analyse und Filteroptionen
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${
                      isRefreshing ? "animate-spin" : ""
                    }`}
                  />
                  Aktualisieren
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div className="space-y-2">
                  <Label>Status Filter</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Status</SelectItem>
                      <SelectItem value="draft">Entwurf</SelectItem>
                      <SelectItem value="sent">Versendet</SelectItem>
                      <SelectItem value="pending">Wartend</SelectItem>
                      <SelectItem value="accepted">Angenommen</SelectItem>
                      <SelectItem value="rejected">Abgelehnt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Options */}
                <div className="space-y-2">
                  <Label>Sortierung</Label>
                  <Select
                    value={sortBy}
                    onValueChange={(
                      value: "date" | "amount" | "customer" | "status"
                    ) => setSortBy(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Datum</SelectItem>
                      <SelectItem value="amount">Betrag</SelectItem>
                      <SelectItem value="customer">Kunde</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Order */}
                <div className="space-y-2">
                  <Label>Reihenfolge</Label>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                    }
                    className="w-full justify-start"
                  >
                    {sortOrder === "asc" ? (
                      <>
                        <SortAsc className="h-4 w-4 mr-2" />
                        Aufsteigend
                      </>
                    ) : (
                      <>
                        <SortDesc className="h-4 w-4 mr-2" />
                        Absteigend
                      </>
                    )}
                  </Button>
                </div>

                {/* Quick Stats */}
                <div className="space-y-2">
                  <Label>Schnellansicht</Label>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Gefiltert:</span>
                      <span className="font-medium">{sortedQuotes.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span> Wert:</span>
                      <span className="font-medium">
                        {analytics.avgQuoteValue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Wartend:</span>
                      <span className="font-medium text-yellow-600">
                        {analytics.pendingQuotes}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Distribution Chart */}
              <div className="mt-6">
                <h4 className="font-medium mb-3 flex items-center space-x-2">
                  <PieChart className="h-4 w-4" />
                  <span>Status Verteilung</span>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Angenommen</p>
                      <p className="text-xs text-muted-foreground">
                        {analytics.acceptedQuotes} (
                        {(
                          (analytics.acceptedQuotes / analytics.totalQuotes) *
                          100
                        ).toFixed(1)}
                        %)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Versendet</p>
                      <p className="text-xs text-muted-foreground">
                        {analytics.sentQuotes} (
                        {(
                          (analytics.sentQuotes / analytics.totalQuotes) *
                          100
                        ).toFixed(1)}
                        %)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Wartend</p>
                      <p className="text-xs text-muted-foreground">
                        {analytics.pendingQuotes} (
                        {(
                          (analytics.pendingQuotes / analytics.totalQuotes) *
                          100
                        ).toFixed(1)}
                        %)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Abgelehnt</p>
                      <p className="text-xs text-muted-foreground">
                        {analytics.rejectedQuotes} (
                        {(
                          (analytics.rejectedQuotes / analytics.totalQuotes) *
                          100
                        ).toFixed(1)}
                        %)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-4 h-14 p-2 bg-muted/50 rounded-lg">
              <TabsTrigger
                value="overview"
                className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                bersicht
              </TabsTrigger>
              <TabsTrigger
                value="conversion"
                className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                Projekt-Konvertierung
              </TabsTrigger>
              <TabsTrigger
                value="create"
                className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                Neues Angebot
              </TabsTrigger>
              <TabsTrigger
                value="templates"
                className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                Vorlagen
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Search and Filter */}
              <Card
                className={
                  isFullscreen
                    ? "sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm border border-border/60"
                    : undefined
                }
              >
                <CardHeader>
                  <CardDescription>Alle Angebote im berblick</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={filterRowClass}>
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Angebote durchsuchen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowFilterDialog(true)}
                    >
                      Filter
                    </Button>
                    {selectedQuoteIds.length > 0 && (
                      <Button
                        onClick={() => setShowBatchOperations(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Batch-Operationen ({selectedQuoteIds.length})
                      </Button>
                    )}
                  </div>

                  {/* Batch Selection Controls */}
                  {sortedQuotes.length > 0 && (
                    <div className="flex items-center space-x-4 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="select-all"
                          checked={selectAll}
                          onCheckedChange={handleSelectAll}
                        />

                        <Label
                          htmlFor="select-all"
                          className="text-sm font-medium"
                        >
                          Alle auswhlen ({sortedQuotes.length})
                        </Label>
                      </div>

                      {selectedQuoteIds.length > 0 && (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>
                            {selectedQuoteIds.length} von {sortedQuotes.length}{" "}
                            ausgewhlt
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quotes List */}
                  <div className="space-y-4">
                    {sortedQuotes.map((quote) => (
                      <div
                        key={quote.id}
                        className="border rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <Checkbox
                              checked={selectedQuoteIds.includes(quote.id)}
                              onCheckedChange={(checked) =>
                                handleSelectQuote(quote.id, checked as boolean)
                              }
                            />

                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                              <FileText className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold">
                                {quote.id}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {quote.customer} {quote.project}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="text-2xl font-bold">
                                {quote.amount.toLocaleString()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Gltig bis: {quote.validUntil}
                              </p>
                            </div>
                            <Badge variant={getStatusColor(quote.status)}>
                              {getStatusText(quote.status)}
                            </Badge>
                          </div>
                          {uploadedDocuments[quote.id] && (
                            <span className="text-xs text-muted-foreground">
                              Zuletzt hochgeladen: {uploadedDocuments[quote.id]}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span>{quote.contact}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{quote.phone}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>{quote.address}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Erstellt: {quote.date} {quote.positions.length}{" "}
                            Positionen
                          </div>
                          <div className="flex space-x-2">
                            {quote.status === "accepted" && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedQuoteForConversion({
                                      id: quote.id,
                                      number: quote.id,
                                      customer: quote.customer,
                                      customerId: `CUST-${
                                        quote.id.split("-")[2]
                                      }`,
                                      project: quote.project,
                                      amount: quote.amount,
                                      status: quote.status as "accepted",
                                      date: quote.date,
                                      validUntil: quote.validUntil,
                                      positions: quote.positions,
                                      estimatedDuration: 90, // Default duration in days
                                    });
                                    setShowQuoteToProjectDialog(true);
                                  }}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <ArrowRight className="h-4 w-4 mr-2" />
                                  In Projekt umwandeln
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedQuoteForOrderConfirmation({
                                      id: quote.id,
                                      number: quote.id,
                                      customer: quote.customer,
                                      customerId: `CUST-${
                                        quote.id.split("-")[2]
                                      }`,
                                      customerEmail: `${quote.customer
                                        .toLowerCase()
                                        .replace(/\s+/g, ".")}@example.com`,
                                      customerAddress: quote.address,
                                      projectName: quote.project,
                                      positions: quote.positions,
                                      amount: quote.amount,
                                    });
                                    setShowOrderConfirmationDialog(true);
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Auftragsbesttigung
                                </Button>
                              </>
                            )}
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-2" />
                              Bearbeiten
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuoteUpload(quote)}
                              disabled={isUploadingForKey(quote.id)}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              {isUploadingForKey(quote.id)
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
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="conversion" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ArrowRight className="h-5 w-5 text-green-600" />
                    <span>Angebot zu Projekt Konvertierung</span>
                    <Badge variant="outline" className="ml-auto">
                      {quotes.filter((q) => q.status === "accepted").length}{" "}
                      bereit
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Wandeln Sie angenommene Angebote automatisch in Projekte um
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Real-time Conversion Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <Target className="h-8 w-8 text-green-600" />
                          <div>
                            <p className="text-2xl font-bold">
                              {
                                quotes.filter((q) => q.status === "accepted")
                                  .length
                              }
                            </p>
                            <p className="text-sm text-green-700">
                              Bereit fr Konvertierung
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <Euro className="h-8 w-8 text-blue-600" />
                          <div>
                            <p className="text-2xl font-bold">
                              {quotes
                                .filter((q) => q.status === "accepted")
                                .reduce((sum, q) => sum + q.amount, 0)
                                .toLocaleString()}
                            </p>
                            <p className="text-sm text-blue-700">
                              Gesamtvolumen
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-purple-200 bg-purple-50 dark:bg-purple-900/20">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-8 w-8 text-purple-600" />
                          <div>
                            <p className="text-2xl font-bold">
                              {Math.round(
                                (quotes
                                  .filter((q) => q.status === "accepted")
                                  .reduce((sum, q) => sum + q.amount, 0) /
                                  1000) *
                                  0.12
                              )}{" "}
                              Tage
                            </p>
                            <p className="text-sm text-purple-700">
                              Geschtzte Dauer
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Conversion Ready Quotes */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span>Bereit fr Konvertierung</span>
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Angenommene Angebote, die in Projekte umgewandelt werden
                        knnen:
                      </p>

                      <div className="space-y-3">
                        {quotes
                          .filter((q) => q.status === "accepted")
                          .map((quote) => (
                            <div
                              key={quote.id}
                              className="border rounded-lg p-4 bg-green-50 dark:bg-green-900/20"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h4 className="font-medium">
                                    {quote.project}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {quote.customer} {quote.id}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">
                                    {quote.amount.toLocaleString()}
                                  </p>
                                  <Badge
                                    variant="default"
                                    className="bg-green-600"
                                  >
                                    {getStatusText(quote.status)}
                                  </Badge>
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                  {quote.positions.length} Positionen
                                  Angenommen: {quote.date}
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedQuoteForConversion({
                                      id: quote.id,
                                      number: quote.id,
                                      customer: quote.customer,
                                      customerId: `CUST-${
                                        quote.id.split("-")[2]
                                      }`,
                                      project: quote.project,
                                      amount: quote.amount,
                                      status: quote.status as "accepted",
                                      date: quote.date,
                                      validUntil: quote.validUntil,
                                      positions: quote.positions,
                                      estimatedDuration: 90,
                                    });
                                    setShowQuoteToProjectDialog(true);
                                  }}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <ArrowRight className="h-4 w-4 mr-2" />
                                  Projekt erstellen
                                </Button>
                              </div>
                            </div>
                          ))}

                        {quotes.filter((q) => q.status === "accepted")
                          .length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Keine angenommenen Angebote verfgbar</p>
                            <p className="text-sm">
                              Angenommene Angebote erscheinen hier zur
                              Projektkonvertierung
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Conversion Process Info */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg flex items-center space-x-2">
                        <Zap className="h-5 w-5 text-blue-600" />
                        <span>Automatischer Konvertierungsprozess</span>
                      </h3>

                      <div className="space-y-4">
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">
                            Was wird automatisch erstellt:
                          </h4>
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span>Neues Projekt mit allen Angebotsdaten</span>
                            </li>
                            <li className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span>Automatische Ordnerstruktur</span>
                            </li>
                            <li className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span>
                                Standardmeilensteine basierend auf Projekttyp
                              </span>
                            </li>
                            <li className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span>Budgetplanung aus Angebotspositionen</span>
                            </li>
                            <li className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span>Kundendaten und Kontaktinformationen</span>
                            </li>
                            <li className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span>Initiale Aufgabenplanung</span>
                            </li>
                          </ul>
                        </div>

                        <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                          <h4 className="font-medium mb-2">
                            Projektvorlagen nach Angebotsgre:
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>&lt; 100.000:</span>
                              <span className="text-muted-foreground">
                                Klein-Projekt (4 Meilensteine)
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>100.000 - 500.000:</span>
                              <span className="text-muted-foreground">
                                Standard-Projekt (6 Meilensteine)
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>&gt; 500.000:</span>
                              <span className="text-muted-foreground">
                                Gro-Projekt (8 Meilensteine)
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="border rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/20">
                          <h4 className="font-medium mb-2 flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-yellow-600" />
                            <span>Automatische Zeitplanung:</span>
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Basierend auf der Angebotssumme und dem Projekttyp
                            wird automatisch eine realistische Zeitplanung
                            erstellt. Meilensteine werden intelligent verteilt
                            und knnen spter angepasst werden.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Conversion History */}
                  <div className="mt-8">
                    <h3 className="font-semibold text-lg mb-4">
                      Konvertierungshistorie
                    </h3>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-4 py-3 text-left">Angebot</th>
                            <th className="px-4 py-3 text-left">Projekt</th>
                            <th className="px-4 py-3 text-left">Kunde</th>
                            <th className="px-4 py-3 text-left">Budget</th>
                            <th className="px-4 py-3 text-left">
                              Konvertiert am
                            </th>
                            <th className="px-4 py-3 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t">
                            <td className="px-4 py-3">ANG-2024-002</td>
                            <td className="px-4 py-3">Brogebude TechCorp</td>
                            <td className="px-4 py-3">TechCorp GmbH</td>
                            <td className="px-4 py-3">1.200.000</td>
                            <td className="px-4 py-3">15.02.2024</td>
                            <td className="px-4 py-3">
                              <Badge variant="default">Aktives Projekt</Badge>
                            </td>
                          </tr>
                          <tr className="border-t">
                            <td className="px-4 py-3">ANG-2024-001</td>
                            <td className="px-4 py-3">
                              Wohnhaus Familie Mller
                            </td>
                            <td className="px-4 py-3">Familie Mller</td>
                            <td className="px-4 py-3">450.000</td>
                            <td className="px-4 py-3">10.02.2024</td>
                            <td className="px-4 py-3">
                              <Badge variant="default">Aktives Projekt</Badge>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="create" className="space-y-6">
              <EnhancedQuoteCreation
                onQuoteCreated={(quote) => {
                  toast({
                    title: "Angebot erstellt",
                    description: `Angebot ${quote.number} wurde erfolgreich erstellt`,
                  });
                  setActiveTab("overview");
                }}
              />
            </TabsContent>

            <TabsContent value="templates" className="space-y-6">
              <QuoteTemplatesManager mode="browse" />
            </TabsContent>
          </Tabs>
        </div>

        {/* Quote to Project Converter Dialog */}
        <QuoteToProjectConverter
          open={showQuoteToProjectDialog}
          onOpenChange={setShowQuoteToProjectDialog}
          quoteData={selectedQuoteForConversion}
          onProjectCreated={(project) => {
            console.log("Project created:", project);
            // Here you could navigate to the project or show a success message
          }}
        />

        {/* Order Confirmation Dialog */}
        <OrderConfirmationDialog
          open={showOrderConfirmationDialog}
          onOpenChange={setShowOrderConfirmationDialog}
          quoteData={selectedQuoteForOrderConfirmation}
          onOrderConfirmationCreated={(orderConfirmation) => {
            console.log("Order confirmation created:", orderConfirmation);
            // Here you could navigate to the order confirmation or show a success message
          }}
        />

        {/* Quote Batch Operations Dialog */}
        <QuoteBatchOperations
          open={showBatchOperations}
          onOpenChange={setShowBatchOperations}
          selectedQuoteIds={selectedQuoteIds}
          quotes={filteredQuotes.map((quote) => ({
            id: quote.id,
            customer: quote.customer,
            project: quote.project,
            amount: quote.amount,
            status: quote.status,
          }))}
          onOperationComplete={handleBatchOperationComplete}
        />

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

export default Quotes;
