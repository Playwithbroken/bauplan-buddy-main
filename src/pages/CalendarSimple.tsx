import React, { useState, useEffect } from "react";
import { LayoutWithSidebar } from "@/components/LayoutWithSidebar";
import { useLanguage } from "@/contexts/LanguageContext";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import AppointmentDialog, {
  AppointmentFormData,
} from "@/components/AppointmentDialog";
import AppointmentViewDialog from "@/components/AppointmentViewDialog";
import AppointmentExportDialog from "@/components/AppointmentExportDialog";
import RecurrenceEditDialog, {
  RecurrenceEditChoice,
} from "@/components/RecurrenceEditDialog";
import {
  StoredAppointment,
  AppointmentService,
} from "@/services/appointmentService";
import {
  useAppointments,
  useCreateAppointment,
  useUpdateAppointment,
  useDeleteAppointment,
} from "@/hooks/useAppointments";
import {
  useRecurringAppointments,
  isRecurringAppointment,
  getRecurrenceInfo,
} from "@/hooks/useRecurringAppointments";
import { RecurrenceService } from "@/services/recurrenceService";
import { AppointmentErrorHandler } from "@/utils/errorHandling";
import { showSuccess, showError } from "@/lib/toast-helpers.tsx";
import { useToast } from "@/hooks/use-toast";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import SyncStatusIndicator from "@/components/SyncStatusIndicator";
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  startOfMonth,
  endOfMonth,
  isAfter,
  isBefore,
} from "date-fns";
import { de } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Plus,
  Building,
  Clock,
  Users,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Search,
  AlertTriangle,
  CheckCircle,
  Target,
  Wrench,
  Truck,
  HardHat,
  UserCheck,
  Calendar as CalIcon,
  Package,
  Settings,
  Filter,
  Eye,
  AlertCircle as AlertIcon,
  Activity,
  Download,
  RefreshCw,
} from "lucide-react";

const CalendarSimple = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [activeView, setActiveView] = useState("month");
  const [activeTab, setActiveTab] = useState("calendar");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedResource, setSelectedResource] = useState("all");
  const [selectedProject, setSelectedProject] = useState("all");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<StoredAppointment | null>(null);
  const [viewingAppointment, setViewingAppointment] =
    useState<StoredAppointment | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showRecurrenceEditDialog, setShowRecurrenceEditDialog] =
    useState(false);
  const [recurrenceAppointmentToEdit, setRecurrenceAppointmentToEdit] =
    useState<StoredAppointment | null>(null);
  const [recurrenceActionType, setRecurrenceActionType] = useState<
    "edit" | "delete"
  >("edit");

  // API hooks for appointment management
  const {
    data: storedAppointments = [],
    isLoading: appointmentsLoading,
    error: appointmentsError,
  } = useAppointments();
  const {
    appointments: recurringAppointments = [],
    isLoading: recurringLoading,
  } = useRecurringAppointments({
    currentDate,
    rangeMonths: 3, // Generate recurring appointments for 3 months before/after current date
  });
  const createAppointmentMutation = useCreateAppointment();
  const updateAppointmentMutation = useUpdateAppointment();
  const deleteAppointmentMutation = useDeleteAppointment();

  // Combine loading states
  const isLoading = appointmentsLoading || recurringLoading;

  // Toast hook for showing error messages
  const { toast } = useToast();
  const { t } = useLanguage();
  const breadcrumbItems = [
    { label: t("navigation.home"), href: "/dashboard" },
    { label: t("navigation.calendar") },
  ];

  // Projects data that appointments can reference
  const projects = [
    {
      id: "PRJ-2024-001",
      name: "Wohnhaus München",
      customer: "Familie Müller",
      status: "active",
      progress: 65,
    },
    {
      id: "PRJ-2024-002",
      name: "Bürogebäude Berlin",
      customer: "TechCorp GmbH",
      status: "active",
      progress: 30,
    },
    {
      id: "PRJ-2024-003",
      name: "Dachsanierung Hamburg",
      customer: "Hausverwaltung Nord",
      status: "planning",
      progress: 10,
    },
    {
      id: "PRJ-2024-004",
      name: "Neubau Einfamilienhaus Dresden",
      customer: "Familie Schmidt",
      status: "quote",
      progress: 5,
    },
  ];

  // Convert stored appointments to calendar events format (including recurring)
  const convertStoredAppointmentsToEvents = (
    appointments: StoredAppointment[]
  ) => {
    return appointments.map((appointment) => {
      const [hours, minutes] = appointment.startTime.split(":").map(Number);
      const [endHours, endMinutes] = appointment.endTime.split(":").map(Number);
      const appointmentDate = new Date(appointment.date);

      // Get recurrence information
      const recurrenceInfo = getRecurrenceInfo(appointment);

      return {
        id: appointment.id,
        title: appointment.title,
        project:
          appointment.projectId !== "no-project"
            ? projects.find((p) => p.id === appointment.projectId)?.name ||
              "Unbekanntes Projekt"
            : undefined,
        projectId:
          appointment.projectId !== "no-project"
            ? appointment.projectId
            : undefined,
        customer:
          appointment.projectId !== "no-project"
            ? projects.find((p) => p.id === appointment.projectId)?.customer
            : undefined,
        type: appointment.type,
        date: new Date(
          appointmentDate.getFullYear(),
          appointmentDate.getMonth(),
          appointmentDate.getDate(),
          hours,
          minutes
        ),
        endDate: new Date(
          appointmentDate.getFullYear(),
          appointmentDate.getMonth(),
          appointmentDate.getDate(),
          endHours,
          endMinutes
        ),
        location: appointment.location,
        attendees: appointment.attendees,
        assignedTeam: appointment.teamMembers,
        assignedEquipment: appointment.equipment,
        description: appointment.description,
        status: "confirmed",
        priority: appointment.priority,
        isMilestone: appointment.type === "milestone",
        // Recurrence information
        isRecurring: recurrenceInfo.isRecurring,
        isMaster: recurrenceInfo.isMaster,
        isOccurrence: recurrenceInfo.isOccurrence,
        seriesId: recurrenceInfo.seriesId,
        masterId: recurrenceInfo.masterId,
        recurrencePattern: appointment.recurrencePattern,
        originalAppointment: appointment, // Keep reference to original appointment
      };
    });
  };

  // Enhanced mock data with resource allocation and project milestones
  const events = [
    {
      id: "EVT-001",
      title: "Baustellenbesichtigung Müller",
      project: "Wohnhaus München",
      projectId: "PRJ-2024-001",
      customer: "Familie Müller",
      type: "site-visit",
      date: new Date(2024, 2, 15, 10, 0),
      endDate: new Date(2024, 2, 15, 12, 0),
      location: "Musterstraße 12, München",
      attendees: ["Hans Müller", "Bauleiter Schmidt"],
      assignedTeam: ["TM-001"],
      assignedEquipment: ["EQ-002"],
      description: "Gemeinsame Begehung des Rohbaus mit dem Kunden",
      status: "confirmed",
      priority: "high",
      isMilestone: false,
      isRecurring: false,
      isMaster: false,
      isOccurrence: false,
      seriesId: null,
      masterId: null,
      recurrencePattern: undefined,
    },
    {
      id: "EVT-002",
      title: "Materiallieferung Beton",
      project: "Bürogebäude Berlin",
      projectId: "PRJ-2024-002",
      customer: "TechCorp GmbH",
      type: "delivery",
      date: new Date(2024, 2, 18, 8, 0),
      endDate: new Date(2024, 2, 18, 12, 0),
      location: "Alexanderplatz 5, Berlin",
      attendees: ["Bauleiter Müller"],
      assignedTeam: ["TM-002"],
      assignedEquipment: ["EQ-001", "EQ-003"],
      description: "Lieferung und Verarbeitung von 80m³ Beton",
      status: "confirmed",
      priority: "high",
      isMilestone: false,
      isRecurring: false,
      isMaster: false,
      isOccurrence: false,
      seriesId: null,
      masterId: null,
      recurrencePattern: undefined,
    },
    {
      id: "MIL-001",
      title: "Rohbau abgeschlossen",
      project: "Wohnhaus München",
      projectId: "PRJ-2024-001",
      customer: "Familie Müller",
      type: "milestone",
      date: new Date(2024, 2, 22, 17, 0),
      endDate: new Date(2024, 2, 22, 17, 0),
      location: "Musterstraße 12, München",
      attendees: ["Bauleiter Schmidt", "Architekt Weber"],
      assignedTeam: ["TM-001", "TM-003"],
      assignedEquipment: [],
      description: "Wichtiger Projektmeilenstein - Rohbau ist fertiggestellt",
      status: "pending",
      priority: "critical",
      isMilestone: true,
      isRecurring: false,
      isMaster: false,
      isOccurrence: false,
      seriesId: null,
      masterId: null,
      recurrencePattern: undefined,
    },
  ];

  const teamMembers = [
    {
      id: "TM-001",
      name: "Bauleiter Schmidt",
      role: "Bauleiter",
      color: "#3b82f6",
      availability: "busy",
      currentProject: "PRJ-2024-001",
      skills: ["Projektmanagement", "Bauüberwachung"],
      hourlyRate: 85,
    },
    {
      id: "TM-002",
      name: "Bauleiter Müller",
      role: "Bauleiter",
      color: "#10b981",
      availability: "available",
      currentProject: null,
      skills: ["Logistik", "Materialplanung"],
      hourlyRate: 80,
    },
    {
      id: "TM-003",
      name: "Architekt Weber",
      role: "Architekt",
      color: "#f59e0b",
      availability: "busy",
      currentProject: "PRJ-2024-001",
      skills: ["CAD", "Statik", "Bauplanung"],
      hourlyRate: 95,
    },
    {
      id: "TM-004",
      name: "Polier Hartmann",
      role: "Polier",
      color: "#ef4444",
      availability: "vacation",
      currentProject: null,
      skills: ["Bauausführung", "Qualitätskontrolle"],
      hourlyRate: 65,
    },
  ];

  const equipment = [
    {
      id: "EQ-001",
      name: "Baukran LIEBHERR 130 EC-B",
      type: "Turmdrehkran",
      category: "machinery",
      status: "in-use",
      location: "Baustelle München",
      assignedProject: "PRJ-2024-001",
      availability: "busy",
      nextMaintenance: "2024-07-15",
    },
    {
      id: "EQ-002",
      name: "Mercedes Sprinter",
      type: "Lieferwagen",
      category: "vehicle",
      status: "available",
      location: "Firmengelände",
      assignedProject: null,
      availability: "available",
      nextMaintenance: "2024-08-01",
    },
    {
      id: "EQ-003",
      name: "Betonmischer SCHWING",
      type: "Betonmischfahrzeug",
      category: "vehicle",
      status: "available",
      location: "Firmengelände",
      assignedProject: null,
      availability: "available",
      nextMaintenance: "2024-06-20",
    },
  ];

  // Combine mock events with stored appointments (including recurring)
  const allEvents = [
    ...events,
    ...convertStoredAppointmentsToEvents(recurringAppointments),
  ];

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

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case "available":
        return "text-green-600";
      case "busy":
        return "text-red-600";
      case "vacation":
        return "text-blue-600";
      case "sick":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  const getAvailabilityText = (availability: string) => {
    switch (availability) {
      case "available":
        return "Verfügbar";
      case "busy":
        return "Beschäftigt";
      case "vacation":
        return "Urlaub";
      case "sick":
        return "Krank";
      default:
        return "Unbekannt";
    }
  };

  const getEquipmentIcon = (category: string) => {
    switch (category) {
      case "vehicle":
        return <Truck className="h-4 w-4" />;
      case "machinery":
        return <Settings className="h-4 w-4" />;
      case "tool":
        return <Wrench className="h-4 w-4" />;
      case "safety":
        return <HardHat className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "site-visit":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "delivery":
        return "bg-green-100 text-green-800 border-green-200";
      case "meeting":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "milestone":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "internal":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Resource conflict detection
  const detectResourceConflicts = (targetDate: Date) => {
    const conflicts = [];
    const dayEvents = getEventsForDate(targetDate);

    // Check team member conflicts
    dayEvents.forEach((event1) => {
      dayEvents.forEach((event2) => {
        if (event1.id !== event2.id) {
          const hasTeamConflict = event1.assignedTeam?.some((tm) =>
            event2.assignedTeam?.includes(tm)
          );
          const hasEquipmentConflict = event1.assignedEquipment?.some((eq) =>
            event2.assignedEquipment?.includes(eq)
          );

          if (hasTeamConflict || hasEquipmentConflict) {
            conflicts.push({
              type: hasTeamConflict ? "team" : "equipment",
              events: [event1.id, event2.id],
              resource: hasTeamConflict
                ? event1.assignedTeam?.find((tm) =>
                    event2.assignedTeam?.includes(tm)
                  )
                : event1.assignedEquipment?.find((eq) =>
                    event2.assignedEquipment?.includes(eq)
                  ),
            });
          }
        }
      });
    });

    return conflicts;
  };

  const getEventTypeText = (type: string) => {
    switch (type) {
      case "site-visit":
        return "Baustellenbesuch";
      case "delivery":
        return "Lieferung";
      case "meeting":
        return "Besprechung";
      case "milestone":
        return "Meilenstein";
      case "internal":
        return "Intern";
      default:
        return "Sonstiges";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "text-green-600";
      case "pending":
        return "text-yellow-600";
      case "cancelled":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Bestätigt";
      case "pending":
        return "Ausstehend";
      case "cancelled":
        return "Abgesagt";
      default:
        return "Unbekannt";
    }
  };

  const getEventsForDate = (date: Date) => {
    return allEvents.filter((event) => isSameDay(event.date, date));
  };

  const handleCreateAppointment = async (
    appointmentData: AppointmentFormData
  ) => {
    try {
      if (editingAppointment) {
        // Check if this is a recurring appointment edit with a choice
        const editingAppointmentWithChoice =
          editingAppointment as StoredAppointment & {
            _recurrenceEditChoice?: RecurrenceEditChoice;
          };
        const recurrenceChoice =
          editingAppointmentWithChoice._recurrenceEditChoice;

        if (recurrenceChoice && isRecurringAppointment(editingAppointment)) {
          // Handle recurring appointment edit with user's choice
          await AppointmentService.editRecurringAppointment(
            editingAppointment,
            appointmentData,
            recurrenceChoice
          );

          showSuccess({
            title: "Serientermin aktualisiert",
            description:
              recurrenceChoice === "single"
                ? "Der einzelne Termin wurde aktualisiert."
                : recurrenceChoice === "series"
                ? "Alle Termine der Serie wurden aktualisiert."
                : "Dieser und alle zukünftigen Termine wurden aktualisiert.",
          });

          // Refresh the appointments list
          window.location.reload(); // Simple refresh - in a real app you'd invalidate queries
        } else {
          // Update regular appointment
          await updateAppointmentMutation.mutateAsync({
            id: editingAppointment.id,
            data: appointmentData,
          });

          showSuccess({
            title: "Termin aktualisiert",
            description: `Termin "${appointmentData.title}" wurde erfolgreich aktualisiert.`,
          });
        }

        setEditingAppointment(null);
      } else {
        // Create new appointment
        await createAppointmentMutation.mutateAsync(appointmentData);

        showSuccess({
          title: "Termin erstellt",
          description: `Termin "${appointmentData.title}" wurde erfolgreich erstellt.`,
        });
      }

      // Close the dialog
      setShowAppointmentDialog(false);
    } catch (error) {
      const appointmentError = AppointmentErrorHandler.handleError(
        error,
        editingAppointment ? "appointment-update" : "appointment-creation"
      );

      showError({
        title: "Fehler",
        description:
          AppointmentErrorHandler.getUserFriendlyMessage(appointmentError),
      });
    }
  };

  const handleEditAppointment = (appointment: StoredAppointment) => {
    // Check if this is a recurring appointment
    if (isRecurringAppointment(appointment)) {
      setRecurrenceAppointmentToEdit(appointment);
      setRecurrenceActionType("edit");
      setShowRecurrenceEditDialog(true);
    } else {
      setEditingAppointment(appointment);
      setShowAppointmentDialog(true);
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    const appointment =
      storedAppointments.find((app) => app.id === appointmentId) ||
      recurringAppointments.find((app) => app.id === appointmentId);

    if (!appointment) {
      const error = AppointmentErrorHandler.handleError(
        new Error("Termin nicht gefunden"),
        "appointment-deletion"
      );
      showError({
        title: "Fehler",
        description: AppointmentErrorHandler.getUserFriendlyMessage(error),
      });
      return;
    }

    // Check if this is a recurring appointment
    if (isRecurringAppointment(appointment)) {
      setRecurrenceAppointmentToEdit(appointment);
      setRecurrenceActionType("delete");
      setShowRecurrenceEditDialog(true);
    } else {
      // Handle regular appointment deletion
      if (!window.confirm("Möchten Sie diesen Termin wirklich löschen?")) {
        return;
      }

      try {
        await deleteAppointmentMutation.mutateAsync(appointmentId);

        showSuccess({
          title: "Termin gelöscht",
          description: "Der Termin wurde erfolgreich gelöscht.",
        });
      } catch (error) {
        const appointmentError = AppointmentErrorHandler.handleError(
          error,
          "appointment-deletion"
        );
        showError({
          title: "Fehler",
          description:
            AppointmentErrorHandler.getUserFriendlyMessage(appointmentError),
        });
      }
    }
  };

  const handleViewAppointment = (appointment: StoredAppointment) => {
    setViewingAppointment(appointment);
  };

  const handleCloseAppointmentDialog = () => {
    setShowAppointmentDialog(false);
    setEditingAppointment(null);
  };

  const handleRecurrenceEditConfirm = async (choice: RecurrenceEditChoice) => {
    if (!recurrenceAppointmentToEdit) return;

    try {
      if (recurrenceActionType === "edit") {
        // For editing, we need to show the appointment dialog with the chosen behavior
        setEditingAppointment(recurrenceAppointmentToEdit);

        // Store the choice for later use when saving
        const appointmentWithChoice =
          recurrenceAppointmentToEdit as StoredAppointment & {
            _recurrenceEditChoice?: RecurrenceEditChoice;
          };
        appointmentWithChoice._recurrenceEditChoice = choice;

        setShowAppointmentDialog(true);
        setShowRecurrenceEditDialog(false);
      } else if (recurrenceActionType === "delete") {
        // Handle deletion directly
        await AppointmentService.deleteRecurringAppointmentWithChoice(
          recurrenceAppointmentToEdit,
          choice
        );

        showSuccess({
          title: "Termin gelöscht",
          description:
            choice === "single"
              ? "Der einzelne Termin wurde gelöscht."
              : choice === "series"
              ? "Die gesamte Terminserie wurde gelöscht."
              : "Dieser und alle zukünftigen Termine wurden gelöscht.",
        });

        // Refresh the appointments list
        window.location.reload(); // Simple refresh - in a real app you'd invalidate queries
      }
    } catch (error) {
      console.error("Error handling recurrence action:", error);
      const appointmentError = AppointmentErrorHandler.handleError(
        error,
        "recurrence-action"
      );
      showError({
        title: "Fehler",
        description:
          AppointmentErrorHandler.getUserFriendlyMessage(appointmentError),
      });
    } finally {
      setRecurrenceAppointmentToEdit(null);
      setShowRecurrenceEditDialog(false);
    }
  };

  const handleRecurrenceEditCancel = () => {
    setShowRecurrenceEditDialog(false);
    setRecurrenceAppointmentToEdit(null);
  };

  const filteredEvents = allEvents.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.project &&
        event.project.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (event.customer &&
        event.customer.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesResource =
      selectedResource === "all" ||
      (event.assignedTeam && event.assignedTeam.includes(selectedResource)) ||
      (event.assignedEquipment &&
        event.assignedEquipment.includes(selectedResource));

    const matchesProject =
      selectedProject === "all" || event.projectId === selectedProject;

    return matchesSearch && matchesResource && matchesProject;
  });

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 gap-1 mb-4">
        {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
          >
            {day}
          </div>
        ))}

        {days.map((day) => {
          const dayEvents = getEventsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());
          const isSelected = selectedDate && isSameDay(day, selectedDate);

          return (
            <div
              key={day.toISOString()}
              className={`
                min-h-[100px] p-1 border border-gray-200 dark:border-gray-700 cursor-pointer
                ${
                  isCurrentMonth
                    ? "bg-white dark:bg-gray-800"
                    : "bg-gray-50 dark:bg-gray-900"
                }
                ${isToday ? "ring-2 ring-blue-500" : ""}
                ${isSelected ? "bg-blue-50 dark:bg-blue-900" : ""}
                hover:bg-gray-50 dark:hover:bg-gray-700
              `}
              onClick={() => setSelectedDate(day)}
            >
              <div
                className={`text-sm ${
                  isCurrentMonth
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-400"
                } ${isToday ? "font-bold" : ""}`}
              >
                {format(day, "d")}
              </div>
              <div className="space-y-1 mt-1">
                {dayEvents.slice(0, 2).map((event) => {
                  // Find the stored appointment for this event (check both regular and recurring)
                  const storedAppointment =
                    recurringAppointments.find((app) => app.id === event.id) ||
                    storedAppointments.find((app) => app.id === event.id);

                  return (
                    <div
                      key={event.id}
                      className={`
                        text-xs p-1 rounded border ${getEventTypeColor(
                          event.type
                        )} truncate cursor-pointer hover:opacity-80 transition-opacity
                        ${event.isRecurring ? "relative" : ""}
                      `}
                      title={`
                        ${event.title}
                        ${
                          event.isRecurring
                            ? event.isMaster
                              ? " (Serientermin)"
                              : " (Wiederholung)"
                            : ""
                        }
                        ${
                          event.recurrencePattern
                            ? " - " +
                              RecurrenceService.getRecurrenceDescription(
                                event.recurrencePattern
                              )
                            : ""
                        }
                        - Klicken für Details
                      `}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (storedAppointment) {
                          handleViewAppointment(storedAppointment);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">
                          {format(event.date, "HH:mm")} {event.title}
                        </span>
                        {event.isRecurring && (
                          <div title="Serientermin">
                            <RefreshCw className="h-3 w-3 ml-1 flex-shrink-0 opacity-70" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    +{dayEvents.length - 2} weitere
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <LayoutWithSidebar breadcrumbItems={breadcrumbItems}>
      <div className="space-y-6">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 dark:text-gray-300">
                Baustellentermine, Besprechungen & Meilensteine
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <OfflineIndicator />
              <SyncStatusIndicator showDetailed={false} />
              <Button
                variant="outline"
                onClick={() => setShowExportDialog(true)}
                disabled={storedAppointments.length === 0}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Exportieren</span>
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowAppointmentDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Neuer Termin
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Heutige Termine
              </CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getEventsForDate(new Date()).length}
              </div>
              <p className="text-xs text-muted-foreground">Termine heute</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Verfügbare Mitarbeiter
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  teamMembers.filter((tm) => tm.availability === "available")
                    .length
                }
              </div>
              <p className="text-xs text-green-600">
                {teamMembers.filter((tm) => tm.availability === "busy").length}{" "}
                beschäftigt
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Verfügbare Geräte
              </CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  equipment.filter((eq) => eq.availability === "available")
                    .length
                }
              </div>
              <p className="text-xs text-muted-foreground">
                {equipment.length} gesamt
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Meilensteine
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {allEvents.filter((e) => e.isMilestone).length}
              </div>
              <p className="text-xs text-purple-600">Projektmeilensteine</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Konflikte</CardTitle>
              <AlertIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {detectResourceConflicts(new Date()).length}
              </div>
              <p className="text-xs text-red-600">Ressourcenkonflikte</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Auslastung</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(
                  (teamMembers.filter((tm) => tm.availability === "busy")
                    .length /
                    teamMembers.length) *
                    100
                )}
                %
              </div>
              <p className="text-xs text-muted-foreground">Team-Auslastung</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="calendar">Kalender</TabsTrigger>
              <TabsTrigger value="list">Terminliste</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="resources">Ressourcen</TabsTrigger>
              <TabsTrigger value="milestones">Meilensteine</TabsTrigger>
            </TabsList>

            <div className="flex items-center space-x-4">
              {/* Add Appointment Button */}
              <Button
                onClick={() => setShowAppointmentDialog(true)}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Neuer Termin
              </Button>

              {activeTab === "calendar" && (
                <>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentDate(subDays(currentDate, 30))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentDate(new Date())}
                    >
                      Heute
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentDate(addDays(currentDate, 30))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-xl font-semibold text-gray-900 dark:text-white">
                    {format(currentDate, "MMMM yyyy", { locale: de })}
                  </div>
                </>
              )}

              {(activeTab === "list" || activeTab === "milestones") && (
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Termine suchen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select
                    value={selectedProject}
                    onValueChange={setSelectedProject}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Projekt filtern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Projekte</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(activeTab === "team" || activeTab === "resources") && (
                <div className="flex items-center space-x-2">
                  <Select
                    value={resourceFilter}
                    onValueChange={setResourceFilter}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle</SelectItem>
                      <SelectItem value="available">Verfügbar</SelectItem>
                      <SelectItem value="busy">Beschäftigt</SelectItem>
                      <SelectItem value="vacation">Urlaub</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <TabsContent value="calendar" className="space-y-6">
            <Card>
              <CardContent className="p-6">{renderMonthView()}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list" className="space-y-6">
            <div className="space-y-4">
              {filteredEvents.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Keine Termine gefunden
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredEvents.map((event) => {
                  const assignedTeamNames =
                    event.assignedTeam
                      ?.map(
                        (tmId) => teamMembers.find((tm) => tm.id === tmId)?.name
                      )
                      .filter(Boolean)
                      .join(", ") || "";

                  const assignedEquipmentNames =
                    event.assignedEquipment
                      ?.map(
                        (eqId) => equipment.find((eq) => eq.id === eqId)?.name
                      )
                      .filter(Boolean)
                      .join(", ") || "";

                  return (
                    <Card
                      key={event.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge className={getEventTypeColor(event.type)}>
                                {getEventTypeText(event.type)}
                              </Badge>
                              {event.isMilestone && (
                                <Badge className="bg-purple-100 text-purple-800">
                                  <Target className="h-3 w-3 mr-1" />
                                  Meilenstein
                                </Badge>
                              )}
                              {event.priority && (
                                <Badge
                                  className={getPriorityColor(event.priority)}
                                >
                                  {event.priority}
                                </Badge>
                              )}
                              <span
                                className={`text-sm ${getStatusColor(
                                  event.status
                                )}`}
                              >
                                {getStatusText(event.status)}
                              </span>
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                              {event.title}
                            </h4>
                            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {format(event.date, "dd.MM.yyyy HH:mm", {
                                    locale: de,
                                  })}{" "}
                                  - {format(event.endDate, "HH:mm")}
                                </span>
                              </div>
                              {event.project && (
                                <div className="flex items-center space-x-2">
                                  <Building className="h-4 w-4" />
                                  <span>{event.project}</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4" />
                                <span>{event.location}</span>
                              </div>
                              {assignedTeamNames && (
                                <div className="flex items-center space-x-2">
                                  <UserCheck className="h-4 w-4" />
                                  <span>Team: {assignedTeamNames}</span>
                                </div>
                              )}
                              {assignedEquipmentNames && (
                                <div className="flex items-center space-x-2">
                                  <Settings className="h-4 w-4" />
                                  <span>Geräte: {assignedEquipmentNames}</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-2">
                                <Users className="h-4 w-4" />
                                <span>{event.attendees.join(", ")}</span>
                              </div>
                            </div>
                            {event.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teamMembers
                .filter(
                  (member) =>
                    resourceFilter === "all" ||
                    member.availability === resourceFilter
                )
                .map((member) => {
                  const memberEvents = events.filter((e) =>
                    e.assignedTeam?.includes(member.id)
                  );
                  return (
                    <Card
                      key={member.id}
                      className="hover:shadow-lg transition-shadow"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-medium"
                              style={{ backgroundColor: member.color }}
                            >
                              {member.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {member.name}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {member.role}
                              </p>
                            </div>
                          </div>
                          <Badge
                            className={`${getAvailabilityColor(
                              member.availability
                            )} bg-opacity-10`}
                          >
                            {getAvailabilityText(member.availability)}
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium mb-1">
                              Fähigkeiten
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {member.skills.map((skill, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span>Stundensatz:</span>
                            <span className="font-medium">
                              €{member.hourlyRate}/h
                            </span>
                          </div>

                          {member.currentProject && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">
                                Aktuelles Projekt:
                              </span>
                              <p className="font-medium">
                                {
                                  projects.find(
                                    (p) => p.id === member.currentProject
                                  )?.name
                                }
                              </p>
                            </div>
                          )}

                          <div className="text-sm">
                            <span className="text-muted-foreground">
                              Termine heute:
                            </span>
                            <span className="font-medium ml-2">
                              {
                                memberEvents.filter((e) =>
                                  isSameDay(e.date, new Date())
                                ).length
                              }
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Equipment Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-blue-600" />
                    <span>Geräte & Ausrüstung</span>
                  </CardTitle>
                  <CardDescription>
                    Aktuelle Verfügbarkeit und Zuteilung
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {equipment.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-white">
                            {getEquipmentIcon(item.category)}
                          </div>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.type}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            className={getAvailabilityColor(item.availability)}
                          >
                            {getAvailabilityText(item.availability)}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.location}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Resource Allocation Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CalIcon className="h-5 w-5 text-green-600" />
                    <span>Ressourcen-Timeline</span>
                  </CardTitle>
                  <CardDescription>
                    Nächste 7 Tage Ressourcenplanung
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.from({ length: 7 }, (_, i) => {
                      const date = addDays(new Date(), i);
                      const dayEvents = getEventsForDate(date);
                      const conflicts = detectResourceConflicts(date);

                      return (
                        <div key={i} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">
                              {format(date, "EEE, dd.MM", { locale: de })}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-muted-foreground">
                                {dayEvents.length} Termine
                              </span>
                              {conflicts.length > 0 && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  {conflicts.length} Konflikte
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="text-sm space-y-1">
                            {dayEvents.slice(0, 2).map((event) => (
                              <div
                                key={event.id}
                                className="flex items-center justify-between"
                              >
                                <span className="truncate">{event.title}</span>
                                <span className="text-muted-foreground">
                                  {format(event.date, "HH:mm")}
                                </span>
                              </div>
                            ))}
                            {dayEvents.length > 2 && (
                              <div className="text-muted-foreground text-xs">
                                +{dayEvents.length - 2} weitere
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="milestones" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  <span>Projekt-Meilensteine</span>
                </CardTitle>
                <CardDescription>
                  Wichtige Projekttermine und -ziele
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {events
                    .filter(
                      (event) =>
                        event.isMilestone &&
                        (selectedProject === "all" ||
                          event.projectId === selectedProject)
                    )
                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                    .map((milestone) => {
                      const project = projects.find(
                        (p) => p.id === milestone.projectId
                      );
                      const isOverdue =
                        isBefore(milestone.date, new Date()) &&
                        milestone.status !== "confirmed";

                      return (
                        <Card
                          key={milestone.id}
                          className={`border-l-4 ${
                            milestone.priority === "critical"
                              ? "border-l-red-500"
                              : milestone.priority === "high"
                              ? "border-l-orange-500"
                              : "border-l-purple-500"
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-semibold">
                                    {milestone.title}
                                  </h4>
                                  <Badge
                                    className={getPriorityColor(
                                      milestone.priority!
                                    )}
                                  >
                                    {milestone.priority}
                                  </Badge>
                                  {isOverdue && (
                                    <Badge variant="destructive">Overdue</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {project?.name} • {milestone.customer}
                                </p>
                                <p className="text-sm">
                                  {milestone.description}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">
                                  {format(milestone.date, "dd.MM.yyyy", {
                                    locale: de,
                                  })}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(milestone.date, "HH:mm")}
                                </p>
                              </div>
                            </div>

                            {project && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span>Projektfortschritt:</span>
                                  <span className="font-medium">
                                    {project.progress}%
                                  </span>
                                </div>
                                <Progress
                                  value={project.progress}
                                  className="h-2"
                                />
                              </div>
                            )}

                            <div className="flex items-center justify-between mt-3 pt-3 border-t">
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>
                                  {milestone.assignedTeam?.length || 0}{" "}
                                  Mitarbeiter
                                </span>
                              </div>
                              <Badge
                                className={getStatusColor(milestone.status)}
                              >
                                {getStatusText(milestone.status)}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>

                {events.filter((e) => e.isMilestone).length === 0 && (
                  <div className="text-center py-12">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Keine Meilensteine gefunden
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Appointment Dialog */}
        <AppointmentDialog
          isOpen={showAppointmentDialog}
          onClose={handleCloseAppointmentDialog}
          onSave={handleCreateAppointment}
          projects={projects.map((p) => ({
            id: p.id,
            name: p.name,
            customer: p.customer,
            status: p.status,
          }))}
          selectedDate={selectedDate}
          editingAppointment={editingAppointment}
        />

        {/* Appointment View Dialog */}
        <AppointmentViewDialog
          appointment={viewingAppointment}
          isOpen={!!viewingAppointment}
          onClose={() => setViewingAppointment(null)}
          onEdit={handleEditAppointment}
          onDelete={handleDeleteAppointment}
        />

        {/* Export Dialog */}
        <AppointmentExportDialog
          isOpen={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          appointments={storedAppointments}
          title="Terminübersicht - Bauplan Buddy"
        />

        {/* Recurrence Edit Dialog */}
        <RecurrenceEditDialog
          isOpen={showRecurrenceEditDialog}
          onClose={handleRecurrenceEditCancel}
          onConfirm={handleRecurrenceEditConfirm}
          appointment={recurrenceAppointmentToEdit}
          action={recurrenceActionType}
        />
      </div>
    </LayoutWithSidebar>
  );
};

export default CalendarSimple;
