import React, { useState, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  EquipmentProfileDialog,
  type Equipment as EquipmentType,
} from "@/components/resources/EquipmentProfileDialog";
import { MaintenanceScheduleDialog } from "@/components/resources/MaintenanceScheduleDialog";
import { ResourceAnalytics } from "@/components/resources/ResourceAnalytics";
import {
  ResourceDashboardSkeleton,
  ResourceEquipmentListSkeleton,
  ResourceAnalyticsSkeleton,
  ResourceStatsCardSkeleton,
  ResourceAvailabilityCalendarSkeleton,
} from "@/components/resources/ResourceSkeletons";
import {
  Plus,
  Edit,
  Search,
  Calendar,
  MapPin,
  Target,
  Wrench,
  Truck,
  HardHat,
  Hammer,
  Construction,
  Package,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Activity,
  TrendingUp,
  DollarSign,
  Clock,
} from "lucide-react";
import { LayoutWithSidebar } from "@/components/LayoutWithSidebar";

interface Equipment {
  id: string;
  name: string;
  type: string;
  category: "vehicle" | "tool" | "machinery" | "safety";
  status: "available" | "in-use" | "maintenance" | "broken";
  location: string;
  assignedTo?: string;
  currentProject?: string;
  value: number;
  nextMaintenance: string;
  lastMaintenance?: string;
  purchaseDate: string;
  condition: "excellent" | "good" | "fair" | "poor";
  utilizationRate?: number;
}

const Resources = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  // Dialog states
  const [isEquipmentDialogOpen, setIsEquipmentDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<
    EquipmentType | undefined
  >();
  const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false);

  // Simulated loading
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Mock equipment data with enhanced fields
  const equipment = useMemo<Equipment[]>(
    () => [
      {
        id: "EQU-001",
        name: "Baukran LIEBHERR 130 EC-B",
        type: "Turmdrehkran",
        category: "machinery",
        status: "in-use",
        location: "Baustelle München",
        assignedTo: "EMP-003",
        currentProject: "PRJ-2024-001",
        value: 450000,
        nextMaintenance: "2024-07-15",
        lastMaintenance: "2024-04-15",
        purchaseDate: "2020-03-01",
        condition: "good",
        utilizationRate: 85,
      },
      {
        id: "EQU-002",
        name: "Mercedes Sprinter",
        type: "Lieferwagen",
        category: "vehicle",
        status: "available",
        location: "Firmengelände",
        value: 45000,
        nextMaintenance: "2024-08-01",
        lastMaintenance: "2024-05-01",
        purchaseDate: "2022-01-15",
        condition: "excellent",
        utilizationRate: 65,
      },
      {
        id: "EQU-003",
        name: "Hilti Bohrhammer TE 3000",
        type: "Bohrhammer",
        category: "tool",
        status: "in-use",
        location: "Baustelle Berlin",
        assignedTo: "EMP-003",
        currentProject: "PRJ-2024-002",
        value: 1200,
        nextMaintenance: "2024-04-10",
        lastMaintenance: "2024-01-10",
        purchaseDate: "2021-05-10",
        condition: "good",
        utilizationRate: 92,
      },
      {
        id: "EQU-004",
        name: "Kompressor Atlas Copco",
        type: "Druckluft-Kompressor",
        category: "machinery",
        status: "maintenance",
        location: "Werkstatt",
        value: 25000,
        nextMaintenance: "2024-05-15",
        lastMaintenance: "2024-02-15",
        purchaseDate: "2019-08-20",
        condition: "fair",
        utilizationRate: 78,
      },
      {
        id: "EQU-005",
        name: "Caterpillar Bagger 320",
        type: "Hydraulikbagger",
        category: "machinery",
        status: "available",
        location: "Depot Hamburg",
        value: 280000,
        nextMaintenance: "2024-06-20",
        lastMaintenance: "2024-03-20",
        purchaseDate: "2021-02-10",
        condition: "excellent",
        utilizationRate: 72,
      },
      {
        id: "EQU-006",
        name: "VW Transporter",
        type: "Kastenwagen",
        category: "vehicle",
        status: "in-use",
        location: "Baustelle Stuttgart",
        assignedTo: "EMP-002",
        currentProject: "PRJ-2024-003",
        value: 38000,
        nextMaintenance: "2024-07-01",
        lastMaintenance: "2024-04-01",
        purchaseDate: "2022-06-15",
        condition: "good",
        utilizationRate: 88,
      },
      {
        id: "EQU-007",
        name: "Sicherheitsausrüstung Set A",
        type: "PSA Komplett",
        category: "safety",
        status: "available",
        location: "Lager München",
        value: 2500,
        nextMaintenance: "2024-09-01",
        lastMaintenance: "2024-03-01",
        purchaseDate: "2023-01-05",
        condition: "excellent",
        utilizationRate: 45,
      },
      {
        id: "EQU-008",
        name: "Schalungsgerüst System",
        type: "Systemschalung",
        category: "tool",
        status: "in-use",
        location: "Baustelle München",
        assignedTo: "EMP-001",
        currentProject: "PRJ-2024-001",
        value: 45000,
        nextMaintenance: "2024-05-30",
        lastMaintenance: "2024-02-28",
        purchaseDate: "2020-10-12",
        condition: "good",
        utilizationRate: 95,
      },
    ],
    []
  );

  // Filtering
  const filteredEquipment = useMemo(() => {
    return equipment.filter((eq) => {
      const matchesSearch =
        eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || eq.category === categoryFilter;
      const matchesStatus =
        statusFilter === "all" || eq.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [equipment, searchTerm, categoryFilter, statusFilter]);

  // Analytics calculations
  const analytics = useMemo(() => {
    const totalValue = equipment.reduce((sum, eq) => sum + eq.value, 0);
    const availableCount = equipment.filter(
      (eq) => eq.status === "available"
    ).length;
    const inUseCount = equipment.filter((eq) => eq.status === "in-use").length;
    const maintenanceCount = equipment.filter(
      (eq) => eq.status === "maintenance"
    ).length;
    const brokenCount = equipment.filter((eq) => eq.status === "broken").length;
    const utilizationRate =
      equipment.reduce((sum, eq) => sum + (eq.utilizationRate || 0), 0) /
      equipment.length;

    return {
      totalValue,
      totalCount: equipment.length,
      availableCount,
      inUseCount,
      maintenanceCount,
      brokenCount,
      availabilityRate: (availableCount / equipment.length) * 100,
      utilizationRate: Math.round(utilizationRate),
      categoryBreakdown: {
        vehicle: equipment.filter((eq) => eq.category === "vehicle").length,
        tool: equipment.filter((eq) => eq.category === "tool").length,
        machinery: equipment.filter((eq) => eq.category === "machinery").length,
        safety: equipment.filter((eq) => eq.category === "safety").length,
      },
    };
  }, [equipment]);

  // Helper functions
  const getStatusColor = (status: string) => {
    const colors = {
      available:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      "in-use": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      maintenance:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      broken: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStatusText = (status: string) => {
    const texts = {
      available: "Verfügbar",
      "in-use": "Im Einsatz",
      maintenance: "Wartung",
      broken: "Defekt",
    };
    return texts[status as keyof typeof texts] || status;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      vehicle: <Truck className="h-6 w-6" />,
      tool: <Hammer className="h-6 w-6" />,
      machinery: <Construction className="h-6 w-6" />,
      safety: <HardHat className="h-6 w-6" />,
    };
    return (
      icons[category as keyof typeof icons] || <Package className="h-6 w-6" />
    );
  };

  const getConditionColor = (condition: string) => {
    const colors = {
      excellent: "text-green-600",
      good: "text-blue-600",
      fair: "text-yellow-600",
      poor: "text-red-600",
    };
    return colors[condition as keyof typeof colors] || "text-gray-600";
  };

  // Handlers
  const handleAddEquipment = () => {
    setSelectedEquipment(undefined);
    setIsEquipmentDialogOpen(true);
  };

  const handleEditEquipment = (equipment: Equipment) => {
    setSelectedEquipment(equipment as EquipmentType);
    setIsEquipmentDialogOpen(true);
  };

  const handleEquipmentSuccess = () => {
    // Refresh equipment list
    console.log("Equipment saved successfully");
  };

  const handleOpenMaintenanceSchedule = () => {
    setIsMaintenanceDialogOpen(true);
  };

  // Full page loading skeleton
  if (isLoading) {
    return <ResourceDashboardSkeleton />;
  }

  return (
    <LayoutWithSidebar
      breadcrumbItems={[
        { label: "Home", href: "/dashboard" },
        { label: "Ressourcen" },
      ]}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <p className="text-sm text-muted-foreground">
            Übersicht und Verwaltung aller Baugeräte, Fahrzeuge und Werkzeuge
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList>
            <TabsTrigger value="dashboard">
              <Activity className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="equipment">
              <Package className="h-4 w-4 mr-2" />
              Ausrüstung
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="maintenance">
              <Wrench className="h-4 w-4 mr-2" />
              Wartung
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Gesamtwert
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    €{(analytics.totalValue / 1000).toFixed(0)}k
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {analytics.totalCount} Geräte im Bestand
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Verfügbarkeit
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(analytics.availabilityRate)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {analytics.availableCount} verfügbar
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Auslastung
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.utilizationRate}%
                  </div>
                  <Progress
                    value={analytics.utilizationRate}
                    className="mt-2"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Wartung</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.maintenanceCount}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    In Wartung / Defekt
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Status Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Status Übersicht</CardTitle>
                  <CardDescription>
                    Aktuelle Verteilung nach Status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-medium">Verfügbar</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {analytics.availableCount}
                        </span>
                      </div>
                      <Progress
                        value={
                          (analytics.availableCount / analytics.totalCount) *
                          100
                        }
                        className="h-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Activity className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-medium">
                            Im Einsatz
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {analytics.inUseCount}
                        </span>
                      </div>
                      <Progress
                        value={
                          (analytics.inUseCount / analytics.totalCount) * 100
                        }
                        className="h-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Wrench className="h-5 w-5 text-yellow-600" />
                          <span className="text-sm font-medium">Wartung</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {analytics.maintenanceCount}
                        </span>
                      </div>
                      <Progress
                        value={
                          (analytics.maintenanceCount / analytics.totalCount) *
                          100
                        }
                        className="h-2"
                      />
                    </div>

                    {analytics.brokenCount > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <span className="text-sm font-medium">Defekt</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {analytics.brokenCount}
                          </span>
                        </div>
                        <Progress
                          value={
                            (analytics.brokenCount / analytics.totalCount) * 100
                          }
                          className="h-2"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Kategorie Übersicht</CardTitle>
                  <CardDescription>
                    Verteilung nach Gerätekategorie
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Truck className="h-5 w-5" />
                        <span className="text-sm font-medium">Fahrzeuge</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {analytics.categoryBreakdown.vehicle}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Construction className="h-5 w-5" />
                        <span className="text-sm font-medium">Maschinen</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {analytics.categoryBreakdown.machinery}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Hammer className="h-5 w-5" />
                        <span className="text-sm font-medium">Werkzeuge</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {analytics.categoryBreakdown.tool}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <HardHat className="h-5 w-5" />
                        <span className="text-sm font-medium">Sicherheit</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {analytics.categoryBreakdown.safety}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Schnellzugriff</CardTitle>
                <CardDescription>Häufig verwendete Aktionen</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleAddEquipment}>
                    <Plus className="h-4 w-4 mr-2" />
                    Neue Ausrüstung
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleOpenMaintenanceSchedule}
                  >
                    <Wrench className="h-4 w-4 mr-2" />
                    Wartungsplan
                  </Button>
                  <Button variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Einsatzplanung
                  </Button>
                  <Button variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Berichte
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Equipment Tab */}
          <TabsContent value="equipment" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="search" className="sr-only">
                      Suchen
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="search"
                        placeholder="Ausrüstung durchsuchen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="category" className="sr-only">
                      Kategorie
                    </Label>
                    <Select
                      value={categoryFilter}
                      onValueChange={setCategoryFilter}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Kategorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Kategorien</SelectItem>
                        <SelectItem value="vehicle">Fahrzeuge</SelectItem>
                        <SelectItem value="tool">Werkzeuge</SelectItem>
                        <SelectItem value="machinery">Maschinen</SelectItem>
                        <SelectItem value="safety">Sicherheit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status" className="sr-only">
                      Status
                    </Label>
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Status</SelectItem>
                        <SelectItem value="available">Verfügbar</SelectItem>
                        <SelectItem value="in-use">Im Einsatz</SelectItem>
                        <SelectItem value="maintenance">Wartung</SelectItem>
                        <SelectItem value="broken">Defekt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Equipment List */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                Ausrüstung ({filteredEquipment.length})
              </h2>
              <Button onClick={handleAddEquipment}>
                <Plus className="h-4 w-4 mr-2" />
                Ausrüstung hinzufügen
              </Button>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {filteredEquipment.map((item) => (
                    <div key={item.id} className="border rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-white">
                            {getCategoryIcon(item.category)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold">
                                {item.name}
                              </h3>
                              <Badge className={getStatusColor(item.status)}>
                                {getStatusText(item.status)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {item.type} • {item.category}
                            </p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <span>{item.location}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Target className="h-4 w-4 text-gray-400" />
                                <span>€{item.value.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span>Wartung: {item.nextMaintenance}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Activity
                                  className={`h-4 w-4 ${getConditionColor(
                                    item.condition
                                  )}`}
                                />
                                <span
                                  className={getConditionColor(item.condition)}
                                >
                                  {item.condition}
                                </span>
                              </div>
                            </div>

                            {item.utilizationRate && (
                              <div className="mb-2">
                                <div className="flex items-center justify-between text-sm mb-1">
                                  <span className="text-muted-foreground">
                                    Auslastung
                                  </span>
                                  <span className="font-medium">
                                    {item.utilizationRate}%
                                  </span>
                                </div>
                                <Progress
                                  value={item.utilizationRate}
                                  className="h-2"
                                />
                              </div>
                            )}

                            {item.currentProject && (
                              <p className="text-sm text-blue-600 dark:text-blue-400">
                                Aktuelles Projekt: {item.currentProject}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditEquipment(item)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Bearbeiten
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <ResourceAnalytics equipment={equipment} />
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Wartungsübersicht</CardTitle>
                <CardDescription>
                  Geplante und überfällige Wartungen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {equipment
                    .filter((eq) => eq.nextMaintenance)
                    .sort(
                      (a, b) =>
                        new Date(a.nextMaintenance).getTime() -
                        new Date(b.nextMaintenance).getTime()
                    )
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-white">
                            {getCategoryIcon(item.category)}
                          </div>
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {item.type}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">Nächste Wartung</p>
                          <p className="text-sm text-muted-foreground">
                            {item.nextMaintenance}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
                <Button
                  className="w-full mt-4"
                  variant="outline"
                  onClick={handleOpenMaintenanceSchedule}
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  Wartungsplan öffnen
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <EquipmentProfileDialog
          open={isEquipmentDialogOpen}
          onOpenChange={setIsEquipmentDialogOpen}
          equipment={selectedEquipment}
          onSuccess={handleEquipmentSuccess}
        />

        <MaintenanceScheduleDialog
          open={isMaintenanceDialogOpen}
          onOpenChange={setIsMaintenanceDialogOpen}
          equipmentList={equipment.map((eq) => ({
            id: eq.id,
            name: eq.name,
            category: eq.type,
            nextMaintenanceDate: eq.nextMaintenance,
          }))}
        />
      </div>
    </LayoutWithSidebar>
  );
};

export default Resources;
