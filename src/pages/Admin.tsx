import React, { useState, useEffect } from "react";
import { LayoutWithSidebar } from "@/components/LayoutWithSidebar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Users,
  Settings,
  Database,
  Activity,
  TrendingUp,
  AlertTriangle,
  Clock,
  Download,
  Trash2,
  Edit3,
  Building2,
  DollarSign,
  Mail,
  Ban,
  CheckCircle,
  Search,
} from "lucide-react";
import PermissionManagement from "@/components/admin/PermissionManagement";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGate } from "@/components/PermissionGate";
import { ErrorHandlingService } from "@/services/errorHandlingService";
import { Input } from "@/components/ui/input";
import {
  MultiWindowDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DialogFrame } from "@/components/ui/dialog-frame";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/services/supabaseClient";

const Admin = () => {
  const { user, hasRole } = useAuth();
  const [systemStats] = useState({
    totalUsers: 12,
    activeProjects: 45,
    systemErrors: 3,
    lastBackup: "2024-01-15T10:30:00Z",
    storageUsed: 85.6,
    systemUptime: "99.8%",
  });

  const recentLogs = ErrorHandlingService.getLogs({ limit: 10 });
  const recentErrors = ErrorHandlingService.getErrorReports({
    resolved: false,
    limit: 5,
  });

  const handleExportLogs = () => {
    const logs = ErrorHandlingService.exportLogs("csv");
    const blob = new Blob([logs], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bauplan-buddy-logs-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearOldLogs = () => {
    ErrorHandlingService.clearOldLogs(30);
    alert("Alte Logs wurden erfolgreich gelöscht.");
  };

  if (!hasRole("admin")) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <div className="text-lg font-medium mb-2">Zugriff verweigert</div>
            <div className="text-muted-foreground">
              Sie haben nicht die erforderlichen Berechtigungen für den
              Admin-Bereich.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <LayoutWithSidebar
      breadcrumbItems={[
        { label: "Home", href: "/dashboard" },
        { label: "Admin" },
      ]}
    >
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-muted-foreground">
              System-Administration und Benutzerverwaltung
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            Admin: {user?.name}
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Benutzer</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.totalUsers}</div>
              <div className="text-xs text-muted-foreground">
                Aktive Benutzerkonten
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Aktive Projekte
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {systemStats.activeProjects}
              </div>
              <div className="text-xs text-muted-foreground">
                Laufende Bauprojekte
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                System-Fehler
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {systemStats.systemErrors}
              </div>
              <div className="text-xs text-muted-foreground">
                Ungelöste Fehler
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                System-Status
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {systemStats.systemUptime}
              </div>
              <div className="text-xs text-muted-foreground">Verfügbarkeit</div>
            </CardContent>
          </Card>
        </div>

        {recentErrors.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                System-Warnungen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentErrors.slice(0, 3).map((error: any) => (
                  <div key={error.id} className="text-sm text-red-700">
                    <span className="font-medium">{error.errorType}:</span>{" "}
                    {error.message}
                    <span className="text-xs text-red-600 ml-2">
                      {new Date(error.timestamp).toLocaleString("de-DE")}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="permissions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="permissions">Berechtigungen</TabsTrigger>
            <TabsTrigger value="users">Benutzerverwaltung</TabsTrigger>
            <TabsTrigger value="tenants">Tenants (SaaS)</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="logs">Protokolle</TabsTrigger>
          </TabsList>

          <TabsContent value="permissions" className="space-y-4">
            <PermissionGate permissions={["users.permissions", "*"]}>
              <PermissionManagement />
            </PermissionGate>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <PermissionGate permissions={["users.write", "*"]}>
              <UserManagementSection />
            </PermissionGate>
          </TabsContent>

          <TabsContent value="tenants" className="space-y-4">
            <PermissionGate permissions={["*"]}>
              <TenantManagementSection />
            </PermissionGate>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <PermissionGate permissions={["*"]}>
              <SystemManagementSection
                stats={systemStats}
                onClearLogs={handleClearOldLogs}
              />
            </PermissionGate>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <PermissionGate permissions={["*"]}>
              <LogsSection
                logs={recentLogs}
                errors={recentErrors}
                onExportLogs={handleExportLogs}
                onClearLogs={handleClearOldLogs}
              />
            </PermissionGate>
          </TabsContent>
        </Tabs>
      </div>
    </LayoutWithSidebar>
  );
};

function UserManagementSection() {
  const [editUser, setEditUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
  } | null>(null);
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<
    Array<{ id: string; name: string; email: string; role: string }>
  >([
    {
      id: "u-1001",
      name: "Admin User",
      email: "admin@bauplan.local",
      role: "admin",
    },
    {
      id: "u-1002",
      name: "Projektleiterin",
      email: "project@bauplan.local",
      role: "project",
    },
    {
      id: "u-1003",
      name: "Einkauf",
      email: "procurement@bauplan.local",
      role: "procurement",
    },
  ]);

  const startEdit = (user: {
    id: string;
    name: string;
    email: string;
    role: string;
  }) => {
    setEditUser(user);
    setOpen(true);
  };

  const handleSave = () => {
    if (!editUser) return;
    setUsers((prev) => prev.map((u) => (u.id === editUser.id ? editUser : u)));
    setOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Benutzerverwaltung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {users.map((u) => (
              <Card key={u.id} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold">{u.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {u.email}
                    </div>
                    <Badge variant="secondary" className="text-xs uppercase">
                      {u.role}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(u)}
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Bearbeiten
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <MultiWindowDialog open={open} onOpenChange={setOpen}>
        <DialogFrame
          title="Benutzer bearbeiten"
          defaultFullscreen={false}
          showFullscreenToggle
          modal={false}
          onClose={() => setOpen(false)}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={handleSave}
                disabled={!editUser?.name || !editUser?.email}
              >
                Speichern
              </Button>
            </div>
          }
        >
          {editUser && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={editUser.name}
                  onChange={(e) =>
                    setEditUser({ ...editUser, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">E-Mail</label>
                <Input
                  value={editUser.email}
                  onChange={(e) =>
                    setEditUser({ ...editUser, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Rolle</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editUser.role}
                  onChange={(e) =>
                    setEditUser({ ...editUser, role: e.target.value })
                  }
                >
                  <option value="admin">Admin</option>
                  <option value="project">Projekt</option>
                  <option value="finance">Finanzen</option>
                  <option value="procurement">Einkauf</option>
                  <option value="viewer">Leser</option>
                </select>
              </div>
            </div>
          )}
        </DialogFrame>
      </MultiWindowDialog>
    </>
  );
}

interface SystemManagementProps {
  stats: { storageUsed: number; lastBackup: string };
  onClearLogs: () => void;
}

function SystemManagementSection({
  stats,
  onClearLogs,
}: SystemManagementProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System-Verwaltung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-sm font-medium">Speicherplatz</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${stats.storageUsed}%` }}
                ></div>
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.storageUsed}% von 10 GB verwendet
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Letztes Backup</div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {new Date(stats.lastBackup).toLocaleString("de-DE")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline">
              <Database className="h-4 w-4 mr-2" />
              Backup erstellen
            </Button>
            <Button variant="outline" onClick={onClearLogs}>
              <Trash2 className="h-4 w-4 mr-2" />
              Alte Logs löschen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface LogsSectionProps {
  logs: any[];
  errors: any[];
  onExportLogs: () => void;
  onClearLogs: () => void;
}

function LogsSection({
  logs,
  errors,
  onExportLogs,
  onClearLogs,
}: LogsSectionProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <CardTitle>System-Protokolle</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onExportLogs}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={onClearLogs}>
                Bereinigen
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {errors.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-red-800">
                  Aktuelle Fehler
                </h4>
                <div className="space-y-2">
                  {errors.slice(0, 5).map((error: any) => (
                    <div
                      key={error.id}
                      className="p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-red-900">
                            {error.errorType}
                          </p>
                          <p className="text-xs text-red-700">
                            {error.message}
                          </p>
                        </div>
                        <Badge variant="destructive" className="text-[10px]">
                          {error.severity}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-red-600 mt-1">
                        {new Date(error.timestamp).toLocaleString("de-DE")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Aktivitäts-Log</h4>
              <div className="border rounded-md divide-y max-h-[300px] overflow-auto">
                {logs.map((log: any) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-2 text-xs hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {log.level === 0
                          ? "DEBUG"
                          : log.level === 1
                          ? "INFO"
                          : log.level === 2
                          ? "WARN"
                          : "ERROR"}
                      </Badge>
                      <span className="truncate max-w-[400px]">
                        {log.message}
                      </span>
                    </div>
                    <span className="text-muted-foreground shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString("de-DE")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface TenantStats {
  id: string;
  companyName: string;
  subscriptionPlan: "free" | "professional" | "enterprise";
  subscriptionStatus: "active" | "canceled" | "suspended";
  subscriptionExpiresAt: string | null;
  userCount: number;
  projectCount: number;
  storageUsedMb: number;
  maxStorageMb: number;
  createdAt: string;
  lastActivity: string;
  mrr: number;
}

function TenantManagementSection() {
  const [tenants, setTenants] = useState<TenantStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [stats, setStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    totalMRR: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    setLoading(true);
    try {
      const client = supabase.getClient();

      const { data: tenantsData, error: tenantsError } = await client
        .from("tenants")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (tenantsError) throw tenantsError;

      const { data: userCounts } = await client
        .from("users")
        .select("tenant_id")
        .eq("is_active", true);

      const { data: projectCounts } = await client
        .from("projects")
        .select("tenant_id")
        .is("deleted_at", null);

      const tenantStats: TenantStats[] = (tenantsData || []).map(
        (tenant: any) => {
          const userCount = (userCounts || []).filter(
            (u: any) => u.tenant_id === tenant.id
          ).length;
          const projectCount = (projectCounts || []).filter(
            (p: any) => p.tenant_id === tenant.id
          ).length;

          const mrr =
            tenant.subscription_plan === "professional"
              ? 29.99
              : tenant.subscription_plan === "enterprise"
              ? 99.99
              : 0;

          return {
            id: tenant.id,
            companyName: tenant.company_name,
            subscriptionPlan: tenant.subscription_plan,
            subscriptionStatus: tenant.subscription_status,
            subscriptionExpiresAt: tenant.subscription_expires_at,
            userCount,
            projectCount,
            storageUsedMb: 0,
            maxStorageMb: tenant.max_storage_mb,
            createdAt: tenant.created_at,
            lastActivity: tenant.updated_at,
            mrr,
          };
        }
      );

      setTenants(tenantStats);
      setStats({
        totalTenants: tenantStats.length,
        activeTenants: tenantStats.filter(
          (t) => t.subscriptionStatus === "active"
        ).length,
        totalMRR: tenantStats
          .filter((t) => t.subscriptionStatus === "active")
          .reduce((sum, t) => sum + t.mrr, 0),
        totalUsers: (userCounts || []).length,
      });
    } catch (error) {
      console.error("Failed to load tenants:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendTenant = async (tenantId: string) => {
    if (!confirm("Diesen Tenant wirklich suspendieren?")) return;
    try {
      const client = supabase.getClient();
      await client
        .from("tenants")
        .update({ subscription_status: "suspended" })
        .eq("id", tenantId);
      loadTenants();
    } catch (error) {
      console.error("Failed to suspend tenant:", error);
    }
  };

  const handleActivateTenant = async (tenantId: string) => {
    try {
      const client = supabase.getClient();
      await client
        .from("tenants")
        .update({ subscription_status: "active" })
        .eq("id", tenantId);
      loadTenants();
    } catch (error) {
      console.error("Failed to activate tenant:", error);
    }
  };

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch = t.companyName
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesPlan =
      filterPlan === "all" || t.subscriptionPlan === filterPlan;
    const matchesStatus =
      filterStatus === "all" || t.subscriptionStatus === filterStatus;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  if (loading)
    return (
      <div className="py-20 text-center text-muted-foreground">
        Daten werden geladen...
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col items-center justify-center">
          <p className="text-xs text-muted-foreground">Gesamt Tenants</p>
          <p className="text-2xl font-bold">{stats.totalTenants}</p>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center">
          <p className="text-xs text-muted-foreground">Aktiv</p>
          <p className="text-2xl font-bold text-green-600">
            {stats.activeTenants}
          </p>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center">
          <p className="text-xs text-muted-foreground">MRR Total</p>
          <p className="text-2xl font-bold text-blue-600">
            €{stats.totalMRR.toFixed(2)}
          </p>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center">
          <p className="text-xs text-muted-foreground">Cloud User</p>
          <p className="text-2xl font-bold">{stats.totalUsers}</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Tenant Management</CardTitle>
              <CardDescription>
                Verwalten Sie Instanzen und Abonnements
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Instanz suchen..."
                  className="pl-8 w-[200px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
              >
                <option value="all">Alle Pläne</option>
                <option value="free">Free</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Firma</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">User</TableHead>
                <TableHead className="text-right">Umsatz</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.companyName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {t.subscriptionPlan}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        t.subscriptionStatus === "active"
                          ? "default"
                          : t.subscriptionStatus === "suspended"
                          ? "destructive"
                          : "secondary"
                      }
                      className="capitalize"
                    >
                      {t.subscriptionStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{t.userCount}</TableCell>
                  <TableCell className="text-right">
                    €{t.mrr.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {t.subscriptionStatus === "active" ? (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleSuspendTenant(t.id)}
                        >
                          <Ban className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleActivateTenant(t.id)}
                        >
                          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                        </Button>
                      )}
                      <Button variant="ghost" size="xs">
                        <Mail className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default Admin;
