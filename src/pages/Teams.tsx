import React, { useState, useEffect } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  EmployeeProfileDialog,
  type Employee as EmployeeDialogType,
} from "@/components/teams/EmployeeProfileDialog";
import {
  SkillMatrixDialog,
  type EmployeeSkillData,
} from "@/components/teams/SkillMatrixDialog";
import {
  EquipmentProfileDialog,
  type Equipment as EquipmentDlgType,
} from "@/components/resources/EquipmentProfileDialog";
import { MaintenanceScheduleDialog } from "@/components/resources/MaintenanceScheduleDialog";
import {
  TeamDashboardSkeleton,
  EmployeeListSkeleton,
  EquipmentListSkeleton,
  AvailabilityOverviewSkeleton,
  StatsCardSkeleton,
} from "@/components/teams/TeamSkeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import {
  Building,
  Users,
  Plus,
  Edit,
  Search,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  Award,
  Target,
  CheckCircle,
  AlertTriangle,
  Briefcase,
  Wrench,
  Truck,
  HardHat,
  Hammer,
  Construction,
  Package,
  BarChart3,
  CalendarDays,
  UserCheck,
  Activity,
} from "lucide-react";
import { LayoutWithSidebar } from "@/components/LayoutWithSidebar";

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  phone: string;
  email: string;
  skills: Array<{ name: string; level: string }>;
  availability: "available" | "busy" | "vacation" | "sick";
  currentProject?: string;
  hourlyRate: number;
  workingHours: { start: string; end: string };
  location?: string;
  startDate?: string;
  notes?: string;
}

import {
  resourceService,
  Equipment as EquipmentType,
} from "@/services/ResourceService";
import { teamService, TeamMember } from "@/services/TeamService";

const Teams = () => {
  const [activeTab, setActiveTab] = useState("employees");
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [equipmentCategoryFilter, setEquipmentCategoryFilter] =
    useState<string>("all");
  const [equipmentStatusFilter, setEquipmentStatusFilter] =
    useState<string>("all");

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [inventory, setInventory] = useState<EquipmentType[]>([]);
  const [employees, setEmployees] = useState<TeamMember[]>([]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const [eq, members] = await Promise.all([
        resourceService.refresh(),
        teamService.listMembers(),
      ]);
      setInventory(resourceService.listEquipment());
      setEmployees(members);
      setIsLoading(false);
    };
    load();
  }, []);

  // Employee dialog state
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<
    EmployeeDialogType | undefined
  >();

  // Skill Matrix dialog state
  const [isSkillMatrixOpen, setIsSkillMatrixOpen] = useState(false);

  // Equipment dialog state
  const [isEquipmentDialogOpen, setIsEquipmentDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<
    EquipmentDlgType | undefined
  >();

  // Maintenance Schedule dialog state
  const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false);

  // Filters and state removed logic
  const allEquipment = inventory;

  const getAvailabilityColor = (availability: string) => {
    const colors = {
      available:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      busy: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      vacation: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      sick: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    };
    return (
      colors[availability as keyof typeof colors] || "bg-gray-100 text-gray-800"
    );
  };

  const getStatusText = (status: string) => {
    const texts = {
      available: "Verfügbar",
      busy: "Beschäftigt",
      vacation: "Urlaub",
      sick: "Krank",
      "in-use": "Im Einsatz",
      maintenance: "Wartung",
      broken: "Defekt",
    };
    return texts[status as keyof typeof texts] || status;
  };

  const getEquipmentIcon = (category: string) => {
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

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment =
      departmentFilter === "all" || emp.department === departmentFilter;
    const matchesAvailability =
      availabilityFilter === "all" || emp.availability === availabilityFilter;

    return matchesSearch && matchesDepartment && matchesAvailability;
  });

  const filteredEquipment = allEquipment.filter((eq) => {
    const matchesSearch =
      eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      equipmentCategoryFilter === "all" ||
      eq.category === equipmentCategoryFilter;
    const matchesStatus =
      equipmentStatusFilter === "all" || eq.status === equipmentStatusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Get unique departments for filter
  const departments = Array.from(new Set(employees.map((e) => e.department)));

  // Handler functions
  const handleAddEmployee = () => {
    setSelectedEmployee(undefined);
    setIsEmployeeDialogOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEmployeeDialogOpen(true);
  };

  const handleEmployeeSuccess = () => {
    // TODO: Refresh employee list from API
    console.log("Employee saved successfully");
  };

  const handleOpenSkillMatrix = () => {
    setIsSkillMatrixOpen(true);
  };

  const handleAddEquipment = () => {
    setSelectedEquipment(undefined);
    setIsEquipmentDialogOpen(true);
  };

  const handleEditEquipment = (eq: EquipmentType) => {
    // Convert EquipmentType to EquipmentDlgType
    const equipmentData: EquipmentDlgType = {
      id: eq.id,
      name: eq.name,
      type: eq.type,
      category: eq.category,
      status: eq.status,
      location: eq.location,
      manufacturer: eq.manufacturer || "",
      model: eq.model || "",
      serialNumber: eq.serialNumber || "",
      purchasePrice: eq.purchasePrice || 0,
      currentValue: eq.currentValue || 0,
      maintenanceInterval: eq.maintenanceInterval || 30,
      assignedTo: eq.assignedTo || "",
      currentProject: eq.currentProject || "",
      purchaseDate: eq.purchaseDate
        ? eq.purchaseDate.toISOString().split("T")[0]
        : "",
      lastMaintenanceDate: eq.lastMaintenanceDate
        ? eq.lastMaintenanceDate.toISOString().split("T")[0]
        : "",
      nextMaintenanceDate: eq.nextMaintenanceDate
        ? eq.nextMaintenanceDate.toISOString().split("T")[0]
        : "",
      notes: eq.notes || "",
    };
    setSelectedEquipment(equipmentData);
    setIsEquipmentDialogOpen(true);
  };

  const handleEquipmentSuccess = () => {
    // TODO: Refresh equipment list from API
    console.log("Equipment saved successfully");
  };

  const handleOpenMaintenanceSchedule = () => {
    setIsMaintenanceDialogOpen(true);
  };

  // Convert employees to EmployeeSkillData format for skill matrix
  const employeesForSkillMatrix: EmployeeSkillData[] = employees.map((emp) => ({
    id: emp.id,
    name: emp.name,
    department: emp.department,
    role: emp.role,
    skills: emp.skills
      .filter((s) =>
        ["beginner", "intermediate", "advanced", "expert"].includes(s.level)
      )
      .map((s) => ({
        name: s.name,
        level: s.level as "beginner" | "intermediate" | "advanced" | "expert",
      })),
  }));

  const availableEmployees = employees.filter(
    (e) => e.availability === "available"
  ).length;
  const busyEmployees = employees.filter(
    (e) => e.availability === "busy"
  ).length;
  const availableEquipment = allEquipment.filter(
    (e) => e.status === "available"
  ).length;
  const equipmentInUse = allEquipment.filter(
    (e) => e.status === "in-use"
  ).length;

  // Simulate data loading (remove this when connecting to real API)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Show loading skeleton while data is being fetched
  if (isLoading) {
    return <TeamDashboardSkeleton />;
  }

  return (
    <LayoutWithSidebar
      breadcrumbItems={[
        { label: "Home", href: "/dashboard" },
        { label: "Teams" },
      ]}
      pageTitle="Teams"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Mitarbeiterplanung, Geräteverwaltung und Verfügbarkeitskalender
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end sm:justify-start">
            <Button onClick={handleOpenSkillMatrix} variant="outline" size="lg">
              <Award className="h-5 w-5 mr-2" />
              Skill Matrix
            </Button>
            <Button onClick={handleAddEmployee} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Mitarbeiter hinzufügen
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mitarbeiter</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employees.length}</div>
              <p className="text-xs text-muted-foreground">
                {availableEmployees} verfügbar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Beschäftigt</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{busyEmployees}</div>
              <p className="text-xs text-muted-foreground">
                aktive Zuweisungen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ausrüstung</CardTitle>
              <Construction className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allEquipment.length}</div>
              <p className="text-xs text-muted-foreground">
                {availableEquipment} verfügbar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Im Einsatz</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{equipmentInUse}</div>
              <p className="text-xs text-muted-foreground">Geräte aktiv</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-5 h-14 p-2 bg-muted/50 rounded-lg">
            <TabsTrigger
              value="employees"
              className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              Mitarbeiter
            </TabsTrigger>
            <TabsTrigger
              value="equipment"
              className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              Ausrüstung
            </TabsTrigger>
            <TabsTrigger
              value="schedule"
              className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              Einsatzplanung
            </TabsTrigger>
            <TabsTrigger
              value="availability"
              className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              Verfügbarkeit
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="space-y-6">
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
                        placeholder="Mitarbeiter durchsuchen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="department-filter" className="sr-only">
                      Abteilung
                    </Label>
                    <Select
                      value={departmentFilter}
                      onValueChange={setDepartmentFilter}
                    >
                      <SelectTrigger id="department-filter">
                        <SelectValue placeholder="Alle Abteilungen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Abteilungen</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="availability-filter" className="sr-only">
                      Verfügbarkeit
                    </Label>
                    <Select
                      value={availabilityFilter}
                      onValueChange={setAvailabilityFilter}
                    >
                      <SelectTrigger id="availability-filter">
                        <SelectValue placeholder="Alle Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Status</SelectItem>
                        <SelectItem value="available">Verfügbar</SelectItem>
                        <SelectItem value="busy">Beschäftigt</SelectItem>
                        <SelectItem value="vacation">Urlaub</SelectItem>
                        <SelectItem value="sick">Krank</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mitarbeiter ({filteredEmployees.length})</CardTitle>
                <CardDescription>
                  Übersicht aller Teammitglieder mit aktueller Verfügbarkeit
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <EmployeeListSkeleton count={3} />
                ) : filteredEmployees.length === 0 ? (
                  <div className="text-center py-12">
                    <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Keine Mitarbeiter gefunden
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {searchTerm ||
                      departmentFilter !== "all" ||
                      availabilityFilter !== "all"
                        ? "Keine Mitarbeiter entsprechen den aktuellen Filterkriterien."
                        : "Fügen Sie Ihren ersten Mitarbeiter hinzu, um loszulegen."}
                    </p>
                    {!searchTerm &&
                      departmentFilter === "all" &&
                      availabilityFilter === "all" && (
                        <Button onClick={handleAddEmployee}>
                          <Plus className="h-4 w-4 mr-2" />
                          Mitarbeiter hinzufügen
                        </Button>
                      )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredEmployees.map((employee) => (
                      <div key={employee.id} className="border rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <User className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-lg font-semibold">
                                  {employee.name}
                                </h3>
                                <Badge
                                  className={getAvailabilityColor(
                                    employee.availability
                                  )}
                                >
                                  {getStatusText(employee.availability)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {employee.role} • {employee.department}
                              </p>

                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
                                <div className="flex items-center space-x-2">
                                  <Phone className="h-4 w-4 text-gray-400" />
                                  <span>{employee.phone}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Clock className="h-4 w-4 text-gray-400" />
                                  <span>
                                    {employee.workingHours.start} -{" "}
                                    {employee.workingHours.end}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Target className="h-4 w-4 text-gray-400" />
                                  <span>€{employee.hourlyRate}/h</span>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {employee.skills.map((skill, index) => (
                                  <Badge key={index} variant="secondary">
                                    {skill.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditEmployee(employee)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Bearbeiten
                            </Button>
                            <Button variant="outline" size="sm">
                              <Calendar className="h-4 w-4 mr-2" />
                              Planen
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="equipment" className="space-y-6">
            {/* Equipment Search and Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="equipment-search" className="sr-only">
                      Suchen
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="equipment-search"
                        placeholder="Ausrüstung durchsuchen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="category-filter" className="sr-only">
                      Kategorie
                    </Label>
                    <Select
                      value={equipmentCategoryFilter}
                      onValueChange={setEquipmentCategoryFilter}
                    >
                      <SelectTrigger id="category-filter">
                        <SelectValue placeholder="Alle Kategorien" />
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
                    <Label htmlFor="status-filter" className="sr-only">
                      Status
                    </Label>
                    <Select
                      value={equipmentStatusFilter}
                      onValueChange={setEquipmentStatusFilter}
                    >
                      <SelectTrigger id="status-filter">
                        <SelectValue placeholder="Alle Status" />
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

            {/* Equipment Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={handleAddEquipment}>
                <Plus className="h-4 w-4 mr-2" />
                Ausrüstung hinzufügen
              </Button>
              <Button onClick={handleOpenMaintenanceSchedule} variant="outline">
                <Wrench className="h-4 w-4 mr-2" />
                Wartungsplanung
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>
                  Ausrüstung & Geräte ({filteredEquipment.length})
                </CardTitle>
                <CardDescription>
                  Verwaltung aller Baugeräte, Fahrzeuge und Werkzeuge
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <EquipmentListSkeleton count={3} />
                ) : filteredEquipment.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Keine Ausrüstung gefunden
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {searchTerm ||
                      equipmentCategoryFilter !== "all" ||
                      equipmentStatusFilter !== "all"
                        ? "Keine Ausrüstung entspricht den aktuellen Filterkriterien."
                        : "Fügen Sie Ihre erste Ausrüstung hinzu, um loszulegen."}
                    </p>
                    {!searchTerm &&
                      equipmentCategoryFilter === "all" &&
                      equipmentStatusFilter === "all" && (
                        <Button onClick={handleAddEquipment}>
                          <Plus className="h-4 w-4 mr-2" />
                          Ausrüstung hinzufügen
                        </Button>
                      )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredEquipment.map((item) => (
                      <div key={item.id} className="border rounded-lg p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-white">
                              {getEquipmentIcon(item.category)}
                            </div>
                            <div>
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-lg font-semibold">
                                  {item.name}
                                </h3>
                                <Badge
                                  className={getAvailabilityColor(item.status)}
                                >
                                  {getStatusText(item.status)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {item.type} • {item.category}
                              </p>

                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
                                <div className="flex items-center space-x-2">
                                  <MapPin className="h-4 w-4 text-gray-400" />
                                  <span>{item.location}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Target className="h-4 w-4 text-gray-400" />
                                  <span>
                                    €{(item.currentValue || 0).toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Wrench className="h-4 w-4 text-gray-400" />
                                  <span>
                                    Wartung:{" "}
                                    {item.nextMaintenanceDate?.toLocaleDateString() ||
                                      "N/A"}
                                  </span>
                                </div>
                              </div>

                              {item.assignedTo && (
                                <div className="flex items-center space-x-2 text-sm">
                                  <UserCheck className="h-4 w-4 text-blue-600" />
                                  <span>
                                    Zugeteilt an:{" "}
                                    {
                                      employees.find(
                                        (e) => e.id === item.assignedTo
                                      )?.name
                                    }
                                  </span>
                                  {item.currentProject && (
                                    <span>
                                      • Projekt: {item.currentProject}
                                    </span>
                                  )}
                                </div>
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
                            <Button variant="outline" size="sm">
                              <Calendar className="h-4 w-4 mr-2" />
                              Zuteilen
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CalendarDays className="h-5 w-5 text-blue-600" />
                  <span>Einsatzplanung</span>
                </CardTitle>
                <CardDescription>
                  Wochenübersicht der Mitarbeiter- und Geräteeinsätze
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-8 gap-4">
                      {Array.from({ length: 24 }, (_, i) => (
                        <Skeleton key={i} className="h-8 w-full" />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Current Week Schedule */}
                    <div className="grid grid-cols-8 gap-4 text-sm">
                      <div className="font-medium">Team</div>
                      <div className="font-medium text-center">Mo</div>
                      <div className="font-medium text-center">Di</div>
                      <div className="font-medium text-center">Mi</div>
                      <div className="font-medium text-center">Do</div>
                      <div className="font-medium text-center">Fr</div>
                      <div className="font-medium text-center">Sa</div>
                      <div className="font-medium text-center">So</div>

                      {employees
                        .filter((e) => e.availability === "busy")
                        .map((employee) => (
                          <React.Fragment key={employee.id}>
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4" />
                              <span className="font-medium">
                                {employee.name}
                              </span>
                            </div>
                            {Array.from({ length: 7 }, (_, i) => (
                              <div key={i} className="text-center">
                                {employee.currentProject && (
                                  <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs">
                                    {employee.currentProject}
                                  </div>
                                )}
                              </div>
                            ))}
                          </React.Fragment>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="availability" className="space-y-6">
            {isLoading ? (
              <AvailabilityOverviewSkeleton />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Mitarbeiter Verfügbarkeit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {employees.map((employee) => (
                        <div
                          key={employee.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <User className="h-5 w-5" />
                            <div>
                              <p className="font-medium">{employee.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {employee.role}
                              </p>
                            </div>
                          </div>
                          <Badge
                            className={getAvailabilityColor(
                              employee.availability
                            )}
                          >
                            {getStatusText(employee.availability)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Ausrüstung Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {allEquipment.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            {getEquipmentIcon(item.category)}
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.type}
                              </p>
                            </div>
                          </div>
                          <Badge className={getAvailabilityColor(item.status)}>
                            {getStatusText(item.status)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Auslastung</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round((busyEmployees / employees.length) * 100)}%
                    </div>
                    <Progress
                      value={(busyEmployees / employees.length) * 100}
                      className="mt-2"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Durchschn. Stundensatz
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      €
                      {Math.round(
                        employees.reduce((sum, e) => sum + e.hourlyRate, 0) /
                          employees.length
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">pro Stunde</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Ausrüstungswert</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      €
                      {Math.round(
                        allEquipment.reduce(
                          (sum, e) => sum + (e.currentValue || 0),
                          0
                        ) / 1000
                      )}
                      k
                    </div>
                    <p className="text-xs text-muted-foreground">Gesamtwert</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Verfügbarkeit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round(
                        (availableEquipment / allEquipment.length) * 100
                      )}
                      %
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Geräte verfügbar
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Employee Profile Dialog */}
        <EmployeeProfileDialog
          open={isEmployeeDialogOpen}
          onOpenChange={setIsEmployeeDialogOpen}
          employee={selectedEmployee}
          onSuccess={handleEmployeeSuccess}
        />

        {/* Skill Matrix Dialog */}
        <SkillMatrixDialog
          open={isSkillMatrixOpen}
          onOpenChange={setIsSkillMatrixOpen}
          employees={employeesForSkillMatrix}
        />

        {/* Equipment Profile Dialog */}
        <EquipmentProfileDialog
          open={isEquipmentDialogOpen}
          onOpenChange={setIsEquipmentDialogOpen}
          equipment={selectedEquipment}
          onSuccess={handleEquipmentSuccess}
        />

        {/* Maintenance Schedule Dialog */}
        <MaintenanceScheduleDialog
          open={isMaintenanceDialogOpen}
          onOpenChange={setIsMaintenanceDialogOpen}
          equipmentList={allEquipment.map((eq) => ({
            id: eq.id,
            name: eq.name,
            category: eq.type,
            nextMaintenanceDate: eq.nextMaintenanceDate?.toISOString() || "",
          }))}
        />
      </div>
    </LayoutWithSidebar>
  );
};

export default Teams;
