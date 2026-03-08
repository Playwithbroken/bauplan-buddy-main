import { StoredAppointment } from './appointmentService';

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'ical';
  appointments: StoredAppointment[];
  title?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export class AppointmentExportService {
  
  /**
   * Export appointments in the specified format
   */
  static exportAppointments(options: ExportOptions): void {
    switch (options.format) {
      case 'pdf':
        this.exportToPDF(options);
        break;
      case 'excel':
        this.exportToExcel(options);
        break;
      case 'ical':
        this.exportToICal(options);
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Export single appointment
   */
  static exportSingleAppointment(appointment: StoredAppointment, format: 'pdf' | 'excel' | 'ical'): void {
    this.exportAppointments({
      format,
      appointments: [appointment],
      title: `Termin: ${appointment.title}`
    });
  }

  /**
   * Export to PDF format
   */
  private static exportToPDF(options: ExportOptions): void {
    const { appointments, title = 'Terminübersicht' } = options;
    
    // Create PDF content using simple HTML approach
    const htmlContent = this.generatePDFHTML(appointments, title);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Trigger print dialog
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  }

  /**
   * Export to Excel format (CSV)
   */
  private static exportToExcel(options: ExportOptions): void {
    const { appointments, title = 'Terminübersicht' } = options;
    
    // Create CSV content
    const csvContent = this.generateCSVContent(appointments);
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${this.sanitizeFilename(title)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Export to iCal format
   */
  private static exportToICal(options: ExportOptions): void {
    const { appointments, title = 'Bauplan Buddy Termine' } = options;
    
    // Generate iCal content
    const icalContent = this.generateICalContent(appointments, title);
    
    // Create and download file
    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${this.sanitizeFilename(title)}.ics`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Generate HTML content for PDF export
   */
  private static generatePDFHTML(appointments: StoredAppointment[], title: string): string {
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    };
    const formatDateTime = (dateStr: string) => new Date(dateStr).toLocaleString('de-DE');
    
    const getTypeText = (type: string) => {
      switch (type) {
        case 'site-visit': return 'Baustellenbesichtigung';
        case 'meeting': return 'Besprechung';
        case 'delivery': return 'Lieferung';
        case 'milestone': return 'Meilenstein';
        case 'inspection': return 'Inspektion';
        case 'internal': return 'Intern';
        default: return 'Sonstiges';
      }
    };

    const getPriorityText = (priority: string) => {
      switch (priority) {
        case 'critical': return 'Kritisch';
        case 'high': return 'Hoch';
        case 'medium': return 'Mittel';
        case 'low': return 'Niedrig';
        default: return 'Normal';
      }
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #0066cc;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #0066cc;
            margin: 0;
          }
          .header p {
            margin: 5px 0;
            color: #666;
          }
          .appointment {
            border: 1px solid #ddd;
            margin-bottom: 20px;
            padding: 15px;
            border-radius: 5px;
            page-break-inside: avoid;
          }
          .appointment-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
          }
          .appointment-title {
            font-size: 18px;
            font-weight: bold;
            color: #0066cc;
          }
          .priority {
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: bold;
          }
          .priority.critical { background-color: #fee; color: #d00; }
          .priority.high { background-color: #fff3cd; color: #856404; }
          .priority.medium { background-color: #d4edda; color: #155724; }
          .priority.low { background-color: #cce5ff; color: #004085; }
          .appointment-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 10px;
          }
          .detail-group {
            margin-bottom: 10px;
          }
          .detail-label {
            font-weight: bold;
            color: #666;
            font-size: 12px;
            text-transform: uppercase;
          }
          .detail-value {
            margin-top: 2px;
            font-size: 14px;
          }
          .description {
            grid-column: 1 / -1;
            margin-top: 10px;
            padding: 10px;
            background-color: #f8f9fa;
            border-radius: 3px;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
          @media print {
            body { margin: 0; }
            .appointment { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <p>Generiert am ${formatDateTime(new Date().toISOString())}</p>
          <p>Anzahl Termine: ${appointments.length}</p>
        </div>

        ${appointments.map(appointment => `
          <div class="appointment">
            <div class="appointment-header">
              <div class="appointment-title">${appointment.title}</div>
              <div class="priority ${appointment.priority}">${getPriorityText(appointment.priority)}</div>
            </div>
            
            <div class="appointment-details">
              <div class="detail-group">
                <div class="detail-label">Typ</div>
                <div class="detail-value">${getTypeText(appointment.type)}</div>
              </div>
              
              <div class="detail-group">
                <div class="detail-label">Datum</div>
                <div class="detail-value">${formatDate(appointment.date)}</div>
              </div>
              
              <div class="detail-group">
                <div class="detail-label">Uhrzeit</div>
                <div class="detail-value">${appointment.startTime} - ${appointment.endTime}</div>
              </div>
              
              <div class="detail-group">
                <div class="detail-label">Ort</div>
                <div class="detail-value">${appointment.location || 'Nicht angegeben'}</div>
              </div>
              
              ${appointment.projectId && appointment.projectId !== 'no-project' ? `
                <div class="detail-group">
                  <div class="detail-label">Projekt</div>
                  <div class="detail-value">${appointment.projectId}</div>
                </div>
              ` : ''}
              
              ${appointment.attendees.length > 0 ? `
                <div class="detail-group">
                  <div class="detail-label">Teilnehmer</div>
                  <div class="detail-value">${appointment.attendees.join(', ')}</div>
                </div>
              ` : ''}
              
              ${appointment.teamMembers.length > 0 ? `
                <div class="detail-group">
                  <div class="detail-label">Team</div>
                  <div class="detail-value">${appointment.teamMembers.join(', ')}</div>
                </div>
              ` : ''}
              
              ${appointment.equipment.length > 0 ? `
                <div class="detail-group">
                  <div class="detail-label">Ausrüstung</div>
                  <div class="detail-value">${appointment.equipment.join(', ')}</div>
                </div>
              ` : ''}
              
              ${appointment.description ? `
                <div class="description">
                  <div class="detail-label">Beschreibung</div>
                  <div class="detail-value">${appointment.description}</div>
                </div>
              ` : ''}
            </div>
          </div>
        `).join('')}

        <div class="footer">
          <p>Bauplan Buddy - Baustellenmanagement System</p>
          <p>Exportiert am ${formatDateTime(new Date().toISOString())}</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate CSV content for Excel export
   */
  private static generateCSVContent(appointments: StoredAppointment[]): string {
    const headers = [
      'Titel',
      'Typ', 
      'Datum',
      'Startzeit',
      'Endzeit',
      'Ort',
      'Beschreibung',
      'Projekt-ID',
      'Teilnehmer',
      'Team',
      'Ausrüstung',
      'Priorität',
      'Kunden-Benachrichtigung',
      'Erinnerungszeit',
      'Erstellt am',
      'ID'
    ];

    const getTypeText = (type: string) => {
      switch (type) {
        case 'site-visit': return 'Baustellenbesichtigung';
        case 'meeting': return 'Besprechung';
        case 'delivery': return 'Lieferung';
        case 'milestone': return 'Meilenstein';
        case 'inspection': return 'Inspektion';
        case 'internal': return 'Intern';
        default: return 'Sonstiges';
      }
    };

    const getPriorityText = (priority: string) => {
      switch (priority) {
        case 'critical': return 'Kritisch';
        case 'high': return 'Hoch';
        case 'medium': return 'Mittel';
        case 'low': return 'Niedrig';
        default: return 'Normal';
      }
    };

    const escapeCsvValue = (value: string): string => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const rows = appointments.map(appointment => [
      escapeCsvValue(appointment.title),
      escapeCsvValue(getTypeText(appointment.type)),
      escapeCsvValue(new Date(appointment.date).toLocaleDateString('de-DE')),
      escapeCsvValue(appointment.startTime),
      escapeCsvValue(appointment.endTime),
      escapeCsvValue(appointment.location || ''),
      escapeCsvValue(appointment.description || ''),
      escapeCsvValue(appointment.projectId || ''),
      escapeCsvValue(appointment.attendees.join('; ')),
      escapeCsvValue(appointment.teamMembers.join('; ')),
      escapeCsvValue(appointment.equipment.join('; ')),
      escapeCsvValue(getPriorityText(appointment.priority)),
      escapeCsvValue(appointment.customerNotification ? 'Ja' : 'Nein'),
      escapeCsvValue(`${appointment.reminderTime} Min`),
      escapeCsvValue(new Date(appointment.createdAt).toLocaleString('de-DE')),
      escapeCsvValue(appointment.id)
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Generate iCal content
   */
  private static generateICalContent(appointments: StoredAppointment[], title: string): string {
    const formatICalDate = (dateStr: string, timeStr: string): string => {
      const date = new Date(`${dateStr}T${timeStr}:00`);
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const formatDescription = (appointment: StoredAppointment): string => {
      const parts = [];
      
      if (appointment.description) {
        parts.push(`Beschreibung: ${appointment.description}`);
      }
      
      if (appointment.projectId && appointment.projectId !== 'no-project') {
        parts.push(`Projekt: ${appointment.projectId}`);
      }
      
      if (appointment.attendees.length > 0) {
        parts.push(`Teilnehmer: ${appointment.attendees.join(', ')}`);
      }
      
      if (appointment.teamMembers.length > 0) {
        parts.push(`Team: ${appointment.teamMembers.join(', ')}`);
      }
      
      if (appointment.equipment.length > 0) {
        parts.push(`Ausrüstung: ${appointment.equipment.join(', ')}`);
      }
      
      return parts.join('\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
    };

    const events = appointments.map(appointment => {
      const startDateTime = formatICalDate(appointment.date, appointment.startTime);
      const endDateTime = formatICalDate(appointment.date, appointment.endTime);
      const createdDateTime = formatICalDate(appointment.createdAt.split('T')[0], appointment.createdAt.split('T')[1].split('.')[0]);
      const modifiedDateTime = formatICalDate(appointment.updatedAt.split('T')[0], appointment.updatedAt.split('T')[1].split('.')[0]);

      return [
        'BEGIN:VEVENT',
        `UID:${appointment.id}@bauplan-buddy.local`,
        `DTSTART:${startDateTime}`,
        `DTEND:${endDateTime}`,
        `DTSTAMP:${createdDateTime}`,
        `CREATED:${createdDateTime}`,
        `LAST-MODIFIED:${modifiedDateTime}`,
        `SUMMARY:${appointment.title.replace(/,/g, '\\,')}`,
        appointment.location ? `LOCATION:${appointment.location.replace(/,/g, '\\,')}` : '',
        `DESCRIPTION:${formatDescription(appointment)}`,
        `PRIORITY:${this.getICalPriority(appointment.priority)}`,
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE',
        'END:VEVENT'
      ].filter(line => line !== '').join('\r\n');
    });

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Bauplan Buddy//Appointment Export//DE',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${title}`,
      'X-WR-TIMEZONE:Europe/Berlin',
      ...events,
      'END:VCALENDAR'
    ].join('\r\n');
  }

  /**
   * Convert priority to iCal priority (1-9, where 1 is highest)
   */
  private static getICalPriority(priority: string): string {
    switch (priority) {
      case 'critical': return '1';
      case 'high': return '3';
      case 'medium': return '5';
      case 'low': return '7';
      default: return '5';
    }
  }

  /**
   * Sanitize filename for download
   */
  private static sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-z0-9.-]/gi, '_').replace(/_+/g, '_');
  }

  /**
   * Get export statistics
   */
  static getExportStatistics(appointments: StoredAppointment[]): {
    total: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
    dateRange: { start: string; end: string } | null;
  } {
    if (appointments.length === 0) {
      return {
        total: 0,
        byType: {},
        byPriority: {},
        dateRange: null
      };
    }

    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const dates = appointments.map(a => new Date(a.date)).sort((a, b) => a.getTime() - b.getTime());

    appointments.forEach(appointment => {
      byType[appointment.type] = (byType[appointment.type] || 0) + 1;
      byPriority[appointment.priority] = (byPriority[appointment.priority] || 0) + 1;
    });

    return {
      total: appointments.length,
      byType,
      byPriority,
      dateRange: {
        start: dates[0].toLocaleDateString('de-DE'),
        end: dates[dates.length - 1].toLocaleDateString('de-DE')
      }
    };
  }
}