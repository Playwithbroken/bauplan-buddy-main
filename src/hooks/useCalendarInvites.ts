import { useState, useCallback } from 'react';
import { CalendarInviteService } from '@/services/calendarInviteService';
import { emailService } from '@/services/emailService';
import { StoredAppointment } from '@/services/appointmentService';
import { EmailRecipient, CalendarInvite } from '@/types/email';
import { toast } from '@/hooks/use-toast';

interface UseCalendarInvitesOptions {
  organizer?: {
    name: string;
    email: string;
  };
  defaultTimezone?: string;
}

interface CalendarInviteState {
  isGenerating: boolean;
  isSending: boolean;
  lastGenerated: CalendarInvite | null;
  error: string | null;
}

export function useCalendarInvites(options: UseCalendarInvitesOptions = {}) {
  const {
    organizer = { name: 'Bauplan Buddy', email: 'termine@bauplan-buddy.com' },
    defaultTimezone = 'Europe/Berlin'
  } = options;

  const [state, setState] = useState<CalendarInviteState>({
    isGenerating: false,
    isSending: false,
    lastGenerated: null,
    error: null
  });

  /**
   * Generate a calendar invite for an appointment
   */
  const generateInvite = useCallback(async (
    appointment: StoredAppointment,
    recipients: EmailRecipient[] = [],
    options: {
      method?: 'REQUEST' | 'CANCEL' | 'REPLY';
      includeAlarms?: boolean;
      includeRecurrence?: boolean;
      includeTimezone?: boolean;
      timezone?: string;
    } = {}
  ): Promise<CalendarInvite | null> => {
    const {
      method = 'REQUEST',
      includeAlarms = true,
      includeRecurrence = true,
      includeTimezone = true,
      timezone = defaultTimezone
    } = options;

    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      const invite = CalendarInviteService.generateCalendarInvite(
        appointment,
        method,
        organizer,
        recipients,
        {
          includeAlarms,
          includeRecurrence: includeRecurrence && appointment.isRecurring,
          includeTimezone,
          timezone,
          url: `${window.location.origin}/appointments/${appointment.id}`
        }
      );

      setState(prev => ({
        ...prev,
        isGenerating: false,
        lastGenerated: invite,
        error: null
      }));

      toast({
        title: "Kalendereinladung generiert",
        description: `${invite.filename} wurde erfolgreich erstellt.`,
      });

      return invite;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: errorMessage
      }));

      toast({
        variant: "destructive",
        title: "Fehler beim Generieren",
        description: errorMessage,
      });

      return null;
    }
  }, [organizer, defaultTimezone]);

  /**
   * Generate and send calendar invite via email
   */
  const generateAndSendInvite = useCallback(async (
    appointment: StoredAppointment,
    recipients: EmailRecipient[],
    options: {
      method?: 'REQUEST' | 'CANCEL' | 'REPLY';
      customMessage?: string;
      includeAlarms?: boolean;
      includeRecurrence?: boolean;
    } = {}
  ): Promise<boolean> => {
    const {
      method = 'REQUEST',
      customMessage,
      includeAlarms = true,
      includeRecurrence = true
    } = options;

    setState(prev => ({ ...prev, isSending: true, error: null }));

    try {
      // Generate the calendar invite
      const invite = await generateInvite(appointment, recipients, {
        method,
        includeAlarms,
        includeRecurrence
      });

      if (!invite) {
        setState(prev => ({ ...prev, isSending: false }));
        return false;
      }

      // Send via email service based on method
      let emailResult;
      switch (method) {
        case 'REQUEST':
          emailResult = await emailService.sendAppointmentInvitation(appointment, recipients);
          break;
        case 'CANCEL':
          emailResult = await emailService.sendAppointmentCancellation(appointment, recipients, customMessage);
          break;
        default:
          emailResult = await emailService.sendAppointmentInvitation(appointment, recipients);
      }

      setState(prev => ({ ...prev, isSending: false }));

      if (emailResult.success) {
        toast({
          title: "E-Mail versendet",
          description: `Kalendereinladung an ${recipients.length} Empfänger gesendet.`,
        });
        return true;
      } else {
        throw new Error(emailResult.error || 'E-Mail-Versand fehlgeschlagen');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      setState(prev => ({
        ...prev,
        isSending: false,
        error: errorMessage
      }));

      toast({
        variant: "destructive",
        title: "Fehler beim Versenden",
        description: errorMessage,
      });

      return false;
    }
  }, [generateInvite]);

  /**
   * Generate bulk calendar invites for multiple appointments
   */
  const generateBulkInvites = useCallback(async (
    appointments: StoredAppointment[],
    attendeesMap: Map<string, EmailRecipient[]> = new Map(),
    options: {
      method?: 'REQUEST' | 'CANCEL';
      includeAlarms?: boolean;
      includeRecurrence?: boolean;
    } = {}
  ): Promise<{ filename: string; content: string } | null> => {
    const {
      method = 'REQUEST',
      includeAlarms = true,
      includeRecurrence = true
    } = options;

    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      const bulkInvite = CalendarInviteService.generateBulkCalendarInvites(
        appointments,
        method,
        organizer,
        attendeesMap
      );

      setState(prev => ({ ...prev, isGenerating: false }));

      toast({
        title: "Bulk-Kalendereinladung generiert",
        description: `${appointments.length} Termine in ${bulkInvite.filename} erstellt.`,
      });

      return bulkInvite;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: errorMessage
      }));

      toast({
        variant: "destructive",
        title: "Fehler beim Bulk-Export",
        description: errorMessage,
      });

      return null;
    }
  }, [organizer]);

  /**
   * Download a calendar invite file
   */
  const downloadInvite = useCallback((invite: CalendarInvite) => {
    try {
      const blob = new Blob([invite.content], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = invite.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download gestartet",
        description: `${invite.filename} wird heruntergeladen.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Download fehlgeschlagen",
        description: "Die Datei konnte nicht heruntergeladen werden.",
      });
    }
  }, []);

  /**
   * Copy calendar invite content to clipboard
   */
  const copyToClipboard = useCallback(async (invite: CalendarInvite): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(invite.content);
      toast({
        title: "In Zwischenablage kopiert",
        description: "Der Kalenderinhalt wurde kopiert.",
      });
      return true;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Kopieren fehlgeschlagen",
        description: "Inhalt konnte nicht in die Zwischenablage kopiert werden.",
      });
      return false;
    }
  }, []);

  /**
   * Parse and validate an existing calendar invite
   */
  const parseInvite = useCallback((content: string) => {
    try {
      const result = CalendarInviteService.parseCalendarInvite(content);
      
      if (!result.isValid) {
        toast({
          variant: "destructive",
          title: "Ungültige Kalendereinladung",
          description: result.errors.join(', '),
        });
      }

      return result;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Parsing-Fehler",
        description: "Die Kalendereinladung konnte nicht verarbeitet werden.",
      });
      
      return {
        isValid: false,
        events: [],
        errors: ['Parsing failed']
      };
    }
  }, []);

  /**
   * Generate cancellation invite for an appointment
   */
  const generateCancellationInvite = useCallback(async (
    appointment: StoredAppointment,
    recipients: EmailRecipient[],
    reason?: string
  ): Promise<CalendarInvite | null> => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      const invite = CalendarInviteService.generateCancellationInvite(
        appointment,
        organizer,
        recipients,
        reason
      );

      setState(prev => ({
        ...prev,
        isGenerating: false,
        lastGenerated: invite,
        error: null
      }));

      toast({
        title: "Absage-Einladung generiert",
        description: `${invite.filename} wurde erstellt.`,
      });

      return invite;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: errorMessage
      }));

      toast({
        variant: "destructive",
        title: "Fehler beim Generieren der Absage",
        description: errorMessage,
      });

      return null;
    }
  }, [organizer]);

  /**
   * Reset the hook state
   */
  const reset = useCallback(() => {
    setState({
      isGenerating: false,
      isSending: false,
      lastGenerated: null,
      error: null
    });
  }, []);

  return {
    // State
    isGenerating: state.isGenerating,
    isSending: state.isSending,
    lastGenerated: state.lastGenerated,
    error: state.error,
    
    // Actions
    generateInvite,
    generateAndSendInvite,
    generateBulkInvites,
    generateCancellationInvite,
    downloadInvite,
    copyToClipboard,
    parseInvite,
    reset
  };
}

export default useCalendarInvites;