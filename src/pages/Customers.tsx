﻿import AdvancedFilterDialog from "@/components/AdvancedFilterDialog";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CustomersPageSkeleton } from "@/components/skeletons/CustomersSkeletons";
import { usePageLoading } from "@/hooks/usePageLoading";
import {
  EmptyCustomers,
  EmptySearchResults,
} from "@/components/empty-states/PageEmptyStates";
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
import {
  MultiWindowDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DialogFrame } from "@/components/ui/dialog-frame";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { LayoutWithSidebar } from "@/components/LayoutWithSidebar";
import {
  Users,
  Plus,
  Mail,
  Phone,
  Edit,
  Trash2,
  Building,
  Calculator,
  Euro,
  Calendar,
  User,
  MapPin,
  Search,
  Filter,
  FileText,
  MessageSquare,
  Star,
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  Receipt,
  Activity,
  TrendingUp,
  BarChart3,
  PieChart,
  Eye,
  Download,
  Settings,
  Target,
  Zap,
  History,
  Bookmark,
  Award,
  Handshake,
  Briefcase,
} from "lucide-react";

const Customers = () => {
  const { loading } = usePageLoading({ delay: 600 });
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterDialog, setShowFilterDialog] = useState(false);

  if (loading) return <CustomersPageSkeleton />;

  // Mock-Daten für Kunden
  const customers = [
    {
      id: "CUST-001",
      name: "Familie Müller",
      type: "private",
      status: "active",
      totalProjects: 3,
      totalRevenue: 1250000,
      lastContact: "2024-02-15",
      contact: "Hans Müller",
      phone: "+49 89 123456",
      email: "hans.mueller@email.com",
      address: "Musterstraße 12, 80331 München",
      notes: "Sehr zufriedener Kunde, plant weitere Projekte",
      projects: [
        {
          id: "PRJ-2024-001",
          name: "Wohnhaus München",
          status: "active",
          revenue: 450000,
        },
        {
          id: "PRJ-2023-002",
          name: "Gartenhaus",
          status: "completed",
          revenue: 75000,
        },
        {
          id: "PRJ-2022-001",
          name: "Carport",
          status: "completed",
          revenue: 25000,
        },
      ],
      quotes: [
        {
          id: "ANG-2024-001",
          amount: 450000,
          status: "sent",
          date: "2024-02-10",
        },
        {
          id: "ANG-2023-003",
          amount: 75000,
          status: "accepted",
          date: "2023-05-15",
        },
      ],
      invoices: [
        {
          id: "AR-2024-001",
          amount: 125000,
          status: "sent",
          dueDate: "2024-03-01",
        },
        {
          id: "AR-2023-002",
          amount: 75000,
          status: "paid",
          paidDate: "2023-06-15",
        },
      ],
      communication: [
        {
          date: "2024-02-15",
          type: "call",
          subject: "Projektbesprechung",
          notes: "Kunde sehr zufrieden mit Fortschritt",
        },
        {
          date: "2024-02-10",
          type: "email",
          subject: "Angebot versendet",
          notes: "Angebot für Dachausbau gesendet",
        },
        {
          date: "2024-01-20",
          type: "meeting",
          subject: "Baustellenbesichtigung",
          notes: "Gemeinsame Begehung der Baustelle",
        },
      ],
    },
    {
      id: "CUST-002",
      name: "TechCorp GmbH",
      type: "business",
      status: "active",
      totalProjects: 2,
      totalRevenue: 1800000,
      lastContact: "2024-02-10",
      contact: "Dr. Schmidt",
      phone: "+49 30 987654",
      email: "schmidt@techcorp.de",
      address: "Alexanderplatz 5, 10178 Berlin",
      notes: "Wichtiger Geschäftskunde, regelmäßige Projekte",
      projects: [
        {
          id: "PRJ-2024-002",
          name: "Bürogebäude Berlin",
          status: "active",
          revenue: 1200000,
        },
        {
          id: "PRJ-2023-003",
          name: "Serverraum",
          status: "completed",
          revenue: 600000,
        },
      ],
      quotes: [
        {
          id: "ANG-2024-002",
          amount: 1200000,
          status: "accepted",
          date: "2024-01-25",
        },
        {
          id: "ANG-2023-004",
          amount: 600000,
          status: "accepted",
          date: "2023-08-10",
        },
      ],
      invoices: [
        {
          id: "AR-2024-002",
          amount: 300000,
          status: "paid",
          paidDate: "2024-02-10",
        },
        {
          id: "AR-2023-003",
          amount: 600000,
          status: "paid",
          paidDate: "2023-09-15",
        },
      ],
      communication: [
        {
          date: "2024-02-10",
          type: "email",
          subject: "Zahlungseingang",
          notes: "Rechnung AR-2024-002 bezahlt",
        },
        {
          date: "2024-01-25",
          type: "meeting",
          subject: "Projektstart",
          notes: "Kick-off Meeting für Bürogebäude",
        },
        {
          date: "2024-01-15",
          type: "call",
          subject: "Vertragsverhandlung",
          notes: "Details zum neuen Projekt besprochen",
        },
      ],
    },
    {
      id: "CUST-003",
      name: "Hausverwaltung Nord",
      type: "business",
      status: "active",
      totalProjects: 1,
      totalRevenue: 180000,
      lastContact: "2024-01-31",
      contact: "Frau Weber",
      phone: "+49 40 555123",
      email: "weber@hausverwaltung-nord.de",
      address: "Hafenstraße 88, 20359 Hamburg",
      notes:
        "Hausverwaltung mit mehreren Objekten, potenziell weitere Aufträge",
      projects: [
        {
          id: "PRJ-2024-003",
          name: "Dachsanierung Hamburg",
          status: "completed",
          revenue: 180000,
        },
      ],
      quotes: [
        {
          id: "ANG-2024-003",
          amount: 75000,
          status: "pending",
          date: "2024-02-12",
        },
        {
          id: "ANG-2023-005",
          amount: 180000,
          status: "accepted",
          date: "2023-10-20",
        },
      ],
      invoices: [
        {
          id: "AR-2024-003",
          amount: 75000,
          status: "overdue",
          dueDate: "2024-02-20",
        },
        {
          id: "AR-2023-004",
          amount: 180000,
          status: "paid",
          paidDate: "2023-12-15",
        },
      ],
      communication: [
        {
          date: "2024-01-31",
          type: "call",
          subject: "Mahnung",
          notes: "Erinnerung an überfällige Rechnung",
        },
        {
          date: "2024-01-15",
          type: "meeting",
          subject: "Projektabnahme",
          notes: "Dachsanierung erfolgreich abgenommen",
        },
        {
          date: "2023-12-15",
          type: "email",
          subject: "Zahlungseingang",
          notes: "Abschlussrechnung bezahlt",
        },
      ],
    },
    {
      id: "CUST-004",
      name: "Familie Schmidt",
      type: "private",
      status: "prospect",
      totalProjects: 0,
      totalRevenue: 0,
      lastContact: "2024-02-20",
      contact: "Familie Schmidt",
      phone: "+49 351 123789",
      email: "schmidt@email.com",
      address: "Elbstraße 45, 01067 Dresden",
      notes: "Interessent für Einfamilienhaus, noch in Planungsphase",
      projects: [],
      quotes: [
        {
          id: "ANG-2024-004",
          amount: 320000,
          status: "sent",
          date: "2024-02-15",
        },
      ],
      invoices: [],
      communication: [
        {
          date: "2024-02-20",
          type: "meeting",
          subject: "Angebotsbesprechung",
          notes: "Kunde interessiert, möchte Zeit zum Nachdenken",
        },
        {
          date: "2024-02-15",
          type: "email",
          subject: "Angebot versendet",
          notes: "Detailliertes Angebot für Einfamilienhaus gesendet",
        },
        {
          date: "2024-02-01",
          type: "call",
          subject: "Erstkontakt",
          notes: "Kunde sucht Bauunternehmen für Eigenheim",
        },
      ],
    },
  ];

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "prospect":
        return "outline";
      case "inactive":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Aktiv";
      case "prospect":
        return "Interessent";
      case "inactive":
        return "Inaktiv";
      default:
        return "Unbekannt";
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case "private":
        return "Privat";
      case "business":
        return "Geschäft";
      default:
        return "Unbekannt";
    }
  };

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.status === "active").length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalRevenue, 0);
  const avgRevenue = Math.round(totalRevenue / totalCustomers);

  return (
    <LayoutWithSidebar
      breadcrumbItems={[
        { label: "Home", href: "/dashboard" },
        { label: "Kunden" },
      ]}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <p className="text-sm text-muted-foreground">
            Kundenstammdaten & Projektverknüpfungen (Phase 5)
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Gesamt Kunden
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCustomers}</div>
              <p className="text-xs text-muted-foreground">
                {activeCustomers} aktiv
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Gesamtumsatz
              </CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                €{totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                €{avgRevenue.toLocaleString()} Durchschnitt
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Aktive Projekte
              </CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {customers.reduce(
                  (sum, c) =>
                    sum +
                    c.projects.filter((p) => p.status === "active").length,
                  0
                )}
              </div>
              <p className="text-xs text-muted-foreground">Laufende Projekte</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Offene Angebote
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {customers.reduce(
                  (sum, c) =>
                    sum +
                    c.quotes.filter(
                      (q) => q.status === "sent" || q.status === "pending"
                    ).length,
                  0
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Warten auf Antwort
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
          <TabsList className="grid w-full grid-cols-6 h-14 p-2 bg-muted/50 rounded-lg">
            <TabsTrigger
              value="overview"
              className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              Übersicht
            </TabsTrigger>
            <TabsTrigger
              value="customers"
              className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              Kunden
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              Timeline
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              Analytics
            </TabsTrigger>
            <TabsTrigger
              value="communication"
              className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              Kommunikation
            </TabsTrigger>
            <TabsTrigger
              value="create"
              className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              Neuer Kunde
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Search and Filter */}
            <Card>
              <CardHeader>
                <CardDescription>
                  Übersicht aller Kunden und Interessenten
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Kunden durchsuchen..."
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

                {/* Top Customers */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Top Kunden</h3>
                  {filteredCustomers.length === 0 ? (
                    <EmptySearchResults />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {customers
                        .sort((a, b) => b.totalRevenue - a.totalRevenue)
                        .slice(0, 4)
                        .map((customer) => (
                          <Card
                            key={customer.id}
                            className="hover:shadow-lg transition-shadow"
                          >
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                  <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                      customer.type === "business"
                                        ? "bg-blue-100 dark:bg-blue-900"
                                        : "bg-green-100 dark:bg-green-900"
                                    }`}
                                  >
                                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold">
                                      {customer.name}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                      {customer.contact}
                                    </p>
                                  </div>
                                </div>
                                <Badge
                                  variant={getStatusColor(customer.status)}
                                >
                                  {getStatusText(customer.status)}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">
                                    Umsatz
                                  </p>
                                  <p className="font-semibold">
                                    €{customer.totalRevenue.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Projekte
                                  </p>
                                  <p className="font-semibold">
                                    {customer.totalProjects}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  )}
                </div>

                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Letzte Kundenaktivitäten
                  </h3>
                  <div className="space-y-3">
                    {customers
                      .sort(
                        (a, b) =>
                          new Date(b.lastContact).getTime() -
                          new Date(a.lastContact).getTime()
                      )
                      .slice(0, 5)
                      .map((customer) => (
                        <div
                          key={customer.id}
                          className="flex items-center space-x-4 p-4 border rounded-lg"
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              customer.type === "business"
                                ? "bg-blue-100 dark:bg-blue-900"
                                : "bg-green-100 dark:bg-green-900"
                            }`}
                          >
                            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Letzter Kontakt: {customer.lastContact} •{" "}
                              {customer.communication[0]?.subject}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">
                              €{customer.totalRevenue.toLocaleString()}
                            </p>
                            <Badge variant={getStatusColor(customer.status)}>
                              {getStatusText(customer.status)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Alle Kunden</CardTitle>
                <CardDescription>
                  Detaillierte Kundenübersicht mit Projekten und Kommunikation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {filteredCustomers.map((customer) => (
                    <Card
                      key={customer.id}
                      className="hover:shadow-lg transition-shadow"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-start space-x-4">
                            <div
                              className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                                customer.type === "business"
                                  ? "bg-blue-100 dark:bg-blue-900"
                                  : "bg-green-100 dark:bg-green-900"
                              }`}
                            >
                              <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-xl font-semibold">
                                  {customer.name}
                                </h3>
                                <Badge
                                  variant={getStatusColor(customer.status)}
                                >
                                  {getStatusText(customer.status)}
                                </Badge>
                                <Badge variant="outline">
                                  {getTypeText(customer.type)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {customer.id} • {customer.contact}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                                {customer.notes}
                              </p>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div className="flex items-center space-x-2">
                                  <Phone className="h-4 w-4 text-gray-400" />
                                  <span>{customer.phone}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Mail className="h-4 w-4 text-gray-400" />
                                  <span>{customer.email}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <MapPin className="h-4 w-4 text-gray-400" />
                                  <span>{customer.address}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Calendar className="h-4 w-4 text-gray-400" />
                                  <span>
                                    Letzter Kontakt: {customer.lastContact}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-2xl font-bold mb-1">
                              €{customer.totalRevenue.toLocaleString()}
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              Gesamtumsatz
                            </p>
                            <div className="space-y-1 text-sm">
                              <div>{customer.totalProjects} Projekte</div>
                              <div>{customer.quotes.length} Angebote</div>
                              <div>{customer.invoices.length} Rechnungen</div>
                            </div>
                          </div>
                        </div>

                        {/* Projects */}
                        {customer.projects.length > 0 && (
                          <div className="mb-6">
                            <h4 className="font-medium mb-3">Projekte</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {customer.projects.map((project) => (
                                <div
                                  key={project.id}
                                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                >
                                  <div>
                                    <p className="font-medium">
                                      {project.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {project.id}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold">
                                      €{project.revenue.toLocaleString()}
                                    </p>
                                    <Badge
                                      variant={
                                        project.status === "active"
                                          ? "default"
                                          : "secondary"
                                      }
                                    >
                                      {project.status === "active"
                                        ? "Aktiv"
                                        : "Fertig"}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recent Communication */}
                        <div className="mb-6">
                          <h4 className="font-medium mb-3">
                            Letzte Kommunikation
                          </h4>
                          <div className="space-y-2">
                            {customer.communication
                              .slice(0, 3)
                              .map((comm, index) => (
                                <div
                                  key={index}
                                  className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                >
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                      comm.type === "call"
                                        ? "bg-blue-100 dark:bg-blue-900"
                                        : comm.type === "email"
                                        ? "bg-green-100 dark:bg-green-900"
                                        : "bg-purple-100 dark:bg-purple-900"
                                    }`}
                                  >
                                    {comm.type === "call" ? (
                                      <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    ) : comm.type === "email" ? (
                                      <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    ) : (
                                      <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">
                                      {comm.subject}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {comm.notes}
                                    </p>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {comm.date}
                                  </p>
                                </div>
                              ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="text-sm text-muted-foreground">
                            Kunde seit: {customer.lastContact}
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Mail className="h-4 w-4 mr-2" />
                              E-Mail
                            </Button>
                            <Button variant="outline" size="sm">
                              <Phone className="h-4 w-4 mr-2" />
                              Anrufen
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-2" />
                              Bearbeiten
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <History className="h-5 w-5 text-blue-600" />
                  <span>Kunden-Timeline</span>
                </CardTitle>
                <CardDescription>
                  Chronologische Übersicht aller Kundeninteraktionen und
                  Projekte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {customers.map((customer) => (
                    <div key={customer.id} className="border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Users className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">
                              {customer.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {customer.contact}
                            </p>
                          </div>
                        </div>
                        <Badge variant={getStatusColor(customer.status)}>
                          {getStatusText(customer.status)}
                        </Badge>
                      </div>

                      {/* Timeline */}
                      <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

                        {customer.communication
                          .slice(0, 5)
                          .map((comm, index) => (
                            <div
                              key={index}
                              className="relative flex items-start space-x-4 pb-6"
                            >
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                                  comm.type === "call"
                                    ? "bg-blue-100 dark:bg-blue-900"
                                    : comm.type === "email"
                                    ? "bg-green-100 dark:bg-green-900"
                                    : "bg-purple-100 dark:bg-purple-900"
                                }`}
                              >
                                {comm.type === "call" ? (
                                  <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                ) : comm.type === "email" ? (
                                  <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
                                ) : (
                                  <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-medium">
                                    {comm.subject}
                                  </h4>
                                  <span className="text-xs text-muted-foreground">
                                    {comm.date}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {comm.notes}
                                </p>
                                <Badge variant="outline" className="mt-1">
                                  {comm.type === "call"
                                    ? "Anruf"
                                    : comm.type === "email"
                                    ? "E-Mail"
                                    : "Meeting"}
                                </Badge>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  <span>Customer Analytics</span>
                </CardTitle>
                <CardDescription>
                  Detaillierte Analyse der Kundenperformance und -verteilung
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      €
                      {Math.round(
                        totalRevenue / activeCustomers
                      ).toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Durchschn. Umsatz/Kunde
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(
                        (customers.reduce(
                          (sum, c) => sum + c.projects.length,
                          0
                        ) /
                          customers.length) *
                          10
                      ) / 10}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Durchschn. Projekte/Kunde
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(
                        (customers.filter((c) =>
                          c.quotes.some((q) => q.status === "accepted")
                        ).length /
                          customers.length) *
                          100
                      )}
                      %
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Conversion Rate
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {Math.round(
                        customers.reduce(
                          (sum, c) => sum + c.communication.length,
                          0
                        ) / customers.length
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Kontakte/Kunde
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Top Kunden nach Umsatz</h4>
                  {customers
                    .sort((a, b) => b.totalRevenue - a.totalRevenue)
                    .slice(0, 5)
                    .map((customer, index) => {
                      const maxRevenue = customers[0]?.totalRevenue || 1;
                      const percentage =
                        (customer.totalRevenue / maxRevenue) * 100;
                      return (
                        <div key={customer.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">
                                #{index + 1}
                              </span>
                              <span className="text-sm">{customer.name}</span>
                            </div>
                            <span className="text-sm font-semibold">
                              €{customer.totalRevenue.toLocaleString()}
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{customer.totalProjects} Projekte</span>
                            <span>{customer.quotes.length} Angebote</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="communication" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  <span>Kommunikationsverlauf</span>
                </CardTitle>
                <CardDescription>
                  Chronologische Übersicht aller Kundeninteraktionen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customers
                    .flatMap((customer) =>
                      customer.communication.map((comm) => ({
                        ...comm,
                        customerName: customer.name,
                        customerId: customer.id,
                      }))
                    )
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    )
                    .slice(0, 15)
                    .map((comm, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            comm.type === "call"
                              ? "bg-blue-100 dark:bg-blue-900"
                              : comm.type === "email"
                              ? "bg-green-100 dark:bg-green-900"
                              : "bg-purple-100 dark:bg-purple-900"
                          }`}
                        >
                          {comm.type === "call" ? (
                            <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          ) : comm.type === "email" ? (
                            <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{comm.subject}</h4>
                            <span className="text-xs text-muted-foreground">
                              {comm.date}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {comm.notes}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{comm.customerName}</Badge>
                            <Badge
                              variant={
                                comm.type === "call"
                                  ? "default"
                                  : comm.type === "email"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {comm.type === "call"
                                ? "Anruf"
                                : comm.type === "email"
                                ? "E-Mail"
                                : "Meeting"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                <div className="mt-6">
                  <MultiWindowDialog>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Neue Kommunikation erfassen
                      </Button>
                    </DialogTrigger>
                    <DialogFrame
                      title="Neue Kommunikation erfassen"
                      width="max-w-xl"
                      modal={false}
                      footer={
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline">Abbrechen</Button>
                          <Button>Speichern</Button>
                        </div>
                      }
                    >
                      <DialogDescription className="pb-4">
                        Dokumentieren Sie eine Kundeninteraktion
                      </DialogDescription>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="commCustomer">Kunde</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Kunde auswählen" />
                            </SelectTrigger>
                            <SelectContent>
                              {customers.map((customer) => (
                                <SelectItem
                                  key={customer.id}
                                  value={customer.id}
                                >
                                  {customer.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="commType">
                            Art der Kommunikation
                          </Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Typ auswählen" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="call">Telefonat</SelectItem>
                              <SelectItem value="email">E-Mail</SelectItem>
                              <SelectItem value="meeting">Meeting</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="commSubject">Betreff</Label>
                          <Input
                            id="commSubject"
                            placeholder="Kurze Beschreibung"
                          />
                        </div>
                        <div>
                          <Label htmlFor="commNotes">Notizen</Label>
                          <Textarea
                            id="commNotes"
                            placeholder="Detaillierte Notizen..."
                            rows={4}
                          />
                        </div>
                      </div>
                    </DialogFrame>
                  </MultiWindowDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Neuen Kunden anlegen</CardTitle>
                <CardDescription>
                  Erstellen Sie einen neuen Kunden mit vollständigen Stammdaten
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Grunddaten</h4>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="customerName">Kundenname</Label>
                        <Input
                          id="customerName"
                          placeholder="Firmenname oder Name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="customerType">Kundentyp</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Kundentyp auswählen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="private">Privat</SelectItem>
                            <SelectItem value="business">Geschäft</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="contactPerson">Ansprechpartner</Label>
                        <Input
                          id="contactPerson"
                          placeholder="Name des Ansprechpartners"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Telefon</Label>
                        <Input id="phone" placeholder="+49 xxx xxxxx" />
                      </div>
                      <div>
                        <Label htmlFor="email">E-Mail</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="kunde@example.com"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Adresse & Details</h4>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="address">Adresse</Label>
                        <Textarea
                          id="address"
                          placeholder="Vollständige Adresse"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Status auswählen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Aktiv</SelectItem>
                            <SelectItem value="prospect">
                              Interessent
                            </SelectItem>
                            <SelectItem value="inactive">Inaktiv</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="source">Kundenquelle</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Wie haben Sie uns gefunden?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="website">Website</SelectItem>
                            <SelectItem value="referral">Empfehlung</SelectItem>
                            <SelectItem value="advertising">Werbung</SelectItem>
                            <SelectItem value="trade-fair">Messe</SelectItem>
                            <SelectItem value="other">Sonstiges</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="notes">Notizen</Label>
                        <Textarea
                          id="notes"
                          placeholder="Zusätzliche Notizen zum Kunden..."
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button variant="outline">Entwurf speichern</Button>
                  <Button>Kunde anlegen</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      {/* Temporarily disabled due to malformed attribute */}
      {/*
    <AdvancedFilterDialog 
      isOpen={showFilterDialog} 
      onClose={() => setShowFilterDialog(false)} 
      onSave={() => { setShowFilterDialog(false); }} 
      title=\"Erweiterten Filter konfigurieren\" 
    />
    */}
    </LayoutWithSidebar>
  );
};

export default Customers;
