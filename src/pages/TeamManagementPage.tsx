/**
 * Team Management Page - Admin/Geschäftsführer verwaltet Mitarbeiter-Berechtigungen
 */

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Users,
  UserPlus,
  Settings,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Mail,
  Ban,
  ShieldAlert,
  Rocket,
} from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import { usePermissions } from "@/hooks/usePermissions";
import { stripeService } from "@/services/stripeService";

import {
  teamService,
  TeamMember,
  UserPermissions,
} from "@/services/TeamService";

const TeamManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, isManager, hasPermission } = usePermissions();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  // Check permissions - Only admins and managers can access team management
  const canManageTeam =
    isAdmin() || isManager() || hasPermission("team.manageRoles");
  const canInviteUsers = isAdmin() || hasPermission("team.inviteUsers");

  // Invite form state
  const [inviteForm, setInviteForm] = useState({
    email: "",
    name: "",
    role: "user",
  });

  const loadTeamMembers = useCallback(async () => {
    setLoading(true);
    try {
      const members = await teamService.listMembers();
      setMembers(members);
    } catch (error) {
      console.error("Failed to load team members:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeamMembers();
  }, [loadTeamMembers]);

  const openPermissionsDialog = (member: TeamMember) => {
    setSelectedMember(member);
    setIsPermissionsDialogOpen(true);
  };

  const updatePermission = (
    category: keyof UserPermissions,
    key: string,
    value: boolean
  ) => {
    if (!selectedMember) return;

    setSelectedMember({
      ...selectedMember,
      permissions: {
        ...selectedMember.permissions,
        [category]: {
          ...selectedMember.permissions[category],
          [key]: value,
        },
      },
    });
  };

  const savePermissions = async () => {
    if (!selectedMember) return;

    try {
      await teamService.updateMember(selectedMember.id, {
        permissions: selectedMember.permissions,
      });

      // Update local state
      setMembers(
        members.map((m) =>
          m.id === selectedMember.id
            ? { ...m, permissions: selectedMember.permissions }
            : m
        )
      );

      setIsPermissionsDialogOpen(false);
      alert("Berechtigungen erfolgreich aktualisiert!");
    } catch (error) {
      console.error("Failed to save permissions:", error);
      alert("Fehler beim Speichern der Berechtigungen");
    }
  };

  /**
   * Invite new team member
   */
  const inviteTeamMember = async () => {
    if (!inviteForm.email || !inviteForm.name) {
      alert("Bitte füllen Sie alle Felder aus");
      return;
    }

    try {
      const success = await teamService.inviteMember(
        inviteForm.email,
        inviteForm.name,
        inviteForm.role
      );

      if (success) {
        // Send welcome email
        await sendWelcomeEmail(inviteForm.email, inviteForm.name);

        // Reload members
        await loadTeamMembers();

        // Close dialog and reset form
        setIsInviteDialogOpen(false);
        setInviteForm({ email: "", name: "", role: "user" });

        // Mark that team has been invited (for dashboard quick-start)
        localStorage.setItem("bauplan_team_invited", "true");

        alert(`Einladung an ${inviteForm.email} wurde versendet!`);
      }
    } catch (error) {
      console.error("Failed to invite team member:", error);
      alert(
        "Fehler beim Einladen des Mitarbeiters: " + (error as Error).message
      );
    }
  };

  /**
   * Send welcome email to new team member
   */
  const sendWelcomeEmail = async (email: string, name: string) => {
    // TODO: Integrate with emailService
    console.log(`Sending welcome email to ${email}`);
    // await emailService.sendWelcomeEmail({ ... });
  };

  /**
   * Remove team member
   */
  const removeTeamMember = async (memberId: string) => {
    if (!confirm("Möchten Sie diesen Mitarbeiter wirklich deaktivieren?"))
      return;

    try {
      await teamService.updateMember(memberId, { isActive: false });
      await loadTeamMembers();
      alert("Mitarbeiter wurde deaktiviert. Login ist nicht mehr möglich.");
    } catch (error) {
      console.error("Failed to remove team member:", error);
      alert("Fehler beim Deaktivieren des Mitarbeiters");
    }
  };

  /**
   * Reactivate team member
   */
  const reactivateTeamMember = async (memberId: string) => {
    if (!confirm("Möchten Sie diesen Mitarbeiter wieder aktivieren?")) return;

    try {
      await teamService.updateMember(memberId, { isActive: true });
      await loadTeamMembers();
      alert("Mitarbeiter wurde wieder aktiviert.");
    } catch (error) {
      console.error("Failed to reactivate team member:", error);
      alert("Fehler beim Reaktivieren des Mitarbeiters");
    }
  };

  /**
   * Permanently delete team member
   */
  const deleteTeamMember = async (memberId: string) => {
    if (
      !confirm(
        "ACHTUNG: Möchten Sie diesen Mitarbeiter PERMANENT löschen?\n\nDies kann nicht rückgängig gemacht werden!"
      )
    )
      return;

    try {
      await teamService.deleteMember(memberId);
      await loadTeamMembers();
      alert("Mitarbeiter wurde permanent gelöscht.");
    } catch (error) {
      console.error("Failed to delete team member:", error);
      alert("Fehler beim Löschen des Mitarbeiters");
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800";
      case "user":
        return "bg-blue-100 text-blue-800";
      case "viewer":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  // Permission check - show unauthorized message if user lacks access
  if (!canManageTeam) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center space-x-2 text-red-600">
              <ShieldAlert className="h-6 w-6" />
              <CardTitle>Zugriff verweigert</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                Sie haben keine Berechtigung, auf die Team-Verwaltung
                zuzugreifen. Nur Administratoren und Manager können
                Team-Mitglieder verwalten.
              </AlertDescription>
            </Alert>
            <div className="mt-6 flex justify-center">
              <Button onClick={() => navigate("/dashboard")} variant="outline">
                Zurück zum Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Team-Verwaltung
            </h1>
            <p className="text-gray-600">
              Verwalten Sie Mitarbeiter und deren Berechtigungen
            </p>
          </div>
          <Button
            onClick={() => setIsInviteDialogOpen(true)}
            disabled={!canInviteUsers}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Mitarbeiter einladen
          </Button>
        </div>

        {/* Subscription Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900">
                  Abo: Professional Plan
                </h3>
                <p className="text-sm text-blue-700">
                  {members.length} / 10 Mitarbeiter genutzt
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-700">
                  Noch {10 - members.length} Plätze frei
                </p>
                {members.length >= 8 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={async () => {
                      try {
                        const tenant = supabase.getCurrentTenant();
                        if (!tenant) {
                          alert("Tenant nicht gefunden");
                          return;
                        }

                        const { url, error } =
                          await stripeService.createPortalSession({
                            tenantId: tenant.id,
                            returnUrl: `${window.location.origin}/teams`,
                          });

                        if (error || !url) {
                          alert("Fehler beim Öffnen des Abo-Portals");
                          return;
                        }

                        window.location.href = url;
                      } catch (error) {
                        console.error("Portal error:", error);
                        alert("Fehler beim Öffnen des Abo-Portals");
                      }
                    }}
                  >
                    <Rocket className="h-4 w-4 mr-1" />
                    Abo upgraden
                  </Button>
                )}
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(members.length / 10) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Members Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  Mitarbeiter (
                  {members.filter((m) => showInactive || m.isActive).length})
                </CardTitle>
                <CardDescription>
                  Alle Mitarbeiter in Ihrer Organisation
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center space-x-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span>Inaktive anzeigen</span>
                </label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Letzter Login</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members
                  .filter((m) => showInactive || m.isActive)
                  .map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.name || "Kein Name"}
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(member.role)}>
                          {member.role === "admin" && "Geschäftsführer"}
                          {member.role === "user" && "Mitarbeiter"}
                          {member.role === "viewer" && "Nur Lesen"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {member.isActive ? (
                          <Badge className="bg-green-100 text-green-800">
                            Aktiv
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">
                            Inaktiv
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {member.lastLoginAt
                          ? new Date(member.lastLoginAt).toLocaleDateString(
                              "de-DE"
                            )
                          : "Noch nie"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {member.isActive ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openPermissionsDialog(member)}
                                title="Berechtigungen bearbeiten"
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Email senden"
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                              {member.role !== "admin" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeTeamMember(member.id)}
                                  title="Mitarbeiter deaktivieren"
                                  className="text-orange-600 hover:text-orange-700"
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => reactivateTeamMember(member.id)}
                                title="Mitarbeiter reaktivieren"
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteTeamMember(member.id)}
                                title="Permanent löschen"
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Permissions Dialog */}
        <MultiWindowDialog
          open={isPermissionsDialogOpen}
          onOpenChange={setIsPermissionsDialogOpen}
        >
          <DialogFrame
            title={`Berechtigungen: ${
              selectedMember?.name || selectedMember?.email
            }`}
            description="Legen Sie fest, welche Bereiche und Funktionen dieser Mitarbeiter sehen und nutzen darf"
            width="max-w-4xl"
            modal={false}
            onClose={() => setIsPermissionsDialogOpen(false)}
            footer={
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsPermissionsDialogOpen(false)}
                >
                  Abbrechen
                </Button>
                <Button onClick={savePermissions}>Speichern</Button>
              </div>
            }
          >
            {selectedMember && (
              <div className="space-y-6 mt-4">
                {/* Module */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">📦 Module</CardTitle>
                    <CardDescription>
                      Welche Module kann der Mitarbeiter sehen?
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(selectedMember.permissions.modules).map(
                        ([key, value]) => (
                          <PermissionCheckbox
                            key={key}
                            label={getModuleLabel(key)}
                            checked={value}
                            onChange={(checked) =>
                              updatePermission("modules", key, checked)
                            }
                          />
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Financials */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">💰 Finanzen</CardTitle>
                    <CardDescription>
                      Welche Finanz-Daten darf der Mitarbeiter sehen?
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(
                        selectedMember.permissions.financials
                      ).map(([key, value]) => (
                        <PermissionCheckbox
                          key={key}
                          label={getFinancialLabel(key)}
                          checked={value}
                          onChange={(checked) =>
                            updatePermission("financials", key, checked)
                          }
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Team */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">👥 Team</CardTitle>
                    <CardDescription>
                      Team-Verwaltung Berechtigungen
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(selectedMember.permissions.team).map(
                        ([key, value]) => (
                          <PermissionCheckbox
                            key={key}
                            label={getTeamLabel(key)}
                            checked={value}
                            onChange={(checked) =>
                              updatePermission("team", key, checked)
                            }
                          />
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">⚙️ Einstellungen</CardTitle>
                    <CardDescription>
                      Systemeinstellungen Berechtigungen
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(selectedMember.permissions.settings).map(
                        ([key, value]) => (
                          <PermissionCheckbox
                            key={key}
                            label={getSettingsLabel(key)}
                            checked={value}
                            onChange={(checked) =>
                              updatePermission("settings", key, checked)
                            }
                          />
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">🔨 Aktionen</CardTitle>
                    <CardDescription>
                      Was darf der Mitarbeiter tun?
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(selectedMember.permissions.actions).map(
                        ([key, value]) => (
                          <PermissionCheckbox
                            key={key}
                            label={getActionLabel(key)}
                            checked={value}
                            onChange={(checked) =>
                              updatePermission("actions", key, checked)
                            }
                          />
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogFrame>
        </MultiWindowDialog>

        {/* Invite Dialog */}
        <MultiWindowDialog
          open={isInviteDialogOpen}
          onOpenChange={setIsInviteDialogOpen}
        >
          <DialogFrame
            title="Neuen Mitarbeiter einladen"
            description="Laden Sie einen neuen Mitarbeiter zu Ihrem Team ein. Er erhält eine Email mit einem Einladungslink."
            width="max-w-2xl"
            modal={false}
            onClose={() => setIsInviteDialogOpen(false)}
            footer={
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsInviteDialogOpen(false);
                    setInviteForm({ email: "", name: "", role: "user" });
                  }}
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={inviteTeamMember}
                  disabled={
                    !inviteForm.email ||
                    !inviteForm.name ||
                    members.length >= 10
                  }
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Einladung senden
                </Button>
              </div>
            }
          >
            <div className="space-y-6 mt-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="invite-email">E-Mail-Adresse *</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="max.mustermann@firma.de"
                  value={inviteForm.email}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, email: e.target.value })
                  }
                />
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="invite-name">Vollständiger Name *</Label>
                <Input
                  id="invite-name"
                  type="text"
                  placeholder="Max Mustermann"
                  value={inviteForm.name}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, name: e.target.value })
                  }
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="invite-role">Rolle *</Label>
                <select
                  id="invite-role"
                  value={inviteForm.role}
                  onChange={(e) =>
                    setInviteForm({
                      ...inviteForm,
                      role: e.target.value as "admin" | "user" | "viewer",
                    })
                  }
                  className="w-full px-4 py-2 border rounded-md"
                >
                  <option value="user">Mitarbeiter (Standard)</option>
                  <option value="viewer">Nur Lesen</option>
                  <option value="admin">Geschäftsführer (Volle Rechte)</option>
                </select>
                <p className="text-xs text-gray-500">
                  {inviteForm.role === "admin" &&
                    "⚠️ Hat Zugriff auf alle Bereiche inkl. Finanzen und Team-Verwaltung"}
                  {inviteForm.role === "user" &&
                    "✅ Standard-Berechtigungen für Projekte, Angebote und Rechnungen"}
                  {inviteForm.role === "viewer" &&
                    "👁️ Kann nur Daten anzeigen, keine Änderungen"}
                </p>
              </div>

              {/* Preview Info */}
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-sm">
                    Was passiert als nächstes?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                    <li>
                      Einladungs-Email wird an{" "}
                      {inviteForm.email || "den Mitarbeiter"} gesendet
                    </li>
                    <li>
                      Mitarbeiter klickt auf den Link und erstellt sein Passwort
                    </li>
                    <li>Nach dem Login kann er sofort loslegen</li>
                    <li>Sie können später die Berechtigungen anpassen</li>
                  </ol>
                </CardContent>
              </Card>

              {/* Current Users Count */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Aktuell: {members.length} / 10 Mitarbeiter
                    </p>
                    <p className="text-xs text-blue-700">
                      Nach Einladung: {members.length + 1} / 10
                    </p>
                  </div>
                  {members.length >= 10 && (
                    <Badge className="bg-red-100 text-red-800">
                      Limit erreicht!
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </DialogFrame>
        </MultiWindowDialog>
      </div>
    </div>
  );
};

// Helper Component: Permission Checkbox
const PermissionCheckbox: React.FC<{
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ label, checked, onChange }) => (
  <div className="flex items-center space-x-2">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 rounded border-gray-300"
    />
    <Label className="text-sm font-normal cursor-pointer">{label}</Label>
    {checked ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-gray-300" />
    )}
  </div>
);

// Helper Functions: Labels
const getModuleLabel = (key: string): string => {
  const labels: Record<string, string> = {
    quotes: "Angebote",
    projects: "Projekte",
    invoices: "Rechnungen",
    deliveryNotes: "Lieferscheine",
    orderConfirmations: "Auftragsbestätigungen",
    appointments: "Termine",
  };
  return labels[key] || key;
};

const getFinancialLabel = (key: string): string => {
  const labels: Record<string, string> = {
    viewRevenue: "Umsätze anzeigen",
    viewProfit: "Gewinn anzeigen",
    viewCosts: "Kosten anzeigen",
    viewSalaries: "Gehälter anzeigen",
    editPrices: "Preise bearbeiten",
    approveInvoices: "Rechnungen freigeben",
  };
  return labels[key] || key;
};

const getTeamLabel = (key: string): string => {
  const labels: Record<string, string> = {
    viewTeam: "Team anzeigen",
    inviteUsers: "Benutzer einladen",
    manageRoles: "Rollen verwalten",
    viewSalaries: "Gehälter anzeigen",
  };
  return labels[key] || key;
};

const getSettingsLabel = (key: string): string => {
  const labels: Record<string, string> = {
    editCompany: "Firmendaten bearbeiten",
    editBranding: "Branding bearbeiten",
    manageSubscription: "Abo verwalten",
    viewBilling: "Rechnungen anzeigen",
  };
  return labels[key] || key;
};

const getActionLabel = (key: string): string => {
  const labels: Record<string, string> = {
    createQuotes: "Angebote erstellen",
    editQuotes: "Angebote bearbeiten",
    deleteQuotes: "Angebote löschen",
    createProjects: "Projekte erstellen",
    editProjects: "Projekte bearbeiten",
    deleteProjects: "Projekte löschen",
    exportData: "Daten exportieren",
  };
  return labels[key] || key;
};

export default TeamManagementPage;
