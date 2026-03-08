import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AppointmentExportService, ExportOptions } from '../appointmentExportService';
import { StoredAppointment } from '../appointmentService';

// Mock window methods for testing exports
const mockOpen = jest.fn();
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();

// Mock document methods
const mockCreateElement = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();

// Setup mocks
Object.defineProperty(window, 'open', {
  value: mockOpen,
  writable: true
});

Object.defineProperty(window.URL, 'createObjectURL', {
  value: mockCreateObjectURL,
  writable: true
});

Object.defineProperty(window.URL, 'revokeObjectURL', {
  value: mockRevokeObjectURL,
  writable: true
});

Object.defineProperty(document, 'createElement', {
  value: mockCreateElement,
  writable: true
});

Object.defineProperty(document.body, 'appendChild', {
  value: mockAppendChild,
  writable: true
});

Object.defineProperty(document.body, 'removeChild', {
  value: mockRemoveChild,
  writable: true
});

// Mock Blob constructor
Object.defineProperty(global, 'Blob', {
  value: jest.fn(),
  writable: true
});

describe('AppointmentExportService', () => {
  const mockAppointment: StoredAppointment = {
    id: 'APT-001',
    title: 'Test Appointment',
    description: 'Test description',
    type: 'site-visit',
    date: '2024-03-15',
    startTime: '09:00',
    endTime: '10:00',
    location: 'Test Location, München',
    projectId: 'PRJ-001',
    attendees: ['John Doe', 'Jane Smith'],
    teamMembers: ['TM-001', 'TM-002'],
    equipment: ['EQ-001'],
    priority: 'high',
    customerNotification: true,
    reminderTime: '15',
    emailNotifications: {
      enabled: false,
      sendInvitations: false,
      sendReminders: false,
      recipients: [],
      customMessage: ''
    },
    createdAt: '2024-03-01T10:00:00.000Z',
    updatedAt: '2024-03-01T10:00:00.000Z'
  };

  const mockAppointment2: StoredAppointment = {
    ...mockAppointment,
    id: 'APT-002',
    title: 'Second Appointment',
    type: 'meeting',
    date: '2024-03-16',
    priority: 'medium'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockOpen.mockReturnValue({
      document: {
        write: jest.fn(),
        close: jest.fn()
      },
      focus: jest.fn(),
      print: jest.fn(),
      close: jest.fn()
    });
    
    mockCreateElement.mockReturnValue({
      setAttribute: jest.fn(),
      click: jest.fn(),
      style: {}
    });
    
    mockCreateObjectURL.mockReturnValue('blob:mock-url');
  });

  describe('exportAppointments', () => {
    it('should export to PDF format', () => {
      const options: ExportOptions = {
        format: 'pdf',
        appointments: [mockAppointment],
        title: 'Test Export'
      };

      AppointmentExportService.exportAppointments(options);

      expect(mockOpen).toHaveBeenCalledWith('', '_blank');
    });

    it('should export to Excel format', () => {
      const options: ExportOptions = {
        format: 'excel',
        appointments: [mockAppointment],
        title: 'Test Export'
      };

      AppointmentExportService.exportAppointments(options);

      expect(Blob).toHaveBeenCalledWith(
        expect.any(Array),
        { type: 'text/csv;charset=utf-8;' }
      );
      expect(mockCreateElement).toHaveBeenCalledWith('a');
    });

    it('should export to iCal format', () => {
      const options: ExportOptions = {
        format: 'ical',
        appointments: [mockAppointment],
        title: 'Test Export'
      };

      AppointmentExportService.exportAppointments(options);

      expect(Blob).toHaveBeenCalledWith(
        expect.any(Array),
        { type: 'text/calendar;charset=utf-8;' }
      );
      expect(mockCreateElement).toHaveBeenCalledWith('a');
    });

    it('should throw error for unsupported format', () => {
      const options = {
        format: 'unsupported' as 'pdf' | 'excel' | 'csv' | 'ical',
        appointments: [mockAppointment]
      };

      expect(() => AppointmentExportService.exportAppointments(options))
        .toThrow('Unsupported export format: unsupported');
    });
  });

  describe('exportSingleAppointment', () => {
    it('should export single appointment in PDF format', () => {
      const exportSpy = jest.spyOn(AppointmentExportService, 'exportAppointments');
      
      AppointmentExportService.exportSingleAppointment(mockAppointment, 'pdf');
      
      expect(exportSpy).toHaveBeenCalledWith({
        format: 'pdf',
        appointments: [mockAppointment],
        title: 'Termin: Test Appointment'
      });
    });

    it('should export single appointment in Excel format', () => {
      const exportSpy = jest.spyOn(AppointmentExportService, 'exportAppointments');
      
      AppointmentExportService.exportSingleAppointment(mockAppointment, 'excel');
      
      expect(exportSpy).toHaveBeenCalledWith({
        format: 'excel',
        appointments: [mockAppointment],
        title: 'Termin: Test Appointment'
      });
    });

    it('should export single appointment in iCal format', () => {
      const exportSpy = jest.spyOn(AppointmentExportService, 'exportAppointments');
      
      AppointmentExportService.exportSingleAppointment(mockAppointment, 'ical');
      
      expect(exportSpy).toHaveBeenCalledWith({
        format: 'ical',
        appointments: [mockAppointment],
        title: 'Termin: Test Appointment'
      });
    });
  });

  describe('getExportStatistics', () => {
    it('should return correct statistics for multiple appointments', () => {
      const appointments = [mockAppointment, mockAppointment2];
      
      const stats = AppointmentExportService.getExportStatistics(appointments);
      
      expect(stats.total).toBe(2);
      expect(stats.byType['site-visit']).toBe(1);
      expect(stats.byType['meeting']).toBe(1);
      expect(stats.byPriority['high']).toBe(1);
      expect(stats.byPriority['medium']).toBe(1);
      expect(stats.dateRange).toEqual({
        start: '15.03.2024',
        end: '16.03.2024'
      });
    });

    it('should return empty statistics for no appointments', () => {
      const stats = AppointmentExportService.getExportStatistics([]);
      
      expect(stats.total).toBe(0);
      expect(stats.byType).toEqual({});
      expect(stats.byPriority).toEqual({});
      expect(stats.dateRange).toBeNull();
    });

    it('should handle single appointment correctly', () => {
      const stats = AppointmentExportService.getExportStatistics([mockAppointment]);
      
      expect(stats.total).toBe(1);
      expect(stats.byType['site-visit']).toBe(1);
      expect(stats.byPriority['high']).toBe(1);
      expect(stats.dateRange).toEqual({
        start: '15.03.2024',
        end: '15.03.2024'
      });
    });
  });

  describe('CSV Generation', () => {
    it('should generate proper CSV content', () => {
      // Access private method for testing
      const csvContent = (AppointmentExportService as unknown as { generateCSVContent: (appointments: unknown[]) => string }).generateCSVContent([mockAppointment]);
      
      expect(csvContent).toContain('Titel,Typ,Datum,Startzeit,Endzeit');
      expect(csvContent).toContain('Test Appointment');
      expect(csvContent).toContain('Baustellenbesichtigung');
      expect(csvContent).toContain('15.03.2024');
      expect(csvContent).toContain('09:00');
      expect(csvContent).toContain('10:00');
    });

    it('should escape CSV values with commas', () => {
      const appointmentWithComma = {
        ...mockAppointment,
        description: 'Description, with comma'
      };
      
      const csvContent = (AppointmentExportService as unknown as { generateCSVContent: (appointments: unknown[]) => string }).generateCSVContent([appointmentWithComma]);
      
      expect(csvContent).toContain('"Description, with comma"');
    });

    it('should escape CSV values with quotes', () => {
      const appointmentWithQuote = {
        ...mockAppointment,
        description: 'Description "with quotes"'
      };
      
      const csvContent = (AppointmentExportService as unknown as { generateCSVContent: (appointments: unknown[]) => string }).generateCSVContent([appointmentWithQuote]);
      
      expect(csvContent).toContain('"Description ""with quotes"""');
    });
  });

  describe('iCal Generation', () => {
    it('should generate proper iCal content', () => {
      const icalContent = (AppointmentExportService as unknown as { generateICalContent: (appointments: unknown[], title: string) => string }).generateICalContent([mockAppointment], 'Test Calendar');
      
      expect(icalContent).toContain('BEGIN:VCALENDAR');
      expect(icalContent).toContain('END:VCALENDAR');
      expect(icalContent).toContain('BEGIN:VEVENT');
      expect(icalContent).toContain('END:VEVENT');
      expect(icalContent).toContain('SUMMARY:Test Appointment');
      expect(icalContent).toContain('LOCATION:Test Location\\, München');
      expect(icalContent).toContain('UID:APT-001@bauplan-buddy.local');
    });

    it('should handle appointments without location', () => {
      const appointmentNoLocation = {
        ...mockAppointment,
        location: ''
      };
      
      const icalContent = (AppointmentExportService as unknown as { generateICalContent: (appointments: unknown[], title: string) => string }).generateICalContent([appointmentNoLocation], 'Test Calendar');
      
      expect(icalContent).toContain('SUMMARY:Test Appointment');
      expect(icalContent).not.toContain('LOCATION:');
    });

    it('should format description with appointment details', () => {
      const icalContent = (AppointmentExportService as unknown as { generateICalContent: (appointments: unknown[], title: string) => string }).generateICalContent([mockAppointment], 'Test Calendar');
      
      expect(icalContent).toContain('DESCRIPTION:Beschreibung: Test description');
      expect(icalContent).toContain('Projekt: PRJ-001');
      expect(icalContent).toContain('Teilnehmer: John Doe\\, Jane Smith');
      expect(icalContent).toContain('Team: TM-001\\, TM-002');
      expect(icalContent).toContain('Ausrüstung: EQ-001');
    });
  });

  describe('PDF Generation', () => {
    it('should generate proper HTML for PDF', () => {
      const htmlContent = (AppointmentExportService as unknown as { generatePDFHTML: (appointments: unknown[], title: string) => string }).generatePDFHTML([mockAppointment], 'Test Export');
      
      expect(htmlContent).toContain('<!DOCTYPE html>');
      expect(htmlContent).toContain('<title>Test Export</title>');
      expect(htmlContent).toContain('Test Appointment');
      expect(htmlContent).toContain('Baustellenbesichtigung');
      expect(htmlContent).toContain('15.03.2024');
      expect(htmlContent).toContain('09:00 - 10:00');
      expect(htmlContent).toContain('Test Location, München');
    });

    it('should handle appointments without optional fields', () => {
      const minimalAppointment = {
        ...mockAppointment,
        description: '',
        projectId: 'no-project',
        attendees: [],
        teamMembers: [],
        equipment: [],
        location: ''
      };
      
      const htmlContent = (AppointmentExportService as unknown as { generatePDFHTML: (appointments: unknown[], title: string) => string }).generatePDFHTML([minimalAppointment], 'Test Export');
      
      expect(htmlContent).toContain('Test Appointment');
      expect(htmlContent).toContain('Nicht angegeben'); // For empty location
    });

    it('should apply correct priority styling', () => {
      const criticalAppointment = {
        ...mockAppointment,
        priority: 'critical'
      };
      
      const htmlContent = (AppointmentExportService as unknown as { generatePDFHTML: (appointments: unknown[], title: string) => string }).generatePDFHTML([criticalAppointment], 'Test Export');
      
      expect(htmlContent).toContain('priority critical');
      expect(htmlContent).toContain('Kritisch');
    });
  });

  describe('Utility Methods', () => {
    it('should sanitize filenames correctly', () => {
      const sanitized = (AppointmentExportService as unknown as { sanitizeFilename: (filename: string) => string }).sanitizeFilename('Test File / Name: Special-Chars!');
      
      expect(sanitized).toBe('Test_File___Name__Special-Chars_');
    });

    it('should convert priority to iCal priority correctly', () => {
      const service = AppointmentExportService as unknown as { getICalPriority: (priority: string) => string };
      expect(service.getICalPriority('critical')).toBe('1');
      expect(service.getICalPriority('high')).toBe('3');
      expect(service.getICalPriority('medium')).toBe('5');
      expect(service.getICalPriority('low')).toBe('7');
      expect(service.getICalPriority('unknown')).toBe('5');
    });
  });
});