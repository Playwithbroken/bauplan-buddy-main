import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { DialogFrame } from '@/components/ui/dialog-frame';
import {
  Calendar,
  Download,
  Mail,
  FileText,
  Clock,
  Users,
  MapPin,
  Repeat,
  AlertCircle,
  CheckCircle,
  Copy,
  Share2
} from 'lucide-react';
import { StoredAppointment } from '@/services/appointmentService';
import { CalendarInviteService } from '@/services/calendarInviteService';
import { EmailRecipient } from '@/types/email';
import { toast } from '@/hooks/use-toast';

interface CalendarInviteManagerProps {
  appointment: StoredAppointment;
  attendees?: EmailRecipient[];
  isOpen: boolean;
  onClose: () => void;
  onSend?: (inviteData: { 
    method: 'REQUEST' | 'CANCEL' | 'REPLY';
    content: string;
    filename: string;
    recipients: EmailRecipient[];
  }) => void;
}

const CalendarInviteManager: React.FC<CalendarInviteManagerProps> = ({
  appointment,
  attendees = [],
  isOpen,
  onClose,
  onSend
}) => {
  const [inviteMethod, setInviteMethod] = useState<'REQUEST' | 'CANCEL' | 'REPLY'>('REQUEST');
  const [includeAlarms, setIncludeAlarms] = useState(true);
  const [includeRecurrence, setIncludeRecurrence] = useState(true);
  const [includeTimezone, setIncludeTimezone] = useState(true);
  const [timezone, setTimezone] = useState('Europe/Berlin');
  const [selectedAttendees, setSelectedAttendees] = useState<EmailRecipient[]>(attendees);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedInvite, setGeneratedInvite] = useState<{
    content: string;
    filename: string;
    size: number;
  } | null>(null);

  const organizer = {
    name: 'Bauplan Buddy Team',
    email: 'termine@bauplan-buddy.com'
  };

  const generateInvite = async () => {
    setIsGenerating(true);
    try {
      const invite = CalendarInviteService.generateCalendarInvite(
        appointment,
        inviteMethod,
        organizer,
        selectedAttendees,
        {
          includeAlarms,
          includeRecurrence: includeRecurrence && appointment.isRecurring,
          includeTimezone,
          timezone,
          url: `${window.location.origin}/appointments/${appointment.id}`
        }
      );

      setGeneratedInvite({
        content: invite.content,
        filename: invite.filename,
        size: new Blob([invite.content]).size
      });

      toast({
        title: "Kalendereinladung generiert",
        description: `${invite.filename} wurde erfolgreich erstellt.`,
      });
    } catch (error) {
      console.error('Failed to generate calendar invite:', error);
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Die Kalendereinladung konnte nicht generiert werden.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadInvite = () => {
    if (!generatedInvite) return;

    const blob = new Blob([generatedInvite.content], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = generatedInvite.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download gestartet",
      description: `${generatedInvite.filename} wird heruntergeladen.`,
    });
  };

  const copyToClipboard = async () => {
    if (!generatedInvite) return;

    try {
      await navigator.clipboard.writeText(generatedInvite.content);
      toast({
        title: "In Zwischenablage kopiert",
        description: "Der Kalenderinhalt wurde in die Zwischenablage kopiert.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Inhalt konnte nicht kopiert werden.",
      });
    }
  };

  const sendViaEmail = () => {
    if (!generatedInvite || !onSend) return;

    onSend({
      method: inviteMethod,
      content: generatedInvite.content,
      filename: generatedInvite.filename,
      recipients: selectedAttendees
    });

    toast({
      title: "E-Mail wird versendet",
      description: `Kalendereinladung an ${selectedAttendees.length} Empfänger.`,
    });
  };

  const toggleAttendee = (attendee: EmailRecipient) => {
    setSelectedAttendees(prev => {
      const isSelected = prev.some(a => a.email === attendee.email);
      if (isSelected) {
        return prev.filter(a => a.email !== attendee.email);
      } else {
        return [...prev, attendee];
      }
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getMethodDescription = (method: string): string => {
    switch (method) {
      case 'REQUEST': return 'Neue Einladung oder Aktualisierung';
      case 'CANCEL': return 'Terminabsage';
      case 'REPLY': return 'Antwort auf Einladung';
      default: return 'Kalendereinladung';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'REQUEST': return <Mail className="h-4 w-4" />;
      case 'CANCEL': return <AlertCircle className="h-4 w-4" />;
      case 'REPLY': return <Share2 className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogFrame
        defaultFullscreen
        showFullscreenToggle
        title={<span className="flex items-center gap-2"><Calendar className="h-5 w-5" />Kalendereinladung verwalten</span>}
        description={<DialogDescription>Erstellen und versenden Sie Kalendereinladungen für "{appointment.title}"</DialogDescription>}
        footer={
          <Button variant="outline" onClick={onClose}>
            Schließen
          </Button>
        }
      >

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Einladungseinstellungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Einladungstyp</Label>
                  <Select value={inviteMethod} onValueChange={(value: 'REQUEST' | 'CANCEL' | 'REPLY') => setInviteMethod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REQUEST">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Einladung senden
                        </div>
                      </SelectItem>
                      <SelectItem value="CANCEL">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Absage senden
                        </div>
                      </SelectItem>
                      <SelectItem value="REPLY">
                        <div className="flex items-center gap-2">
                          <Share2 className="h-4 w-4" />
                          Antwort senden
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-600">{getMethodDescription(inviteMethod)}</p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Erinnerungen einbeziehen</Label>
                    <Switch checked={includeAlarms} onCheckedChange={setIncludeAlarms} />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Zeitzone-Information</Label>
                    <Switch checked={includeTimezone} onCheckedChange={setIncludeTimezone} />
                  </div>

                  {appointment.isRecurring && (
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">Wiederholungen einbeziehen</Label>
                      <Switch checked={includeRecurrence} onCheckedChange={setIncludeRecurrence} />
                    </div>
                  )}
                </div>

                {includeTimezone && (
                  <div className="space-y-2">
                    <Label>Zeitzone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/Berlin">Europa/Berlin (CET/CEST)</SelectItem>
                        <SelectItem value="Europe/Vienna">Europa/Wien (CET/CEST)</SelectItem>
                        <SelectItem value="Europe/Zurich">Europa/Zürich (CET/CEST)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attendees Selection */}
            {attendees.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Teilnehmer ({selectedAttendees.length}/{attendees.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {attendees.map((attendee) => {
                      const isSelected = selectedAttendees.some(a => a.email === attendee.email);
                      return (
                        <div
                          key={attendee.email}
                          className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                          onClick={() => toggleAttendee(attendee)}
                        >
                          <div>
                            <div className="font-medium text-sm">{attendee.name || attendee.email}</div>
                            <div className="text-xs text-gray-600">{attendee.email}</div>
                          </div>
                          <Badge variant={attendee.role === 'optional' ? 'secondary' : 'default'}>
                            {attendee.role === 'optional' ? 'Optional' : 'Erforderlich'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Preview and Actions Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Termindetails</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 mt-1 text-gray-500" />
                  <div>
                    <div className="font-medium">{appointment.title}</div>
                    <div className="text-sm text-gray-600">{appointment.date} • {appointment.startTime} - {appointment.endTime}</div>
                  </div>
                </div>

                {appointment.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 mt-1 text-gray-500" />
                    <div className="text-sm">{appointment.location}</div>
                  </div>
                )}

                {appointment.description && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 mt-1 text-gray-500" />
                    <div className="text-sm">{appointment.description}</div>
                  </div>
                )}

                {appointment.isRecurring && (
                  <div className="flex items-start gap-3">
                    <Repeat className="h-4 w-4 mt-1 text-gray-500" />
                    <div className="text-sm">Wiederkehrender Termin</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {generatedInvite && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Generierte Einladung
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{generatedInvite.filename}</span>
                    <Badge variant="outline">{formatFileSize(generatedInvite.size)}</Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={downloadInvite} className="flex-1">
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm" onClick={copyToClipboard} className="flex-1">
                      <Copy className="h-3 w-3 mr-1" />
                      Kopieren
                    </Button>
                  </div>

                  {onSend && selectedAttendees.length > 0 && (
                    <Button onClick={sendViaEmail} className="w-full">
                      <Mail className="h-4 w-4 mr-2" />
                      Per E-Mail versenden
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-6">
                <Button 
                  onClick={generateInvite} 
                  disabled={isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Generiere...
                    </>
                  ) : (
                    <>
                      {getMethodIcon(inviteMethod)}
                      <span className="ml-2">Kalendereinladung generieren</span>
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

              </DialogFrame>
    </Dialog>
  );
};

export default CalendarInviteManager;