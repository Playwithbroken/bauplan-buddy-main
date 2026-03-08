import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MultiWindowDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DialogFrame } from "@/components/ui/dialog-frame";
import { LayoutWithSidebar } from "@/components/LayoutWithSidebar";
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Star,
  Euro,
  Package,
  Truck,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  NotificationService,
  Notification,
} from "@/services/notificationService";

interface Supplier {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  category:
    | "materials"
    | "services"
    | "equipment"
    | "subcontractor"
    | "utilities"
    | "other";
  status: "active" | "inactive" | "pending" | "blocked";
  rating: 1 | 2 | 3 | 4 | 5;
  paymentTerms: string;
  totalOrders: number;
  totalAmount: number;
  createdAt: string;
}

interface SupplyChainEvent {
  id: string;
  supplierId: string;
  supplierName: string;
  description: string;
  reference: string;
  eta: string;
  status: "planned" | "in-transit" | "delayed" | "delivered";
  risk: "low" | "medium" | "high";
  lastUpdate: string;
}
const Suppliers = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showSupplierDialog, setShowSupplierDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Mock data for suppliers
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    {
      id: "SUP-001",
      companyName: "Baustoff Weber GmbH",
      contactPerson: "Hans Weber",
      email: "hans.weber@baustoff-weber.de",
      phone: "+49 89 123456",
      address: "Industriestraße 15",
      city: "München",
      category: "materials",
      status: "active",
      rating: 5,
      paymentTerms: "30 Tage netto",
      totalOrders: 45,
      totalAmount: 125000,
      createdAt: "2024-01-15",
    },
    {
      id: "SUP-002",
      companyName: "Elektro Schmidt & Co.",
      contactPerson: "Maria Schmidt",
      email: "maria@elektro-schmidt.com",
      phone: "+49 30 987654",
      address: "Alexanderplatz 8",
      city: "Berlin",
      category: "services",
      status: "active",
      rating: 4,
      paymentTerms: "14 Tage netto",
      totalOrders: 23,
      totalAmount: 78000,
      createdAt: "2024-01-20",
    },
    {
      id: "SUP-003",
      companyName: "Dachdeckerei Nord",
      contactPerson: "Peter Hansen",
      email: "info@dachdeckerei-nord.de",
      phone: "+49 40 555123",
      address: "Hafenstraße 42",
      city: "Hamburg",
      category: "subcontractor",
      status: "active",
      rating: 5,
      paymentTerms: "Sofort nach Abnahme",
      totalOrders: 12,
      totalAmount: 65000,
      createdAt: "2024-02-01",
    },
  ]);

  const [formData, setFormData] = useState<Partial<Supplier>>({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    category: "materials",
    status: "active",
    rating: 3,
    paymentTerms: "30 Tage netto",
  });

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || supplier.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const supplyChainEvents: SupplyChainEvent[] = [
    {
      id: "SC-001",
      supplierId: "SUP-001",
      supplierName: "Baustoff Weber GmbH",
      description: "Betonstahl Lieferung fuer Rohbau Abschnitt A",
      reference: "PO-2024-341",
      eta: "2024-09-30T08:00:00Z",
      status: "in-transit",
      risk: "medium",
      lastUpdate: "2024-09-26T12:30:00Z",
    },
    {
      id: "SC-002",
      supplierId: "SUP-002",
      supplierName: "Elektro Schmidt & Co.",
      description: "Elektroverteiler und Kabelsaetze fuer Ausbau",
      reference: "PO-2024-356",
      eta: "2024-09-28T06:30:00Z",
      status: "delayed",
      risk: "high",
      lastUpdate: "2024-09-27T17:45:00Z",
    },
    {
      id: "SC-003",
      supplierId: "SUP-003",
      supplierName: "Dachdeckerei Nord",
      description: "Abdichtungselemente fuer Dachphase 2",
      reference: "PO-2024-362",
      eta: "2024-10-02T09:15:00Z",
      status: "planned",
      risk: "low",
      lastUpdate: "2024-09-25T09:00:00Z",
    },
  ];

  const supplyChainSummary = {
    planned: supplyChainEvents.filter((event) => event.status === "planned")
      .length,
    inTransit: supplyChainEvents.filter(
      (event) => event.status === "in-transit"
    ).length,
    delayed: supplyChainEvents.filter((event) => event.status === "delayed")
      .length,
    delivered: supplyChainEvents.filter((event) => event.status === "delivered")
      .length,
  };

  const upcomingDeliveries = [...supplyChainEvents]
    .filter((event) => event.status !== "delivered")
    .sort((a, b) => new Date(a.eta).getTime() - new Date(b.eta).getTime());

  const highRiskEvents = supplyChainEvents.filter(
    (event) => event.status === "delayed" || event.risk === "high"
  );

  const getStatusBadgeClasses = (status: SupplyChainEvent["status"]) => {
    switch (status) {
      case "delayed":
        return "bg-red-100 text-red-800 border border-red-300";
      case "in-transit":
        return "bg-blue-100 text-blue-800 border border-blue-300";
      case "planned":
        return "bg-slate-100 text-slate-800 border border-slate-300";
      case "delivered":
        return "bg-emerald-100 text-emerald-800 border border-emerald-300";
      default:
        return "bg-slate-200 text-slate-800";
    }
  };

  const getRiskBadgeClasses = (risk: SupplyChainEvent["risk"]) => {
    switch (risk) {
      case "high":
        return "bg-red-100 text-red-800 border border-red-300";
      case "medium":
        return "bg-amber-100 text-amber-800 border border-amber-300";
      default:
        return "bg-emerald-100 text-emerald-800 border border-emerald-300";
    }
  };

  const formatDateLabel = (iso: string) =>
    new Date(iso).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleNotifyLogistics = (event: SupplyChainEvent) => {
    const priority =
      event.status === "delayed" || event.risk === "high" ? "high" : "medium";
    const type = event.status === "delayed" ? "overdue" : "system";

    const notification: Notification = {
      id: `supply-${event.id}-${Date.now()}`,
      appointmentId: event.id,
      type,
      title: `Lieferkette: ${
        event.status === "delayed" ? "Verzoegerung" : "Update"
      }`,
      message: `${event.supplierName}: ${event.description} (${event.reference}) - Status ${event.status}.`,
      timestamp: new Date().toISOString(),
      read: false,
      reminderTime: 0,
      priority,
    };

    NotificationService.saveNotification(notification);
    toast({
      title: "Feldteams informiert",
      description: `${event.reference} wurde an die Einsatzplanung gemeldet.`,
    });
  };

  const handleSaveSupplier = () => {
    if (!formData.companyName || !formData.contactPerson || !formData.email) {
      toast({
        title: "Unvollständige Angaben",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive",
      });
      return;
    }

    const supplierData: Supplier = {
      id:
        editingSupplier?.id ||
        `SUP-${String(suppliers.length + 1).padStart(3, "0")}`,
      companyName: formData.companyName!,
      contactPerson: formData.contactPerson!,
      email: formData.email!,
      phone: formData.phone || "",
      address: formData.address || "",
      city: formData.city || "",
      category: formData.category || "materials",
      status: formData.status || "active",
      rating: formData.rating || 3,
      paymentTerms: formData.paymentTerms || "30 Tage netto",
      totalOrders: editingSupplier?.totalOrders || 0,
      totalAmount: editingSupplier?.totalAmount || 0,
      createdAt:
        editingSupplier?.createdAt || new Date().toISOString().split("T")[0],
    };

    if (editingSupplier) {
      setSuppliers((prev) =>
        prev.map((s) => (s.id === editingSupplier.id ? supplierData : s))
      );
      toast({
        title: "Lieferant aktualisiert",
        description: `${supplierData.companyName} wurde erfolgreich aktualisiert.`,
      });
    } else {
      setSuppliers((prev) => [...prev, supplierData]);
      toast({
        title: "Lieferant hinzugefügt",
        description: `${supplierData.companyName} wurde erfolgreich hinzugefügt.`,
      });
    }

    setShowSupplierDialog(false);
    setEditingSupplier(null);
    setFormData({
      companyName: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      category: "materials",
      status: "active",
      rating: 3,
      paymentTerms: "30 Tage netto",
    });
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setFormData(supplier);
    setEditingSupplier(supplier);
    setShowSupplierDialog(true);
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      materials: "Materialien",
      services: "Dienstleistungen",
      equipment: "Geräte/Maschinen",
      subcontractor: "Subunternehmer",
      utilities: "Nebenkosten",
      other: "Sonstiges",
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "inactive":
        return "secondary";
      case "pending":
        return "outline";
      case "blocked":
        return "destructive";
      default:
        return "outline";
    }
  };

  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <LayoutWithSidebar
      breadcrumbItems={[
        { label: "Home", href: "/dashboard" },
        { label: "Lieferanten" },
      ]}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-gray-600 dark:text-gray-300">
                  Lieferanten und Dienstleister verwalten
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                setFormData({
                  companyName: "",
                  contactPerson: "",
                  email: "",
                  phone: "",
                  address: "",
                  city: "",
                  category: "materials",
                  status: "active",
                  rating: 3,
                  paymentTerms: "30 Tage netto",
                });
                setEditingSupplier(null);
                setShowSupplierDialog(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Neuer Lieferant
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Gesamt Lieferanten
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{suppliers.length}</div>
              <p className="text-xs text-muted-foreground">
                {suppliers.filter((s) => s.status === "active").length} aktiv
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
                €
                {suppliers
                  .reduce((sum, s) => sum + s.totalAmount, 0)
                  .toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {suppliers.reduce((sum, s) => sum + s.totalOrders, 0)}{" "}
                Bestellungen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Durchschnittsbewertung
              </CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(
                  suppliers.reduce((sum, s) => sum + s.rating, 0) /
                  suppliers.length
                ).toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">von 5 Sternen</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Top Kategorie
              </CardTitle>
              <Package className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Materialien</div>
              <p className="text-xs text-muted-foreground">
                Meiste Lieferanten
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Supply Chain Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Lieferketten-Monitor</CardTitle>
            <CardDescription>
              Aktuelle Transporte und Risiken im Blick
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg border border-muted bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Geplant</p>
                <p className="text-xl font-semibold">
                  {supplyChainSummary.planned}
                </p>
              </div>
              <div className="rounded-lg border border-muted bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Unterwegs</p>
                <p className="text-xl font-semibold">
                  {supplyChainSummary.inTransit}
                </p>
              </div>
              <div className="rounded-lg border border-muted bg-muted/30 p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Verzoegerung</span>
                  {highRiskEvents.length > 0 && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <p className="text-xl font-semibold text-red-600">
                  {supplyChainSummary.delayed}
                </p>
              </div>
              <div className="rounded-lg border border-muted bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Abgeschlossen</p>
                <p className="text-xl font-semibold">
                  {supplyChainSummary.delivered}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              {upcomingDeliveries.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border rounded-lg p-4"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={getStatusBadgeClasses(event.status)}>
                        {event.status === "in-transit" && "Unterwegs"}
                        {event.status === "planned" && "Geplant"}
                        {event.status === "delayed" && "Verzoegert"}
                        {event.status === "delivered" && "Abgeschlossen"}
                      </Badge>
                      <Badge className={getRiskBadgeClasses(event.risk)}>
                        Risiko {event.risk}
                      </Badge>
                      <Badge variant="outline">{event.reference}</Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">
                        {event.description}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {event.supplierName}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />{" "}
                        {formatDateLabel(event.eta)} ETA
                      </span>
                      <span className="flex items-center gap-1">
                        <Truck className="h-4 w-4" /> Letztes Update{" "}
                        {formatDateLabel(event.lastUpdate)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start md:self-auto">
                    {event.status === "delayed" && (
                      <Badge variant="destructive">
                        Eskalation erforderlich
                      </Badge>
                    )}
                    <Button
                      variant={
                        event.status === "delayed" ? "destructive" : "outline"
                      }
                      onClick={() => handleNotifyLogistics(event)}
                    >
                      Feldteams informieren
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardDescription>
              Alle Lieferanten und Dienstleister im Überblick
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Lieferanten durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Kategorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Kategorien</SelectItem>
                  <SelectItem value="materials">Materialien</SelectItem>
                  <SelectItem value="services">Dienstleistungen</SelectItem>
                  <SelectItem value="equipment">Geräte/Maschinen</SelectItem>
                  <SelectItem value="subcontractor">Subunternehmer</SelectItem>
                  <SelectItem value="utilities">Nebenkosten</SelectItem>
                  <SelectItem value="other">Sonstiges</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Suppliers List */}
            <div className="space-y-4">
              {filteredSuppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="border rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {supplier.companyName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {supplier.id} • {supplier.contactPerson}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge variant="outline">
                            {getCategoryLabel(supplier.category)}
                          </Badge>
                          <Badge variant={getStatusColor(supplier.status)}>
                            Aktiv
                          </Badge>
                          {renderRating(supplier.rating)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        €{supplier.totalAmount.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {supplier.totalOrders} Bestellungen
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{supplier.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{supplier.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{supplier.city}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Registriert: {supplier.createdAt} •{" "}
                      {supplier.paymentTerms}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditSupplier(supplier)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Bearbeiten
                      </Button>
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4 mr-2" />
                        Kontakt
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSuppliers((prev) =>
                            prev.filter((s) => s.id !== supplier.id)
                          );
                          toast({
                            title: "Lieferant gelöscht",
                            description: `${supplier.companyName} wurde erfolgreich gelöscht.`,
                          });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredSuppliers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Keine Lieferanten gefunden</p>
                  <p className="text-sm">
                    Ändern Sie Ihre Suchkriterien oder fügen Sie einen neuen
                    Lieferanten hinzu
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Supplier Dialog */}
        <MultiWindowDialog
          open={showSupplierDialog}
          onOpenChange={setShowSupplierDialog}
        >
          <DialogFrame
            title={editingSupplier ? "Lieferant bearbeiten" : "Neuer Lieferant"}
            width="max-w-3xl"
            modal={false}
            onClose={() => setShowSupplierDialog(false)}
            footer={
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowSupplierDialog(false)}
                >
                  Abbrechen
                </Button>
                <Button onClick={handleSaveSupplier}>
                  {editingSupplier ? "Aktualisieren" : "Hinzufügen"}
                </Button>
              </div>
            }
          >
            <div className="space-y-4 pt-4">
              {/* Firmenname + Ansprechpartner side-by-side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Firmenname *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        companyName: e.target.value,
                      }))
                    }
                    placeholder="Name der Firma"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Ansprechpartner *</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        contactPerson: e.target.value,
                      }))
                    }
                    placeholder="Vor- und Nachname"
                  />
                </div>
              </div>

              {/* Email + Telefon side-by-side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail Adresse *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="beispiel@firma.de"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefonnummer</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="+49 (0) 123 456789"
                  />
                </div>
              </div>

              {/* Adresse + Ort side-by-side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Straße / Hausnummer</Label>
                  <Input
                    id="address"
                    value={formData.address || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    placeholder="Musterstraße 1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Postleitzahl / Ort</Label>
                  <Input
                    id="city"
                    value={formData.city || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, city: e.target.value }))
                    }
                    placeholder="12345 Stadt"
                  />
                </div>
              </div>

              {/* Kategorie + Status side-by-side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Kategorie</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(val: any) =>
                      setFormData((prev) => ({ ...prev, category: val }))
                    }
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Kategorie wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="materials">Materialien</SelectItem>
                      <SelectItem value="services">Dienstleistungen</SelectItem>
                      <SelectItem value="equipment">
                        Geräte/Maschinen
                      </SelectItem>
                      <SelectItem value="subcontractor">
                        Subunternehmer
                      </SelectItem>
                      <SelectItem value="utilities">Nebenkosten</SelectItem>
                      <SelectItem value="other">Sonstiges</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val: any) =>
                      setFormData((prev) => ({ ...prev, status: val }))
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Status wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktiv</SelectItem>
                      <SelectItem value="inactive">Inaktiv</SelectItem>
                      <SelectItem value="pending">Ausstehend</SelectItem>
                      <SelectItem value="blocked">Gesperrt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Zahlungsbedingungen</Label>
                <Input
                  id="paymentTerms"
                  value={formData.paymentTerms || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      paymentTerms: e.target.value,
                    }))
                  }
                  placeholder="Z.B. 30 Tage netto"
                />
              </div>

              <div className="space-y-2">
                <Label>Bewertung</Label>
                <div className="flex items-center space-x-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-6 w-6 cursor-pointer transition-colors ${
                        star <= (formData.rating || 0)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300 hover:text-yellow-200"
                      }`}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          rating: star as any,
                        }))
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          </DialogFrame>
        </MultiWindowDialog>
      </div>
    </LayoutWithSidebar>
  );
};

export default Suppliers;
