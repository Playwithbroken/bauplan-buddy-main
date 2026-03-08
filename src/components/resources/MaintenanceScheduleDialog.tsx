import { useState } from "react";
import {
  MultiWindowDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, addDays, differenceInDays, isPast, isFuture } from "date-fns";
import { de } from "date-fns/locale";
import {
  Wrench,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  Package,
} from "lucide-react";

// Add DialogFrame for standardized layout
import { DialogFrame } from "@/components/ui/dialog-frame";

export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  equipmentName: string;
  type: "routine" | "repair" | "inspection" | "calibration";
  status: "scheduled" | "in-progress" | "completed" | "overdue";
  scheduledDate: string;
  completedDate?: string;
  nextDueDate?: string;
  technician?: string;
  cost?: number;
  notes?: string;
  priority: "low" | "medium" | "high" | "critical";
}

interface MaintenanceScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentList: Array<{
    id: string;
    name: string;
    category: string;
    nextMaintenanceDate?: string;
  }>;
}

const maintenanceTypeConfig = {
  routine: {
    label: "Routinewartung",
    color: "bg-blue-100 text-blue-700 border-blue-300",
  },
  repair: {
    label: "Reparatur",
    color: "bg-red-100 text-red-700 border-red-300",
  },
  inspection: {
    label: "Inspektion",
    color: "bg-green-100 text-green-700 border-green-300",
  },
  calibration: {
    label: "Kalibrierung",
    color: "bg-purple-100 text-purple-700 border-purple-300",
  },
};

const statusConfig = {
  scheduled: {
    label: "Geplant",
    color: "bg-blue-100 text-blue-700 border-blue-300",
    icon: Calendar,
  },
  "in-progress": {
    label: "In Arbeit",
    color: "bg-yellow-100 text-yellow-700 border-yellow-300",
    icon: Clock,
  },
  completed: {
    label: "Abgeschlossen",
    color: "bg-green-100 text-green-700 border-green-300",
    icon: CheckCircle,
  },
  overdue: {
    label: "Überfällig",
    color: "bg-red-100 text-red-700 border-red-300",
    icon: AlertTriangle,
  },
};

const priorityConfig = {
  low: {
    label: "Niedrig",
    color: "bg-gray-100 text-gray-700 border-gray-300",
  },
  medium: {
    label: "Mittel",
    color: "bg-blue-100 text-blue-700 border-blue-300",
  },
  high: {
    label: "Hoch",
    color: "bg-orange-100 text-orange-700 border-orange-300",
  },
  critical: {
    label: "Kritisch",
    color: "bg-red-100 text-red-700 border-red-300",
  },
};

export function MaintenanceScheduleDialog({
  open,
  onOpenChange,
  equipmentList,
}: MaintenanceScheduleDialogProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Mock maintenance records
  const maintenanceRecords: MaintenanceRecord[] = [
    {
      id: "MAINT-001",
      equipmentId: "EQU-001",
      equipmentName: "Baukran LIEBHERR 130 EC-B",
      type: "routine",
      status: "scheduled",
      scheduledDate: "2024-07-15",
      nextDueDate: "2024-10-15",
      technician: "Hans Meier",
      priority: "high",
      notes: "Jährliche Hauptinspektion",
    },
    {
      id: "MAINT-002",
      equipmentId: "EQU-002",
      equipmentName: "Mercedes Sprinter",
      type: "inspection",
      status: "completed",
      scheduledDate: "2024-06-01",
      completedDate: "2024-06-01",
      nextDueDate: "2024-08-01",
      technician: "Auto Müller GmbH",
      cost: 250,
      priority: "medium",
      notes: "TÜV und Ölwechsel",
    },
    {
      id: "MAINT-003",
      equipmentId: "EQU-003",
      equipmentName: "Hilti Bohrhammer TE 3000",
      type: "repair",
      status: "in-progress",
      scheduledDate: "2024-04-05",
      technician: "Werkstatt",
      priority: "critical",
      cost: 150,
      notes: "Motor defekt, wird repariert",
    },
    {
      id: "MAINT-004",
      equipmentId: "EQU-004",
      equipmentName: "Kompressor Atlas Copco",
      type: "routine",
      status: "overdue",
      scheduledDate: "2024-03-15",
      priority: "high",
      notes: "Wartung überfällig seit 20 Tagen",
    },
  ];

  // Filter records
  const filteredRecords = maintenanceRecords.filter((record) => {
    const matchesStatus =
      statusFilter === "all" || record.status === statusFilter;
    const matchesType = typeFilter === "all" || record.type === typeFilter;
    const matchesPriority =
      priorityFilter === "all" || record.priority === priorityFilter;

    return matchesStatus && matchesType && matchesPriority;
  });

  // Calculate statistics
  const stats = {
    total: maintenanceRecords.length,
    scheduled: maintenanceRecords.filter((r) => r.status === "scheduled")
      .length,
    inProgress: maintenanceRecords.filter((r) => r.status === "in-progress")
      .length,
    overdue: maintenanceRecords.filter((r) => r.status === "overdue").length,
    completed: maintenanceRecords.filter((r) => r.status === "completed")
      .length,
  };

  // Upcoming maintenance (next 30 days)
  const upcomingMaintenance = equipmentList
    .filter((eq) => eq.nextMaintenanceDate)
    .map((eq) => ({
      ...eq,
      daysUntil: differenceInDays(
        new Date(eq.nextMaintenanceDate!),
        new Date()
      ),
    }))
    .filter((eq) => eq.daysUntil >= 0 && eq.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const eurFormatter = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  });

  return (
    <MultiWindowDialog open={open} onOpenChange={onOpenChange}>
      <DialogFrame
        showFullscreenToggle
        defaultFullscreen
        width="fit-content"
        minWidth={900}
        maxWidth={1400}
        modal={false}
        onClose={() => onOpenChange(false)}
        title={
          <span className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-blue-600" />
            Wartungsplanung & Service-Historie
          </span>
        }
        description={
          <DialogDescription>
            Übersicht aller Wartungstermine, Service-Historie und anstehende
            Inspektionen
          </DialogDescription>
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Schließen
            </Button>
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              Wartung planen
            </Button>
          </div>
        }
      >
        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="schedule">Wartungsplan</TabsTrigger>
            <TabsTrigger value="upcoming">Anstehend</TabsTrigger>
            <TabsTrigger value="history">Historie</TabsTrigger>
          </TabsList>

          {/* Schedule View */}
          <TabsContent value="schedule" className="space-y-4 mt-4">
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Gesamt</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Geplant
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.scheduled}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    In Arbeit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats.inProgress}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Überfällig
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {stats.overdue}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Erledigt
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.completed}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Typen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Typen</SelectItem>
                  {Object.entries(maintenanceTypeConfig).map(
                    ([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Prioritäten" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Prioritäten</SelectItem>
                  {Object.entries(priorityConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Maintenance Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Wartungsvorgänge ({filteredRecords.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ausrüstung</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priorität</TableHead>
                      <TableHead>Geplant</TableHead>
                      <TableHead>Techniker</TableHead>
                      <TableHead className="text-right">Kosten</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => {
                      const StatusIcon = statusConfig[record.status].icon;
                      return (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            <div>
                              <p>{record.equipmentName}</p>
                              <p className="text-xs text-muted-foreground">
                                {record.id}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                maintenanceTypeConfig[record.type].color
                              }
                            >
                              {maintenanceTypeConfig[record.type].label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={statusConfig[record.status].color}
                            >
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig[record.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={priorityConfig[record.priority].color}
                            >
                              {priorityConfig[record.priority].label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(
                              new Date(record.scheduledDate),
                              "dd.MM.yyyy"
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {record.technician || "-"}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {record.cost
                              ? eurFormatter.format(record.cost)
                              : "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upcoming View */}
          <TabsContent value="upcoming" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Anstehende Wartungen (nächste 30 Tage)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingMaintenance.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingMaintenance.map((item) => (
                      <div
                        key={item.id}
                        className={`border rounded-lg p-4 ${
                          item.daysUntil <= 7
                            ? "border-red-300 bg-red-50 dark:bg-red-950"
                            : item.daysUntil <= 14
                            ? "border-orange-300 bg-orange-50 dark:bg-orange-950"
                            : "border-blue-300 bg-blue-50 dark:bg-blue-950"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              {item.name}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.category}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              item.daysUntil <= 7
                                ? "bg-red-100 border-red-300"
                                : item.daysUntil <= 14
                                ? "bg-orange-100 border-orange-300"
                                : "bg-blue-100 border-blue-300"
                            }
                          >
                            {item.daysUntil === 0
                              ? "Heute"
                              : `In ${item.daysUntil} Tagen`}
                          </Badge>
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {format(
                                new Date(item.nextMaintenanceDate!),
                                "dd.MM.yyyy"
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">
                      Keine anstehenden Wartungen
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      In den nächsten 30 Tagen sind keine Wartungen geplant
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Wartungsempfehlungen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-1">
                      Präventive Wartung priorisieren
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Regelmäßige Wartung reduziert ungeplante Ausfälle um bis
                      zu 70%
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-1">
                      Wartungsbudget optimieren
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Gruppieren Sie Wartungsarbeiten nach Standort, um
                      Anfahrtskosten zu sparen
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-1">Ersatzteile vorhalten</h4>
                    <p className="text-sm text-muted-foreground">
                      Für kritische Ausrüstung sollten häufig benötigte
                      Ersatzteile auf Lager sein
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History View */}
          <TabsContent value="history" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Wartungshistorie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {maintenanceRecords
                    .filter((r) => r.status === "completed")
                    .map((record) => (
                      <div key={record.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">
                              {record.equipmentName}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {maintenanceTypeConfig[record.type].label}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={statusConfig[record.status].color}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {statusConfig[record.status].label}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Geplant:
                            </span>
                            <span className="ml-2 font-medium">
                              {format(
                                new Date(record.scheduledDate),
                                "dd.MM.yyyy"
                              )}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Abgeschlossen:
                            </span>
                            <span className="ml-2 font-medium">
                              {record.completedDate
                                ? format(
                                    new Date(record.completedDate),
                                    "dd.MM.yyyy"
                                  )
                                : "-"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Techniker:
                            </span>
                            <span className="ml-2 font-medium">
                              {record.technician || "-"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Kosten:
                            </span>
                            <span className="ml-2 font-medium">
                              {record.cost
                                ? eurFormatter.format(record.cost)
                                : "-"}
                            </span>
                          </div>
                        </div>

                        {record.notes && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm text-muted-foreground">
                              {record.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogFrame>
    </MultiWindowDialog>
  );
}
