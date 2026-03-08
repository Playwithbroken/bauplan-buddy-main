import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DraggableDialogContent as DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/DraggableDialog";
import { Link } from "react-router-dom";
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
} from "date-fns";
import { de } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Plus,
  Building,
  Clock,
  Users,
  MapPin,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  useCalendar,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  useTeamMembers,
  useOptimisticEvents,
} from "@/hooks/useCalendar";
import {
  CalendarEvent,
  CreateEventData,
  EventType,
  EventStatus,
  CalendarViewType,
} from "@/types/calendar";
import { toast } from "@/hooks/use-toast";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { DragItem, DropTarget } from "@/types/dragAndDrop";
import DraggableAppointment from "@/components/DraggableAppointment";
import ResizableAppointment from "@/components/ResizableAppointment";
import DropZone from "@/components/DropZone";
import { StoredAppointment } from "@/services/appointmentService";

const Calendar = () => {
  const [activeTab, setActiveTab] = useState("calendar");
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [newEventData, setNewEventData] = useState<Partial<CreateEventData>>(
    {}
  );

  // API hooks - must be called before any conditional returns
  const {
    events,
    isLoading,
    error,
    currentDate,
    selectedDate,
    activeView,
    setCurrentDate,
    setSelectedDate,
    setActiveView,
    navigateDate,
    goToToday,
  } = useCalendar();

  // Drag and drop hook
  const {
    state: dragDropState,
    startDrag,
    endDrag,
    updateDrag,
    cancelDrag,
  } = useDragAndDrop();

  const { data: teamMembers = [] } = useTeamMembers();
  const createEventMutation = useCreateEvent();
  const updateEventMutation = useUpdateEvent();
  const deleteEventMutation = useDeleteEvent();
  const { addOptimisticEvent, updateOptimisticEvent, removeOptimisticEvent } =
    useOptimisticEvents();

  console.log("Calendar component state:", {
    events,
    isLoading,
    error,
    eventsLength: events?.length,
  });

  // Show loading spinner while initializing
  if (isLoading && !events.length) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-lg text-gray-600 dark:text-gray-300">
            Bauplan Buddy wird geladen...
          </span>
        </div>
      </div>
    );
  }

  // Event handlers
  const handleCreateEvent = async () => {
    if (!newEventData.title || !newEventData.date || !newEventData.endDate) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Bitte füllen Sie alle erforderlichen Felder aus.",
      });
      return;
    }

    // Create optimistic event
    const tempId = `temp-${Date.now()}`;
    const optimisticEvent: CalendarEvent = {
      id: tempId,
      title: newEventData.title,
      description: newEventData.description || "",
      type: newEventData.type || "meeting",
      status: newEventData.status || "pending",
      date: new Date(newEventData.date),
      endDate: new Date(newEventData.endDate),
      location: newEventData.location || "",
      attendees: newEventData.attendees || [],
      project: "",
      projectId: newEventData.projectId,
      customer: "",
      customerId: newEventData.customerId,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "current-user",
    };

    // Add optimistic update
    addOptimisticEvent(optimisticEvent);

    try {
      await createEventMutation.mutateAsync(newEventData as CreateEventData);
      setNewEventData({});
      setIsEventDialogOpen(false);

      // Remove temp event from cache
      removeOptimisticEvent(tempId);
    } catch (error) {
      // Remove failed optimistic update
      removeOptimisticEvent(tempId);
    }
  };

  const handleUpdateEvent = async (eventData: Partial<CalendarEvent>) => {
    if (!editingEvent) return;

    // Optimistic update
    updateOptimisticEvent(editingEvent.id, eventData);

    try {
      await updateEventMutation.mutateAsync({
        id: editingEvent.id,
        ...eventData,
      });
      setEditingEvent(null);
    } catch (error) {
      // Revert optimistic update on error
      updateOptimisticEvent(editingEvent.id, editingEvent);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    // Find event for potential rollback
    const eventToDelete = events.find((e) => e.id === eventId);
    if (!eventToDelete) return;

    // Optimistic removal
    removeOptimisticEvent(eventId);

    try {
      await deleteEventMutation.mutateAsync(eventId);
    } catch (error) {
      // Restore event on error
      addOptimisticEvent(eventToDelete);
    }
  };

  // Handle edit event
  const handleEditEvent = (appointment: StoredAppointment | CalendarEvent) => {
    let event: CalendarEvent;

    if ("startTime" in appointment) {
      const stored = appointment as StoredAppointment;
      // Parse date and time strings to Date objects
      // Assuming date is YYYY-MM-DD and startTime/endTime is HH:mm
      const startDateTime = new Date(`${stored.date}T${stored.startTime}`);
      const endDateTime = new Date(`${stored.date}T${stored.endTime}`);

      event = {
        id: stored.id,
        title: stored.title,
        description: stored.description,
        type: stored.type as EventType,
        status: (stored.status || "pending") as EventStatus,
        date: startDateTime,
        endDate: endDateTime,
        location: stored.location || "",
        attendees: stored.attendees || [],
        projectId: stored.projectId,
        customerId: stored.customerId,
        createdAt: new Date(stored.createdAt),
        updatedAt: new Date(stored.updatedAt),
        createdBy: stored.createdBy || "system",
        project: "", // Default or fetch if needed
        customer: "", // Default or fetch if needed
      };
    } else {
      event = appointment as CalendarEvent;
    }
    setEditingEvent(event);
  };

  // Handle drag start
  const handleDragStart = (item: DragItem) => {
    startDrag(item);
  };

  // Handle drag end
  const handleDragEnd = async (item: DragItem, target?: DropTarget) => {
    if (target) {
      await endDrag(target);
    } else {
      cancelDrag();
    }
  };

  // Handle resize start
  const handleResizeStart = (item: DragItem) => {
    startDrag(item);
  };

  // Handle resize end
  const handleResizeEnd = async (item: DragItem, target?: DropTarget) => {
    if (target) {
      await endDrag(target);
    } else {
      cancelDrag();
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
    return events.filter((event) => isSameDay(event.date, date));
  };

  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.project &&
        event.project.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (event.customer &&
        event.customer.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

          // Create drop target for this day
          const dropTarget: DropTarget = {
            date: format(day, "yyyy-MM-dd"),
          };

          return (
            <DropZone
              key={day.toISOString()}
              target={dropTarget}
              onDrop={async (item, target) => {
                // Handle drop event
                await endDrag(target);
              }}
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
                {dayEvents.slice(0, 2).map((event) => (
                  <ResizableAppointment
                    key={event.id}
                    appointment={{
                      id: event.id,
                      title: event.title,
                      description: event.description || "",
                      type: event.type,
                      status: event.status,
                      date: format(event.date, "yyyy-MM-dd"),
                      startTime: format(event.date, "HH:mm"),
                      endTime: format(event.endDate, "HH:mm"),
                      location: event.location,
                      projectId: event.projectId,
                      attendees: event.attendees,
                      teamMembers: [], // This would need to be mapped from event data
                      equipment: [], // This would need to be mapped from event data
                      priority: "medium", // This would need to be mapped from event data
                      customerNotification: false, // This would need to be mapped from event data
                      reminderTime: "15", // This would need to be mapped from event data
                      isRecurring: false, // This would need to be mapped from event data
                      recurrencePattern: {
                        type: "none",
                        interval: 1,
                        endType: "never",
                      },
                      emailNotifications: {
                        enabled: false,
                        sendInvitations: false,
                        sendReminders: false,
                        recipients: [],
                      },
                      createdAt: event.createdAt.toISOString(),
                      updatedAt: event.updatedAt.toISOString(),
                    }}
                    onEdit={handleEditEvent}
                    onDelete={handleDeleteEvent}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onResizeStart={handleResizeStart}
                    onResizeEnd={handleResizeEnd}
                    className="text-xs p-1 rounded border truncate"
                    isDragging={
                      dragDropState.isDragging &&
                      dragDropState.dragItem?.id === event.id
                    }
                    isResizing={false}
                  />
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    +{dayEvents.length - 2} weitere
                  </div>
                )}
              </div>
            </DropZone>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className="grid grid-cols-8 gap-1 mb-4">
        {/* Zeit Spalte */}
        <div className="p-2">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Zeit
          </div>
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className="h-16 border-b border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 py-1"
            >
              {8 + i}:00
            </div>
          ))}
        </div>

        {/* Wochentage */}
        {days.map((day) => {
          const dayEvents = getEventsForDate(day);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={`${isToday ? "bg-blue-50 dark:bg-blue-900" : ""}`}
            >
              <div className="p-2 text-center border-b border-gray-200 dark:border-gray-700">
                <div
                  className={`text-sm font-medium ${
                    isToday ? "text-blue-600" : "text-gray-900 dark:text-white"
                  }`}
                >
                  {format(day, "E", { locale: de })}
                </div>
                <div
                  className={`text-lg ${
                    isToday
                      ? "text-blue-600 font-bold"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  {format(day, "d")}
                </div>
              </div>
              <div className="space-y-1 p-1">
                {dayEvents.map((event) => (
                  <ResizableAppointment
                    key={event.id}
                    appointment={{
                      id: event.id,
                      title: event.title,
                      description: event.description || "",
                      type: event.type,
                      status: event.status,
                      date: format(event.date, "yyyy-MM-dd"),
                      startTime: format(event.date, "HH:mm"),
                      endTime: format(event.endDate, "HH:mm"),
                      location: event.location,
                      projectId: event.projectId,
                      attendees: event.attendees,
                      teamMembers: [], // This would need to be mapped from event data
                      equipment: [], // This would need to be mapped from event data
                      priority: "medium", // This would need to be mapped from event data
                      customerNotification: false, // This would need to be mapped from event data
                      reminderTime: "15", // This would need to be mapped from event data
                      isRecurring: false, // This would need to be mapped from event data
                      recurrencePattern: {
                        type: "none",
                        interval: 1,
                        endType: "never",
                      },
                      emailNotifications: {
                        enabled: false,
                        sendInvitations: false,
                        sendReminders: false,
                        recipients: [],
                      },
                      createdAt: event.createdAt.toISOString(),
                      updatedAt: event.updatedAt.toISOString(),
                    }}
                    onEdit={handleEditEvent}
                    onDelete={handleDeleteEvent}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onResizeStart={handleResizeStart}
                    onResizeEnd={handleResizeEnd}
                    className="text-xs p-2 rounded border"
                    isDragging={
                      dragDropState.isDragging &&
                      dragDropState.dragItem?.id === event.id
                    }
                    isResizing={false}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);

    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {format(currentDate, "EEEE, d. MMMM yyyy", { locale: de })}
          </h3>
        </div>

        {dayEvents.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Keine Termine für diesen Tag
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayEvents
              .sort((a, b) => a.date.getTime() - b.date.getTime())
              .map((event) => (
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
                              {format(event.date, "HH:mm")} -{" "}
                              {format(event.endDate, "HH:mm")}
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
                      <div className="flex space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingEvent(event)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteEvent(event.id)}
                          disabled={deleteEventMutation.isPending}
                        >
                          {deleteEventMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2">
                <Building className="h-8 w-8 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Bauplan Buddy
                </h1>
              </Link>

              <nav className="hidden md:flex space-x-6">
                <Link
                  to="/dashboard"
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600"
                >
                  Dashboard
                </Link>
                <Link
                  to="/projects"
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600"
                >
                  Projekte
                </Link>
                <Link
                  to="/quotes"
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600"
                >
                  Angebote
                </Link>
                <Link
                  to="/invoices"
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600"
                >
                  Rechnungen
                </Link>
                <Link to="/calendar" className="text-blue-600 font-medium">
                  Termine
                </Link>
                <Link
                  to="/customers"
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600"
                >
                  Kunden
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <Dialog
                open={isEventDialogOpen}
                onOpenChange={setIsEventDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Neuer Termin
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Neuen Termin erstellen</DialogTitle>
                    <DialogDescription>
                      Erstellen Sie einen neuen Termin oder Event.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="event-title">Titel</Label>
                      <Input id="event-title" placeholder="Termintitel" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="event-type">Typ</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Termintyp auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="site-visit">
                            Baustellenbesuch
                          </SelectItem>
                          <SelectItem value="delivery">Lieferung</SelectItem>
                          <SelectItem value="meeting">Besprechung</SelectItem>
                          <SelectItem value="milestone">Meilenstein</SelectItem>
                          <SelectItem value="internal">Intern</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="event-date">Datum</Label>
                      <Input id="event-date" type="date" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="event-start">Start</Label>
                        <Input id="event-start" type="time" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="event-end">Ende</Label>
                        <Input id="event-end" type="time" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="event-location">Ort</Label>
                      <Input
                        id="event-location"
                        placeholder="Adresse oder Ort"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="event-description">Beschreibung</Label>
                      <Textarea
                        id="event-description"
                        placeholder="Zusätzliche Informationen"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsEventDialogOpen(false)}
                      >
                        Abbrechen
                      </Button>
                      <Button onClick={() => setIsEventDialogOpen(false)}>
                        Termin erstellen
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Terminplanung
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Baustellentermine, Besprechungen & Meilensteine
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              <CardTitle className="text-sm font-medium">Diese Woche</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  events.filter((e) => {
                    const weekStart = startOfWeek(new Date(), {
                      weekStartsOn: 1,
                    });
                    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
                    return e.date >= weekStart && e.date <= weekEnd;
                  }).length
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Termine diese Woche
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ausstehend</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {events.filter((e) => e.status === "pending").length}
              </div>
              <p className="text-xs text-yellow-600">Unbestätigte Termine</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Team Mitglieder
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamMembers.length}</div>
              <p className="text-xs text-muted-foreground">
                Verfügbare Mitarbeiter
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
          <div className="flex justify-between items-center">
            <TabsList className="h-14 p-2 bg-muted/50 rounded-lg">
              <TabsTrigger
                value="calendar"
                className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                Kalender
              </TabsTrigger>
              <TabsTrigger
                value="list"
                className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                Terminliste
              </TabsTrigger>
              <TabsTrigger
                value="team"
                className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                Team
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center space-x-4">
              {activeTab === "calendar" && (
                <>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateDate("prev")}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToToday}>
                      Heute
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateDate("next")}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-xl font-semibold text-gray-900 dark:text-white">
                    {activeView === "month" &&
                      format(currentDate, "MMMM yyyy", { locale: de })}
                    {activeView === "week" &&
                      `${format(
                        startOfWeek(currentDate, { weekStartsOn: 1 }),
                        "d. MMM",
                        { locale: de }
                      )} - ${format(
                        endOfWeek(currentDate, { weekStartsOn: 1 }),
                        "d. MMM yyyy",
                        { locale: de }
                      )}`}
                    {activeView === "day" &&
                      format(currentDate, "d. MMMM yyyy", { locale: de })}
                  </div>

                  <Select
                    value={activeView}
                    onValueChange={(value) =>
                      setActiveView(value as CalendarViewType)
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Monat</SelectItem>
                      <SelectItem value="week">Woche</SelectItem>
                      <SelectItem value="day">Tag</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}

              {activeTab === "list" && (
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
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <TabsContent value="calendar" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600 dark:text-gray-300">
                      Kalenderdaten werden geladen...
                    </span>
                  </div>
                ) : (
                  <>
                    {activeView === "month" && renderMonthView()}
                    {activeView === "week" && renderWeekView()}
                    {activeView === "day" && renderDayView()}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list" className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600 dark:text-gray-300">
                  Termine werden geladen...
                </span>
              </div>
            ) : (
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
                  filteredEvents.map((event) => (
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
                          <div className="flex space-x-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingEvent(event)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteEvent(event.id)}
                              disabled={deleteEventMutation.isPending}
                            >
                              {deleteEventMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teamMembers.map((member) => (
                <Card key={member.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
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
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        Heutige Termine:
                      </p>
                      <div className="space-y-1">
                        {events
                          .filter(
                            (e) =>
                              isSameDay(e.date, new Date()) &&
                              e.attendees.some((a) =>
                                a.includes(
                                  member.name.split(" ")[1] || member.name
                                )
                              )
                          )
                          .map((event) => (
                            <div
                              key={event.id}
                              className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded"
                            >
                              {format(event.date, "HH:mm")} - {event.title}
                            </div>
                          ))}
                        {events.filter(
                          (e) =>
                            isSameDay(e.date, new Date()) &&
                            e.attendees.some((a) =>
                              a.includes(
                                member.name.split(" ")[1] || member.name
                              )
                            )
                        ).length === 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Keine Termine heute
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Calendar;
