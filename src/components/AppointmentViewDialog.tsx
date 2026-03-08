import React, { useState } from "react";
import { Dialog, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StoredAppointment } from "@/services/appointmentService";
import { AppointmentExportService } from "@/services/appointmentExportService";
import { useDeleteAppointment } from "@/hooks/useAppointments";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import SyncStatusIndicator from "@/components/SyncStatusIndicator";
import { toast } from "@/hooks/use-toast";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Building,
  AlertTriangle,
  Settings,
  Bell,
  Edit,
  Trash2,
  Download,
  FileText,
  Table,
  CalendarDays,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { DialogFrame } from "@/components/ui/dialog-frame";

interface AppointmentViewDialogProps {
  appointment: StoredAppointment | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (appointment: StoredAppointment) => void;
  onDelete: (appointmentId: string) => void;
}

const AppointmentViewDialog = ({
  appointment,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: AppointmentViewDialogProps) => {
  const [isExporting, setIsExporting] = useState(false);

  // API hooks
  const deleteAppointmentMutation = useDeleteAppointment();

  if (!appointment) return null;

  const formatGermanDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const handleDelete = async () => {
    if (!window.confirm("Möchten Sie diesen Termin wirklich löschen?")) {
      return;
    }

    try {
      await deleteAppointmentMutation.mutateAsync(appointment.id);

      toast({
        title: "Termin gelöscht",
        description: `Termin "${appointment.title}" wurde erfolgreich gelöscht.`,
      });

      onDelete(appointment.id); // Pass the appointment ID as expected by tests
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler beim Löschen",
        description:
          error instanceof Error
            ? error.message
            : "Termin konnte nicht gelöscht werden.",
      });
    }
  };

  const handleExport = async (format: "pdf" | "excel" | "ical") => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300)); // Brief delay for UX
      AppointmentExportService.exportSingleAppointment(appointment, format);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "site-visit":
        return <Building className="h-4 w-4" />;
      case "meeting":
        return <Users className="h-4 w-4" />;
      case "delivery":
        return <MapPin className="h-4 w-4" />;
      case "milestone":
        return <AlertTriangle className="h-4 w-4" />;
      case "inspection":
        return <Settings className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case "site-visit":
        return "Baustellenbesichtigung";
      case "meeting":
        return "Besprechung";
      case "delivery":
        return "Lieferung";
      case "milestone":
        return "Meilenstein";
      case "inspection":
        return "Inspektion";
      case "internal":
        return "Intern";
      default:
        return "Sonstiges";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "critical":
        return "Kritisch";
      case "high":
        return "Hoch";
      case "medium":
        return "Mittel";
      case "low":
        return "Niedrig";
      default:
        return "Normal";
    }
  };

  const getReminderText = (reminderTime: string) => {
    switch (reminderTime) {
      case "0":
        return "Keine Erinnerung";
      case "15":
        return "15 Minuten vorher";
      case "30":
        return "30 Minuten vorher";
      case "60":
        return "1 Stunde vorher";
      case "1440":
        return "1 Tag vorher";
      default:
        return `${reminderTime} Minuten vorher`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogFrame
        defaultFullscreen
        showFullscreenToggle
        title={
          <span className="flex items-center space-x-2">
            {getTypeIcon(appointment.type)}
            <span>{appointment.title}</span>
          </span>
        }
        description={
          <DialogDescription>
            Termindetails ansehen und bearbeiten
          </DialogDescription>
        }
        headerActions={
          <div className="flex items-center gap-2">
            <SyncStatusIndicator showDetailed={false} />
            <OfflineIndicator className="flex-shrink-0" />
          </div>
        }
        footer={
          <div className="flex justify-between w-full">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => onEdit(appointment)}
                className="flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Bearbeiten</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={isExporting}
                    className="flex items-center space-x-2"
                  >
                    {isExporting ? (
                      <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    <span>Exportieren</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => handleExport("pdf")}>
                    <FileText className="h-4 w-4 mr-2" />
                    Als PDF exportieren
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("excel")}>
                    <Table className="h-4 w-4 mr-2" />
                    Als Excel/CSV exportieren
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("ical")}>
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Als iCal exportieren
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteAppointmentMutation.isPending}
                className="flex items-center space-x-2"
              >
                {deleteAppointmentMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span>
                  {deleteAppointmentMutation.isPending
                    ? "Lösche..."
                    : "Löschen"}
                </span>
              </Button>
            </div>
            <Button variant="outline" onClick={onClose}>
              Schließen
            </Button>
          </div>
        }
      >
        {/* Error Display - handled by toast system */}

        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Grundinformationen</span>
                <Badge className={getPriorityColor(appointment.priority)}>
                  {getPriorityText(appointment.priority)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Typ
                  </label>
                  <div className="flex items-center space-x-2 mt-1">
                    {getTypeIcon(appointment.type)}
                    <span>{getTypeText(appointment.type)}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Datum
                  </label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatGermanDate(appointment.date)}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Uhrzeit
                  </label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {appointment.startTime} - {appointment.endTime}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Ort
                  </label>
                  <div className="flex items-center space-x-2 mt-1">
                    <MapPin className="h-4 w-4" />
                    <span>{appointment.location || "Nicht angegeben"}</span>
                  </div>
                </div>
              </div>

              {appointment.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Beschreibung
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {appointment.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Info */}
          {appointment.projectId && appointment.projectId !== "no-project" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Projektinformationen</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Projekt-ID
                  </label>
                  <p className="mt-1">{appointment.projectId}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Participants */}
          {appointment.attendees.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Teilnehmer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {appointment.attendees.map((attendee, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center space-x-1"
                    >
                      <Users className="h-3 w-3" />
                      <span>{attendee}</span>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Team & Resources */}
          {(appointment.teamMembers.length > 0 ||
            appointment.equipment.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Team & Ressourcen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {appointment.teamMembers.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Zugewiesenes Team
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {appointment.teamMembers.map((memberId, index) => (
                        <Badge key={index} variant="outline">
                          {memberId}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {appointment.equipment.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Benötigte Ausrüstung
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {appointment.equipment.map((equipmentId, index) => (
                        <Badge key={index} variant="outline">
                          {equipmentId}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Einstellungen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Erinnerung</span>
                <div className="flex items-center space-x-2">
                  <Bell className="h-4 w-4" />
                  <span className="text-sm">
                    {getReminderText(appointment.reminderTime)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Kunde benachrichtigen</span>
                <Badge
                  variant={
                    appointment.customerNotification ? "default" : "secondary"
                  }
                >
                  {appointment.customerNotification ? "Ja" : "Nein"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Metadaten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-gray-500">
                <strong>Erstellt:</strong>{" "}
                {new Date(appointment.createdAt).toLocaleString("de-DE")}
              </div>
              <div className="text-sm text-gray-500">
                <strong>Zuletzt geändert:</strong>{" "}
                {new Date(appointment.updatedAt).toLocaleString("de-DE")}
              </div>
              <div className="text-sm text-gray-500">
                <strong>Termin-ID:</strong> {appointment.id}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogFrame>
    </Dialog>
  );
};

export default AppointmentViewDialog;
