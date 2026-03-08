import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon, RefreshCw, AlertCircle, Info } from 'lucide-react';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  RecurrencePattern, 
  RecurrenceType, 
  WeekDay, 
  MonthlyType, 
  EndType,
  RecurrenceService 
} from '@/services/recurrenceService';

interface RecurrenceOptionsProps {
  pattern: RecurrencePattern;
  onPatternChange: (pattern: RecurrencePattern) => void;
  startDate: string;
  className?: string;
}

const RecurrenceOptions: React.FC<RecurrenceOptionsProps> = ({
  pattern,
  onPatternChange,
  startDate,
  className = ''
}) => {
  const [previewDates, setPreviewDates] = useState<Date[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const weekDayOptions: { value: WeekDay; label: string }[] = [
    { value: 'monday', label: 'Montag' },
    { value: 'tuesday', label: 'Dienstag' },
    { value: 'wednesday', label: 'Mittwoch' },
    { value: 'thursday', label: 'Donnerstag' },
    { value: 'friday', label: 'Freitag' },
    { value: 'saturday', label: 'Samstag' },
    { value: 'sunday', label: 'Sonntag' }
  ];

  // Update pattern and validate
  const updatePattern = (updates: Partial<RecurrencePattern>) => {
    const newPattern = { ...pattern, ...updates };
    onPatternChange(newPattern);
    
    // Validate the pattern
    const validation = RecurrenceService.validatePattern(newPattern);
    setValidationErrors(validation.errors);
  };

  // Generate preview dates
  useEffect(() => {
    if (pattern.type === 'none') {
      setPreviewDates([]);
      return;
    }

    try {
      const baseAppointment = {
        id: 'preview',
        date: startDate,
        startTime: '09:00',
        endTime: '10:00',
        title: 'Preview',
        description: '',
        type: 'meeting',
        location: '',
        projectId: 'preview',
        attendees: [],
        teamMembers: [],
        equipment: [],
        priority: 'medium',
        customerNotification: false,
        reminderTime: '15',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        recurrencePattern: pattern,
        isRecurring: true,
        seriesId: 'preview-series'
      };

      const options = {
        startDate: new Date(startDate),
        endDate: addMonths(new Date(startDate), 3), // Show 3 months preview
        maxOccurrences: 10 // Limit preview to 10 occurrences
      };

      const occurrences = RecurrenceService.generateOccurrences(baseAppointment, options);
      const dates = occurrences.map(occ => new Date(occ.date));
      setPreviewDates(dates);
    } catch (error) {
      console.error('Error generating preview:', error);
      setPreviewDates([]);
    }
  }, [pattern, startDate]);

  const handleWeekDayToggle = (weekDay: WeekDay, checked: boolean) => {
    const currentWeekDays = pattern.weekDays || [];
    const newWeekDays = checked
      ? [...currentWeekDays, weekDay]
      : currentWeekDays.filter(day => day !== weekDay);
    
    updatePattern({ weekDays: newWeekDays });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Serientermin
        </CardTitle>
        <CardDescription>
          Termin automatisch wiederholen
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Enable Recurrence Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="enable-recurrence">Serientermin aktivieren</Label>
          <Switch
            id="enable-recurrence"
            checked={pattern.type !== 'none'}
            onCheckedChange={(checked) => {
              updatePattern({ 
                type: checked ? 'weekly' : 'none',
                interval: 1,
                endType: 'never'
              });
            }}
          />
        </div>

        {pattern.type !== 'none' && (
          <>
            {/* Recurrence Type */}
            <div className="space-y-3">
              <Label>Wiederholungsart</Label>
              <Select 
                value={pattern.type} 
                onValueChange={(value: RecurrenceType) => updatePattern({ type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Täglich</SelectItem>
                  <SelectItem value="weekly">Wöchentlich</SelectItem>
                  <SelectItem value="monthly">Monatlich</SelectItem>
                  <SelectItem value="yearly">Jährlich</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Interval */}
            <div className="space-y-3">
              <Label htmlFor="interval">
                {pattern.type === 'daily' && 'Alle X Tage'}
                {pattern.type === 'weekly' && 'Alle X Wochen'}
                {pattern.type === 'monthly' && 'Alle X Monate'}
                {pattern.type === 'yearly' && 'Alle X Jahre'}
              </Label>
              <div className="flex items-center gap-2">
                <span>Alle</span>
                <Input
                  id="interval"
                  type="number"
                  min="1"
                  max="99"
                  value={pattern.interval}
                  onChange={(e) => updatePattern({ interval: parseInt(e.target.value) || 1 })}
                  className="w-20"
                />
                <span>
                  {pattern.type === 'daily' && (pattern.interval === 1 ? 'Tag' : 'Tage')}
                  {pattern.type === 'weekly' && (pattern.interval === 1 ? 'Woche' : 'Wochen')}
                  {pattern.type === 'monthly' && (pattern.interval === 1 ? 'Monat' : 'Monate')}
                  {pattern.type === 'yearly' && (pattern.interval === 1 ? 'Jahr' : 'Jahre')}
                </span>
              </div>
            </div>

            {/* Weekly Options */}
            {pattern.type === 'weekly' && (
              <div className="space-y-3">
                <Label>Wochentage</Label>
                <div className="grid grid-cols-2 gap-2">
                  {weekDayOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`weekday-${option.value}`}
                        checked={pattern.weekDays?.includes(option.value) || false}
                        onCheckedChange={(checked) => 
                          handleWeekDayToggle(option.value, checked as boolean)
                        }
                      />
                      <Label 
                        htmlFor={`weekday-${option.value}`}
                        className="text-sm font-normal"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly Options */}
            {pattern.type === 'monthly' && (
              <div className="space-y-4">
                <Label>Monatliche Wiederholung</Label>
                <RadioGroup
                  value={pattern.monthlyType || 'date'}
                  onValueChange={(value: MonthlyType) => updatePattern({ monthlyType: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="date" id="monthly-date" />
                    <Label htmlFor="monthly-date" className="flex items-center gap-2">
                      Am Tag
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        value={pattern.dayOfMonth || new Date(startDate).getDate()}
                        onChange={(e) => updatePattern({ dayOfMonth: parseInt(e.target.value) || 1 })}
                        className="w-16 h-8"
                        disabled={pattern.monthlyType !== 'date'}
                      />
                      des Monats
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="weekday" id="monthly-weekday" />
                    <Label htmlFor="monthly-weekday" className="flex items-center gap-2">
                      Am
                      <Select
                        value={pattern.weekOfMonth?.toString() || '1'}
                        onValueChange={(value) => updatePattern({ weekOfMonth: parseInt(value) })}
                        disabled={pattern.monthlyType !== 'weekday'}
                      >
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">ersten</SelectItem>
                          <SelectItem value="2">zweiten</SelectItem>
                          <SelectItem value="3">dritten</SelectItem>
                          <SelectItem value="4">vierten</SelectItem>
                          <SelectItem value="5">letzten</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select
                        value={pattern.weekDay || 'monday'}
                        onValueChange={(value: WeekDay) => updatePattern({ weekDay: value })}
                        disabled={pattern.monthlyType !== 'weekday'}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {weekDayOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      des Monats
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* End Conditions */}
            <div className="space-y-4">
              <Label>Ende der Wiederholung</Label>
              <RadioGroup
                value={pattern.endType}
                onValueChange={(value: EndType) => updatePattern({ endType: value })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="never" id="end-never" />
                  <Label htmlFor="end-never">Niemals</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="after" id="end-after" />
                  <Label htmlFor="end-after" className="flex items-center gap-2">
                    Nach
                    <Input
                      type="number"
                      min="1"
                      max="999"
                      value={pattern.occurrences || 10}
                      onChange={(e) => updatePattern({ occurrences: parseInt(e.target.value) || 10 })}
                      className="w-20 h-8"
                      disabled={pattern.endType !== 'after'}
                    />
                    Terminen
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="on" id="end-on" />
                  <Label htmlFor="end-on" className="flex items-center gap-2">
                    Am
                    <Input
                      type="date"
                      value={pattern.endDate || ''}
                      onChange={(e) => updatePattern({ endDate: e.target.value })}
                      className="w-40 h-8"
                      disabled={pattern.endType !== 'on'}
                    />
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800 dark:text-red-200">
                    Konfigurationsfehler
                  </span>
                </div>
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preview */}
            {previewDates.length > 0 && validationErrors.length === 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <Label className="text-sm font-medium">Vorschau der nächsten Termine</Label>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                    {RecurrenceService.getRecurrenceDescription(pattern)}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {previewDates.slice(0, 6).map((date, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {format(date, 'dd.MM.yyyy', { locale: de })}
                      </Badge>
                    ))}
                    {previewDates.length > 6 && (
                      <Badge variant="outline" className="text-xs">
                        +{previewDates.length - 6} weitere
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RecurrenceOptions;