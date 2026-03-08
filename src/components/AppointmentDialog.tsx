import { useState } from "react";
import * as React from "react";
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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiWindowDialog } from "@/components/ui/dialog";
import { DialogFrame } from "@/components/ui/dialog-frame";
import {
  CalendarIcon,
  Clock,
  Users,
  MapPin,
  Building,
  AlertTriangle,
  CheckCircle,
  Plus,
  X,
  Loader2,
  Mail,
  Send,
  UserPlus,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { de } from "date-fns/locale";
import { StoredAppointment } from "@/services/appointmentService";
import {
  ConflictDetectionService,
  ConflictAnalysis,
} from "@/services/conflictDetectionService";
import {
  AlternativeTimeService,
  AlternativeTimeSlot,
} from "@/services/alternativeTimeService";
import ConflictVisualization from "@/components/ConflictVisualization";
import {
  useCreateAppointment,
  useUpdateAppointment,
  useConflictCheck,
  useAppointments,
} from "@/hooks/useAppointments";
import { AppointmentErrorHandler } from "@/utils/errorHandling";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import SyncStatusIndicator from "@/components/SyncStatusIndicator";
import { toast } from "@/hooks/use-toast";
import {
  RecurrencePattern,
  RecurrenceService,
} from "@/services/recurrenceService";
import RecurrenceOptions from "@/components/RecurrenceOptions";
import { emailService } from "@/services/emailService";
import { EmailRecipient, EmailValidationResult } from "@/types/email";
import { DraftService } from "@/services/draftService";
import { getEnvVar } from "@/utils/env";

const USE_API_CONFLICTS = getEnvVar("VITE_USE_API", "false") === "true";

export interface AppointmentFormData {
  title: string;
  description: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  projectId: string;
  attendees: string[];
  teamMembers: string[];
  equipment: string[];
  priority: string;
  customerNotification: boolean;
  reminderTime: string;
  // Recurrence support
  recurrencePattern?: RecurrencePattern;
  isRecurring?: boolean;
  // Email notification settings
  emailNotifications: {
    enabled: boolean;
    sendInvitations: boolean;
    sendReminders: boolean;
    recipients: EmailRecipient[];
    customMessage?: string;
  };
}

interface Project {
  id: string;
  name: string;
  customer: string;
  status: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  availability: string;
}

interface Equipment {
  id: string;
  name: string;
  type: string;
  availability: string;
}

interface AppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: AppointmentFormData) => void;
  projects?: Project[];
  teamMembers?: TeamMember[];
  equipment?: Equipment[];
  selectedDate?: Date;
  selectedProject?: string;
  editingAppointment?: StoredAppointment | null;
}

const AppointmentDialog = ({
  isOpen,
  onClose,
  onSave,
  projects = [],
  teamMembers = [],
  equipment = [],
  selectedDate,
  selectedProject,
  editingAppointment,
}: AppointmentDialogProps) => {
  const [formData, setFormData] = useState<AppointmentFormData>({
    title: "",
    description: "",
    type: "site-visit",
    date: selectedDate
      ? format(selectedDate, "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd"),
    startTime: "09:00",
    endTime: "10:00",
    location: "",
    projectId: selectedProject || "no-project",
    attendees: [],
    teamMembers: [],
    equipment: [],
    priority: "medium",
    customerNotification: true,
    reminderTime: "15",
    recurrencePattern: RecurrenceService.createDefaultPattern(),
    isRecurring: false,
    emailNotifications: {
      enabled: false,
      sendInvitations: true,
      sendReminders: true,
      recipients: [],
      customMessage: "",
    },
  });

  const DRAFT_KEY = `bauplan.draft.appointmentDialog.${
    editingAppointment?.id ?? "new"
  }`;
  const [history, setHistory] = useState<AppointmentFormData[]>([]);
  const [redoStack, setRedoStack] = useState<AppointmentFormData[]>([]);

  const [errors, setErrors] = useState<Partial<AppointmentFormData>>({});
  const [newAttendee, setNewAttendee] = useState("");
  const [newEmailRecipient, setNewEmailRecipient] = useState("");
  const [emailValidation, setEmailValidation] = useState<
    Record<string, EmailValidationResult>
  >({});
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  const [conflictAnalysis, setConflictAnalysis] = useState<ConflictAnalysis>({
    hasConflicts: false,
    conflicts: [],
    warnings: [],
    suggestions: [],
  });
  const [alternativeTimeSlots, setAlternativeTimeSlots] = useState<
    AlternativeTimeSlot[]
  >([]);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showConflicts, setShowConflicts] = useState(false);
  const [currentError, setCurrentError] = useState<{
    message: string;
    type: string;
    retry?: () => void;
  } | null>(null);

  // API hooks
  const createAppointmentMutation = useCreateAppointment();
  const updateAppointmentMutation = useUpdateAppointment();
  const conflictCheckMutation = useConflictCheck();
  const { data: allAppointments = [] } = useAppointments();

  // Mock data if none provided
  const defaultProjects: Project[] = [
    {
      id: "PRJ-2024-001",
      name: "Wohnhaus Familie Müller",
      customer: "Familie Müller",
      status: "active",
    },
    {
      id: "PRJ-2024-002",
      name: "Bürogebäude TechCorp",
      customer: "TechCorp GmbH",
      status: "active",
    },
    {
      id: "PRJ-2024-003",
      name: "Dachsanierung Hamburg",
      customer: "Hausverwaltung Nord",
      status: "planning",
    },
  ];

  const defaultTeamMembers: TeamMember[] = [
    {
      id: "TM-001",
      name: "Bauleiter Schmidt",
      role: "Bauleiter",
      availability: "available",
    },
    {
      id: "TM-002",
      name: "Architekt Weber",
      role: "Architekt",
      availability: "busy",
    },
    {
      id: "TM-003",
      name: "Polier Hartmann",
      role: "Polier",
      availability: "available",
    },
  ];

  const defaultEquipment: Equipment[] = [
    {
      id: "EQ-001",
      name: "Baukran LIEBHERR",
      type: "Turmdrehkran",
      availability: "available",
    },
    {
      id: "EQ-002",
      name: "Mercedes Sprinter",
      type: "Lieferwagen",
      availability: "available",
    },
    {
      id: "EQ-003",
      name: "Betonmischer",
      type: "Betonmischfahrzeug",
      availability: "busy",
    },
  ];

  const projectList = projects.length > 0 ? projects : defaultProjects;
  const teamList = teamMembers.length > 0 ? teamMembers : defaultTeamMembers;
  const equipmentList = equipment.length > 0 ? equipment : defaultEquipment;

  // Update form when selectedProject changes
  const selectedProjectData = projectList.find((p) => p.id === selectedProject);

  // Auto-fill project context when a project is selected
  React.useEffect(() => {
    if (selectedProject && selectedProjectData) {
      setFormData((prev) => ({
        ...prev,
        projectId: selectedProject,
        title: prev.title || `Termin für ${selectedProjectData.name}`,
        location: prev.location || `Baustelle ${selectedProjectData.name}`,
        attendees:
          prev.attendees.length === 0
            ? [selectedProjectData.customer]
            : prev.attendees,
      }));
    }
  }, [selectedProject, selectedProjectData]);

  React.useEffect(() => {
    if (!isOpen) return;
    const loadDraft = async () => {
      const draft = await DraftService.load<AppointmentFormData>(DRAFT_KEY);
      if (draft) {
        setFormData(draft);
        setHistory([draft]);
      }
    };
    loadDraft();
  }, [isOpen, DRAFT_KEY, editingAppointment?.id]);

  React.useEffect(() => {
    DraftService.save(DRAFT_KEY, formData);
    setHistory((prev) => {
      const last = prev[prev.length - 1];
      if (last && JSON.stringify(last) === JSON.stringify(formData))
        return prev;
      const next = [...prev, formData];
      return next.length > 50 ? next.slice(next.length - 50) : next;
    });
    setRedoStack([]);
  }, [formData, DRAFT_KEY]);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      if (!isCtrl) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        if (history.length > 1) {
          e.preventDefault();
          const prevSnapshot = history[history.length - 2]!;
          setRedoStack((rs) => [history[history.length - 1]!, ...rs]);
          setHistory((h) => h.slice(0, h.length - 1));
          setFormData(prevSnapshot);
        }
      } else if (key === "y" || (key === "z" && e.shiftKey)) {
        if (redoStack.length > 0) {
          e.preventDefault();
          const nextSnapshot = redoStack[0]!;
          setRedoStack((rs) => rs.slice(1));
          setHistory((h) => [...h, nextSnapshot]);
          setFormData(nextSnapshot);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [history, redoStack]);

  // Enhanced conflict detection with API integration
  React.useEffect(() => {
    const checkConflicts = async () => {
      if (!formData.date || !formData.startTime || !formData.endTime) {
        setConflictAnalysis({
          hasConflicts: false,
          conflicts: [],
          warnings: [],
          suggestions: [],
        });
        return;
      }

      try {
        // Use API-based conflict checking when available
        if (USE_API_CONFLICTS && navigator.onLine) {
          const conflictData = {
            date: formData.date,
            startTime: formData.startTime,
            endTime: formData.endTime,
            teamMembers: formData.teamMembers,
            equipment: formData.equipment,
            excludeAppointmentId: editingAppointment?.id,
          };

          const apiResult = await conflictCheckMutation.mutateAsync(
            conflictData
          );

          // Convert API response to our ConflictAnalysis format
          const analysis: ConflictAnalysis = {
            hasConflicts: apiResult.hasConflicts,
            conflicts: apiResult.conflicts.map((c) => ({
              type: c.type,
              resource: c.resourceId,
              resourceId: c.resourceId,
              severity: "error" as const,
              message: `Konflikt mit ${
                c.type === "team" ? "Teammitglied" : "Ausrüstung"
              } ${c.resourceId}`,
              conflictingAppointment: c.conflictingAppointment,
            })),
            warnings: [],
            suggestions: Array.isArray(apiResult.suggestions)
              ? apiResult.suggestions.map((s) =>
                  typeof s === "string"
                    ? s
                    : `${s.date} ${s.startTime}-${s.endTime}`
                )
              : [],
          };

          setConflictAnalysis(analysis);
          setShowConflicts(
            analysis.hasConflicts || analysis.warnings.length > 0
          );
        } else {
          // Fall back to local conflict detection when offline
          const conflictData = {
            date: formData.date,
            startTime: formData.startTime,
            endTime: formData.endTime,
            teamMembers: formData.teamMembers,
            equipment: formData.equipment,
            excludeAppointmentId: editingAppointment?.id,
          };
          const analysis = ConflictDetectionService.detectConflicts(
            conflictData,
            allAppointments,
            {
              excludeAppointmentId: editingAppointment?.id,
              bufferMinutes: 15,
              checkTeamMembers: true,
              checkEquipment: true,
            }
          );
          setConflictAnalysis(analysis);
          setShowConflicts(
            analysis.hasConflicts || analysis.warnings.length > 0
          );
        }
      } catch (error) {
        const appointmentError = AppointmentErrorHandler.handleError(
          error,
          "conflict-detection"
        );
        setCurrentError(appointmentError);

        // Fall back to local conflict detection on API error
        const conflictData = {
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          teamMembers: formData.teamMembers,
          equipment: formData.equipment,
          excludeAppointmentId: editingAppointment?.id,
        };
        const analysis = ConflictDetectionService.detectConflicts(
          conflictData,
          allAppointments,
          {
            excludeAppointmentId: editingAppointment?.id,
            bufferMinutes: 15,
            checkTeamMembers: true,
            checkEquipment: true,
          }
        );
        setConflictAnalysis(analysis);
        setShowConflicts(analysis.hasConflicts || analysis.warnings.length > 0);
      }
    };

    // Debounce conflict checking to avoid excessive calls
    const timeoutId = setTimeout(checkConflicts, 500);
    return () => clearTimeout(timeoutId);
  }, [
    formData.date,
    formData.startTime,
    formData.endTime,
    formData.teamMembers,
    formData.equipment,
    formData.type,
    formData.location,
    editingAppointment?.id,
    conflictCheckMutation,
    allAppointments,
  ]);

  const appointmentTypes = [
    { value: "site-visit", label: "Baustellenbesichtigung", icon: Building },
    { value: "meeting", label: "Besprechung", icon: Users },
    { value: "delivery", label: "Lieferung", icon: MapPin },
    { value: "milestone", label: "Meilenstein", icon: CheckCircle },
    { value: "inspection", label: "Inspektion", icon: AlertTriangle },
    { value: "internal", label: "Intern", icon: Clock },
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<AppointmentFormData> = {};

    if (!formData.title.trim()) newErrors.title = "Titel ist erforderlich";
    if (!formData.date) newErrors.date = "Datum ist erforderlich";
    if (!formData.startTime) newErrors.startTime = "Startzeit ist erforderlich";
    if (!formData.endTime) newErrors.endTime = "Endzeit ist erforderlich";

    // Validate time range
    if (
      formData.startTime &&
      formData.endTime &&
      formData.startTime >= formData.endTime
    ) {
      newErrors.endTime = "Endzeit muss nach der Startzeit liegen";
    }

    setErrors(newErrors);

    // Check for conflicts
    if (conflictAnalysis.hasConflicts) {
      return false;
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setCurrentError(null);

    try {
      let savedAppointment: StoredAppointment;

      if (editingAppointment) {
        // Update existing appointment
        await updateAppointmentMutation.mutateAsync({
          id: editingAppointment.id,
          data: formData,
        });

        savedAppointment = { ...editingAppointment, ...formData };

        toast({
          title: "Termin aktualisiert",
          description: "Der Termin wurde erfolgreich aktualisiert.",
        });

        // Send update notifications if enabled
        if (
          formData.emailNotifications.enabled &&
          formData.emailNotifications.sendInvitations
        ) {
          await sendEmailNotifications(savedAppointment, "update");
        }
      } else {
        // Create new appointment
        const newAppointment = await createAppointmentMutation.mutateAsync(
          formData
        );
        savedAppointment = newAppointment;

        toast({
          title: "Termin erstellt",
          description: "Der neue Termin wurde erfolgreich erstellt.",
        });

        // Send invitation notifications if enabled
        if (
          formData.emailNotifications.enabled &&
          formData.emailNotifications.sendInvitations
        ) {
          await sendEmailNotifications(savedAppointment, "invitation");
        }
      }

      // Call the parent's onSave callback for UI updates
      onSave(formData);
      DraftService.clear(DRAFT_KEY);
      onClose();

      // Reset form
      resetForm();
    } catch (error) {
      const appointmentError = AppointmentErrorHandler.handleError(
        error,
        editingAppointment ? "appointment-update" : "appointment-creation"
      );
      setCurrentError(appointmentError);

      toast({
        variant: "destructive",
        title: "Fehler beim Speichern",
        description:
          AppointmentErrorHandler.getUserFriendlyMessage(appointmentError),
      });
    }
  };

  const sendEmailNotifications = async (
    appointment: StoredAppointment,
    type: "invitation" | "update" | "cancellation"
  ) => {
    if (
      !formData.emailNotifications.enabled ||
      formData.emailNotifications.recipients.length === 0
    ) {
      return;
    }

    try {
      switch (type) {
        case "invitation":
          await emailService.sendAppointmentInvitation(
            appointment,
            formData.emailNotifications.recipients
          );
          toast({
            title: "E-Mail-Einladungen versendet",
            description: `Einladungen an ${formData.emailNotifications.recipients.length} Empfänger gesendet.`,
          });
          break;
        case "update": {
          const changes = ["Termin wurde aktualisiert"]; // Could be more specific
          await emailService.sendAppointmentUpdate(
            appointment,
            formData.emailNotifications.recipients,
            changes
          );
          toast({
            title: "Update-Benachrichtigungen versendet",
            description: `Aktualisierungen an ${formData.emailNotifications.recipients.length} Empfänger gesendet.`,
          });
          break;
        }
        case "cancellation":
          await emailService.sendAppointmentCancellation(
            appointment,
            formData.emailNotifications.recipients
          );
          break;
      }
    } catch (error) {
      console.error("Failed to send email notifications:", error);
      toast({
        variant: "destructive",
        title: "E-Mail-Versand fehlgeschlagen",
        description:
          "Die E-Mail-Benachrichtigungen konnten nicht versendet werden.",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "site-visit",
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: "09:00",
      endTime: "10:00",
      location: "",
      projectId: "no-project",
      attendees: [],
      teamMembers: [],
      equipment: [],
      priority: "medium",
      customerNotification: true,
      reminderTime: "15",
      emailNotifications: {
        enabled: false,
        sendInvitations: true,
        sendReminders: true,
        recipients: [],
        customMessage: "",
      },
    });
  };

  const addAttendee = () => {
    if (
      newAttendee.trim() &&
      !formData.attendees.includes(newAttendee.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        attendees: [...prev.attendees, newAttendee.trim()],
      }));
      setNewAttendee("");
    }
  };

  const removeAttendee = (attendee: string) => {
    setFormData((prev) => ({
      ...prev,
      attendees: prev.attendees.filter((a) => a !== attendee),
    }));
  };
  // Email recipient management
  const validateEmail = async (email: string): Promise<boolean> => {
    setIsValidatingEmail(true);
    try {
      const validation = await emailService.validateEmail(email);
      setEmailValidation((prev) => ({ ...prev, [email]: validation }));
      return validation.isValid;
    } catch (error) {
      console.error("Email validation failed:", error);
      return false;
    } finally {
      setIsValidatingEmail(false);
    }
  };

  const addEmailRecipient = async () => {
    const email = newEmailRecipient.trim();
    if (!email) return;

    const isValid = await validateEmail(email);
    if (!isValid) {
      toast({
        variant: "destructive",
        title: "Ungültige E-Mail-Adresse",
        description: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
      });
      return;
    }

    const recipientExists = formData.emailNotifications.recipients.some(
      (r) => r.email === email
    );
    if (recipientExists) {
      toast({
        variant: "destructive",
        title: "E-Mail bereits hinzugefügt",
        description: "Diese E-Mail-Adresse ist bereits in der Liste.",
      });
      return;
    }

    const newRecipient: EmailRecipient = {
      email,
      name: email.split("@")[0], // Use part before @ as default name
      type: "to",
      role: "attendee",
    };

    setFormData((prev) => ({
      ...prev,
      emailNotifications: {
        ...prev.emailNotifications,
        recipients: [...prev.emailNotifications.recipients, newRecipient],
      },
    }));
    setNewEmailRecipient("");
  };

  const removeEmailRecipient = (email: string) => {
    setFormData((prev) => ({
      ...prev,
      emailNotifications: {
        ...prev.emailNotifications,
        recipients: prev.emailNotifications.recipients.filter(
          (r) => r.email !== email
        ),
      },
    }));
  };

  const updateEmailRecipientType = (
    email: string,
    type: "to" | "cc" | "bcc"
  ) => {
    setFormData((prev) => ({
      ...prev,
      emailNotifications: {
        ...prev.emailNotifications,
        recipients: prev.emailNotifications.recipients.map((r) =>
          r.email === email ? { ...r, type } : r
        ),
      },
    }));
  };

  const toggleEmailNotifications = (enabled: boolean) => {
    setFormData((prev) => ({
      ...prev,
      emailNotifications: {
        ...prev.emailNotifications,
        enabled,
      },
    }));
  };

  const updateEmailSetting = (
    key: keyof typeof formData.emailNotifications,
    value: boolean | string
  ) => {
    setFormData((prev) => ({
      ...prev,
      emailNotifications: {
        ...prev.emailNotifications,
        [key]: value,
      },
    }));
  };

  const toggleTeamMember = (memberId: string) => {
    setFormData((prev) => ({
      ...prev,
      teamMembers: (prev.teamMembers || []).includes(memberId)
        ? (prev.teamMembers || []).filter((id) => id !== memberId)
        : [...(prev.teamMembers || []), memberId],
    }));
  };

  const toggleEquipment = (equipmentId: string) => {
    setFormData((prev) => ({
      ...prev,
      equipment: (prev.equipment || []).includes(equipmentId)
        ? (prev.equipment || []).filter((id) => id !== equipmentId)
        : [...(prev.equipment || []), equipmentId],
    }));
  };

  return (
    <MultiWindowDialog open={isOpen} onOpenChange={onClose}>
      <DialogFrame
        title={
          <span className="flex items-center gap-2">
            {editingAppointment ? (
              <CalendarIcon className="h-5 w-5" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
            {editingAppointment ? "Termin bearbeiten" : "Neuer Termin"}
          </span>
        }
        description={
          editingAppointment
            ? "Passen Sie die Details für den bestehenden Termin an."
            : "Planen Sie einen neuen Termin und weisen Sie Ressourcen zu."
        }
        width="max-w-4xl"
        modal={false}
        onClose={onClose}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                createAppointmentMutation.isPending ||
                updateAppointmentMutation.isPending
              }
            >
              {(createAppointmentMutation.isPending ||
                updateAppointmentMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingAppointment ? "Änderungen speichern" : "Termin erstellen"}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Main Appointment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titel</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="z.B. Baustellenbesichtigung Müller"
                  className={errors.title ? "border-red-500" : ""}
                />
                {errors.title && (
                  <p className="text-xs text-red-500">{errors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Termintyp</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Typ wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {appointmentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Datum</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className={errors.date ? "border-red-500" : ""}
                  />
                  {errors.date && (
                    <p className="text-xs text-red-500">{errors.date}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priorität</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Niedrig</SelectItem>
                      <SelectItem value="medium">Mittel</SelectItem>
                      <SelectItem value="high">Hoch</SelectItem>
                      <SelectItem value="critical">Kritisch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Von</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    className={errors.startTime ? "border-red-500" : ""}
                  />
                  {errors.startTime && (
                    <p className="text-xs text-red-500">{errors.startTime}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">Bis</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    className={errors.endTime ? "border-red-500" : ""}
                  />
                  {errors.endTime && (
                    <p className="text-xs text-red-500">{errors.endTime}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project">Projekt</Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, projectId: value })
                  }
                >
                  <SelectTrigger id="project">
                    <SelectValue placeholder="Projekt zuordnen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-project">Kein Projekt</SelectItem>
                    {projectList.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Ort / Baustelle</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="Einsatzort eingeben"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung / Notizen</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Zusätzliche Informationen zum Termin..."
                  rows={4}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Resources & Team */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" /> Teammitglieder
                </Label>
              </div>
              <div className="grid grid-cols-1 gap-2 border rounded-md p-3 h-[180px] overflow-y-auto">
                {teamList.map((member) => (
                  <div key={member.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`member-${member.id}`}
                      checked={formData.teamMembers.includes(member.id)}
                      onCheckedChange={() => toggleTeamMember(member.id)}
                    />
                    <Label
                      htmlFor={`member-${member.id}`}
                      className="text-sm font-normal flex items-center justify-between w-full"
                    >
                      <span>{member.name}</span>
                      <Badge variant="outline" className="text-[10px] h-4">
                        {member.role}
                      </Badge>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Building className="h-4 w-4" /> Ausrüstung / Fahrzeuge
                </Label>
              </div>
              <div className="grid grid-cols-1 gap-2 border rounded-md p-3 h-[180px] overflow-y-auto">
                {equipmentList.map((eq) => (
                  <div key={eq.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`eq-${eq.id}`}
                      checked={formData.equipment.includes(eq.id)}
                      onCheckedChange={() => toggleEquipment(eq.id)}
                    />
                    <Label
                      htmlFor={`eq-${eq.id}`}
                      className="text-sm font-normal flex items-center justify-between w-full"
                    >
                      <span>{eq.name}</span>
                      <Badge variant="outline" className="text-[10px] h-4">
                        {eq.type}
                      </Badge>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">Teilnehmer</Label>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <UserPlus className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Teilnehmer hinzufügen..."
                    value={newAttendee}
                    onChange={(e) => setNewAttendee(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addAttendee();
                      }
                    }}
                    className="pl-9"
                  />
                </div>
                <Button type="button" variant="secondary" onClick={addAttendee}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-muted/20">
                {formData.attendees.length === 0 && (
                  <span className="text-sm text-muted-foreground">
                    Keine Teilnehmer hinzugefügt
                  </span>
                )}
                {formData.attendees.map((attendee) => (
                  <Badge
                    key={attendee}
                    variant="secondary"
                    className="flex items-center gap-1 pl-2 pr-1"
                  >
                    {attendee}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 rounded-full hover:bg-muted"
                      onClick={() => removeAttendee(attendee)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Optionen</Label>
              </div>
              <div className="space-y-3 p-4 border rounded-md">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notify">Kunden benachrichtigen</Label>
                    <p className="text-[10px] text-muted-foreground">
                      Bestätigungs-Email senden
                    </p>
                  </div>
                  <Switch
                    id="notify"
                    checked={formData.customerNotification}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        customerNotification: checked,
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="reminder">Erinnerung</Label>
                    <p className="text-[10px] text-muted-foreground">
                      Vorlaufzeit in Minuten
                    </p>
                  </div>
                  <Select
                    value={formData.reminderTime}
                    onValueChange={(value) =>
                      setFormData({ ...formData, reminderTime: value })
                    }
                  >
                    <SelectTrigger className="w-[100px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Keine</SelectItem>
                      <SelectItem value="15">15 Min.</SelectItem>
                      <SelectItem value="30">30 Min.</SelectItem>
                      <SelectItem value="60">1 Std.</SelectItem>
                      <SelectItem value="1440">1 Tag</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Recurrence Options */}
          <div className="col-span-full">
            <RecurrenceOptions
              enabled={formData.isRecurring || false}
              pattern={formData.recurrencePattern!}
              onEnabledChange={(enabled) =>
                setFormData((prev) => ({ ...prev, isRecurring: enabled }))
              }
              onPatternChange={(pattern) =>
                setFormData((prev) => ({ ...prev, recurrencePattern: pattern }))
              }
            />
          </div>

          {/* Email Notifications & Invitations */}
          <div className="col-span-full space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-medium">E-Mail-Einladungen</h3>
              </div>
              <Switch
                checked={formData.emailNotifications.enabled}
                onCheckedChange={toggleEmailNotifications}
              />
            </div>

            {formData.emailNotifications.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="md:col-span-2 space-y-4">
                  <div className="space-y-2">
                    <Label>Empfänger hinzufügen (E-Mail)</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="email@beispiel.de"
                          value={newEmailRecipient}
                          onChange={(e) => setNewEmailRecipient(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addEmailRecipient();
                            }
                          }}
                          className="pl-9"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={addEmailRecipient}
                        disabled={isValidatingEmail}
                      >
                        {isValidatingEmail ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Check & Add"
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Empfängerliste</Label>
                    <div className="border rounded-md divide-y max-h-[200px] overflow-y-auto">
                      {formData.emailNotifications.recipients.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground italic">
                          Noch keine Empfänger hinzugefügt
                        </div>
                      ) : (
                        formData.emailNotifications.recipients.map(
                          (recipient) => (
                            <div
                              key={recipient.email}
                              className="p-3 flex items-center justify-between group bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xs">
                                  {recipient.name?.charAt(0).toUpperCase() ||
                                    recipient.email.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="text-sm font-medium">
                                    {recipient.name || recipient.email}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {recipient.email}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Select
                                  value={recipient.type}
                                  onValueChange={(
                                    value: "to" | "cc" | "bcc"
                                  ) =>
                                    updateEmailRecipientType(
                                      recipient.email,
                                      value
                                    )
                                  }
                                >
                                  <SelectTrigger className="h-8 w-[70px] text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="to">An</SelectItem>
                                    <SelectItem value="cc">CC</SelectItem>
                                    <SelectItem value="bcc">BCC</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() =>
                                    removeEmailRecipient(recipient.email)
                                  }
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border space-y-3">
                    <Label className="text-sm font-bold">Einstellungen</Label>
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="send-invites"
                        className="text-xs font-normal"
                      >
                        Einladungen sofort senden
                      </Label>
                      <Switch
                        id="send-invites"
                        size="sm"
                        checked={formData.emailNotifications.sendInvitations}
                        onCheckedChange={(checked) =>
                          updateEmailSetting("sendInvitations", checked)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="send-reminders"
                        className="text-xs font-normal"
                      >
                        Automatische Erinnerungen
                      </Label>
                      <Switch
                        id="send-reminders"
                        size="sm"
                        checked={formData.emailNotifications.sendReminders}
                        onCheckedChange={(checked) =>
                          updateEmailSetting("sendReminders", checked)
                        }
                      />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Label
                        htmlFor="custom-msg"
                        className="text-xs font-normal"
                      >
                        Individuelle Nachricht (Optional)
                      </Label>
                      <Textarea
                        id="custom-msg"
                        placeholder="Zusätzliche Infos für die Teilnehmer..."
                        value={formData.emailNotifications.customMessage}
                        onChange={(e) =>
                          updateEmailSetting("customMessage", e.target.value)
                        }
                        className="text-xs resize-none"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Conflict Visualization */}
          {showConflicts && (
            <div className="col-span-full animate-in slide-in-from-bottom-2 duration-300">
              <ConflictVisualization
                conflicts={conflictAnalysis.conflicts}
                warnings={conflictAnalysis.warnings}
                onAnalyzeAlternatives={() => setShowAlternatives(true)}
              />
            </div>
          )}

          {/* Alternative Slots */}
          {showAlternatives && (
            <Card className="col-span-full border-blue-200 bg-blue-50/50 dark:bg-blue-900/10">
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    Alternative Terminvorschläge
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAlternatives(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {alternativeTimeSlots.length === 0 ? (
                    <div className="col-span-full py-4 text-center text-sm text-gray-500 italic">
                      Suche nach Alternativen...
                    </div>
                  ) : (
                    alternativeTimeSlots.map((slot, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white dark:bg-slate-950 border rounded-lg hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            date: slot.date,
                            startTime: slot.startTime,
                            endTime: slot.endTime,
                          });
                          setShowAlternatives(false);

                          // Trigger conflict check for the new time
                          setTimeout(() => {
                            const analysis =
                              ConflictDetectionService.detectConflicts(
                                {
                                  ...formData,
                                  date: slot.date,
                                  startTime: slot.startTime,
                                  endTime: slot.endTime,
                                },
                                allAppointments,
                                {
                                  excludeAppointmentId: editingAppointment?.id,
                                  bufferMinutes: 15,
                                  checkTeamMembers: true,
                                  checkEquipment: true,
                                }
                              );
                            setConflictAnalysis(analysis);
                          }, 100);
                        }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div>
                              <div className="font-medium">
                                {new Date(slot.date).toLocaleDateString(
                                  "de-DE",
                                  {
                                    weekday: "short",
                                    day: "2-digit",
                                    month: "2-digit",
                                  }
                                )}
                              </div>
                              <div className="text-sm text-gray-600">
                                {slot.startTime} - {slot.endTime}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              slot.score >= 80
                                ? "bg-green-100 text-green-800"
                                : slot.score >= 60
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {slot.score}% Match
                          </div>
                          {slot.conflicts.length > 0 && (
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogFrame>
    </MultiWindowDialog>
  );
};

export default AppointmentDialog;

