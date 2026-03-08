import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Calendar, RefreshCw, Edit, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { StoredAppointment } from '@/services/appointmentService';
import { getRecurrenceInfo } from '@/hooks/useRecurringAppointments';
import { RecurrenceService } from '@/services/recurrenceService';

export type RecurrenceEditChoice = 'single' | 'series' | 'future';

interface RecurrenceEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (choice: RecurrenceEditChoice) => void;
  appointment: StoredAppointment | null;
  action: 'edit' | 'delete';
}

const RecurrenceEditDialog: React.FC<RecurrenceEditDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  appointment,
  action
}) => {
  const [selectedChoice, setSelectedChoice] = useState<RecurrenceEditChoice>('single');
  
  // Don't render if appointment is null
  if (!appointment) {
    return null;
  }
  
  const recurrenceInfo = getRecurrenceInfo(appointment);
  const appointmentDate = new Date(appointment.date);
  
  const getActionText = () => {
    switch (action) {
      case 'edit': return 'bearbeiten';
      case 'delete': return 'löschen';
      default: return 'ändern';
    }
  };
  
  const getActionIcon = () => {
    switch (action) {
      case 'edit': return <Edit className="h-5 w-5" />;
      case 'delete': return <AlertTriangle className="h-5 w-5" />;
      default: return <Edit className="h-5 w-5" />;
    }
  };
  
  const getActionColor = () => {
    switch (action) {
      case 'delete': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };
  
  const handleConfirm = () => {
    onConfirm(selectedChoice);
    onClose();
  };
  
  const handleCancel = () => {
    setSelectedChoice('single');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w- max-h-[90vh] flex flex-col[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getActionIcon()}
            Serientermin {getActionText()}
          </DialogTitle>
          <DialogDescription>
            Dieser Termin ist Teil einer Terminserie. Wie möchten Sie vorgehen?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Appointment Info */}
          <div className={`p-4 rounded-lg border ${getActionColor()}`}>
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="h-4 w-4" />
              <span className="font-medium">{appointment.title}</span>
            </div>
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                <span>{format(appointmentDate, 'EEEE, dd.MM.yyyy', { locale: de })}</span>
                <span>um {appointment.startTime} Uhr</span>
              </div>
              {appointment.recurrencePattern && (
                <div className="text-xs text-gray-600">
                  {RecurrenceService.getRecurrenceDescription(appointment.recurrencePattern)}
                </div>
              )}
            </div>
          </div>

          {/* Edit Options */}
          <div className="space-y-4">
            <Label className="text-base font-medium">
              Was möchten Sie {getActionText()}?
            </Label>
            
            <RadioGroup
              value={selectedChoice}
              onValueChange={(value: RecurrenceEditChoice) => setSelectedChoice(value)}
              className="space-y-3"
            >
              {/* Single Occurrence */}
              <div className="flex items-start space-x-2 p-3 rounded-lg border hover:bg-gray-50">
                <RadioGroupItem value="single" id="single" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="single" className="font-medium cursor-pointer">
                    Nur diesen Termin
                  </Label>
                  <div className="text-sm text-gray-600 mt-1">
                    {action === 'edit' ? 
                      'Nur den Termin am ' + format(appointmentDate, 'dd.MM.yyyy', { locale: de }) + ' ändern. Die anderen Termine der Serie bleiben unverändert.' :
                      'Nur den Termin am ' + format(appointmentDate, 'dd.MM.yyyy', { locale: de }) + ' löschen. Die anderen Termine der Serie bleiben bestehen.'
                    }
                  </div>
                </div>
              </div>

              {/* Entire Series */}
              <div className="flex items-start space-x-2 p-3 rounded-lg border hover:bg-gray-50">
                <RadioGroupItem value="series" id="series" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="series" className="font-medium cursor-pointer">
                    Alle Termine der Serie
                  </Label>
                  <div className="text-sm text-gray-600 mt-1">
                    {action === 'edit' ? 
                      'Alle Termine dieser Serie ändern (vergangene und zukünftige).' :
                      'Die gesamte Terminserie löschen (alle vergangenen und zukünftigen Termine).'
                    }
                  </div>
                </div>
              </div>

              {/* Future Occurrences */}
              <div className="flex items-start space-x-2 p-3 rounded-lg border hover:bg-gray-50">
                <RadioGroupItem value="future" id="future" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="future" className="font-medium cursor-pointer">
                    Diesen und alle zukünftigen Termine
                  </Label>
                  <div className="text-sm text-gray-600 mt-1">
                    {action === 'edit' ? 
                      'Den Termin am ' + format(appointmentDate, 'dd.MM.yyyy', { locale: de }) + ' und alle zukünftigen Termine dieser Serie ändern.' :
                      'Den Termin am ' + format(appointmentDate, 'dd.MM.yyyy', { locale: de }) + ' und alle zukünftigen Termine löschen.'
                    }
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Warning for destructive actions */}
          {action === 'delete' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Achtung:</span>
              </div>
              <div className="text-red-700 text-sm mt-1">
                Diese Aktion kann nicht rückgängig gemacht werden.
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleConfirm}
            variant={action === 'delete' ? 'destructive' : 'default'}
          >
            {action === 'edit' ? 'Bearbeiten' : 'Löschen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RecurrenceEditDialog;