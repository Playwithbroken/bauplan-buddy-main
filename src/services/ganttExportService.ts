/**
 * Gantt/Project Export Service
 * Export project schedules to various formats
 */

export interface GanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number; // 0-100
  dependencies?: string[];
  assignee?: string;
  color?: string;
  milestone?: boolean;
  parentId?: string;
  notes?: string;
  resources?: string[];
}

export interface GanttResource {
  id: string;
  name: string;
  type: 'person' | 'equipment' | 'material';
  capacity?: number;
  cost?: number;
}

export interface GanttProject {
  name: string;
  tasks: GanttTask[];
  resources?: GanttResource[];
  author?: string;
  company?: string;
  createdAt: Date;
  currency?: string;
}

export type ExportFormat = 'xml' | 'csv' | 'json' | 'ics';

// XML Template for MS Project compatible export
const generateMSProjectXML = (project: GanttProject): string => {
  const escapeXml = (str: string) => 
    str.replace(/[<>&'"]/g, c => ({
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      "'": '&apos;',
      '"': '&quot;',
    }[c] || c));

  const formatDate = (date: Date) => date.toISOString();
  const formatDuration = (start: Date, end: Date) => {
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return `PT${days * 8}H0M0S`; // Assuming 8-hour workdays
  };

  let xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Project xmlns="http://schemas.microsoft.com/project">
  <Name>${escapeXml(project.name)}</Name>
  <Title>${escapeXml(project.name)}</Title>
  <Author>${escapeXml(project.author || 'Bauplan Buddy')}</Author>
  <Company>${escapeXml(project.company || '')}</Company>
  <CreationDate>${formatDate(project.createdAt)}</CreationDate>
  <CurrencyCode>${project.currency || 'EUR'}</CurrencyCode>
  <CalendarUID>1</CalendarUID>
  <DefaultStartTime>08:00:00</DefaultStartTime>
  <DefaultFinishTime>17:00:00</DefaultFinishTime>
  <HoursPerDay>8</HoursPerDay>
  <HoursPerWeek>40</HoursPerWeek>
  <DaysPerMonth>20</DaysPerMonth>
  <Calendars>
    <Calendar>
      <UID>1</UID>
      <Name>Standard</Name>
      <IsBaseCalendar>true</IsBaseCalendar>
      <WeekDays>
        <WeekDay>
          <DayType>1</DayType>
          <DayWorking>0</DayWorking>
        </WeekDay>
        <WeekDay>
          <DayType>7</DayType>
          <DayWorking>0</DayWorking>
        </WeekDay>
      </WeekDays>
    </Calendar>
  </Calendars>
  <Tasks>`;

  // Add tasks
  project.tasks.forEach((task, index) => {
    xml += `
    <Task>
      <UID>${index + 1}</UID>
      <ID>${index + 1}</ID>
      <Name>${escapeXml(task.name)}</Name>
      <Start>${formatDate(task.start)}</Start>
      <Finish>${formatDate(task.end)}</Finish>
      <Duration>${formatDuration(task.start, task.end)}</Duration>
      <PercentComplete>${task.progress}</PercentComplete>
      <Milestone>${task.milestone ? 1 : 0}</Milestone>
      ${task.notes ? `<Notes>${escapeXml(task.notes)}</Notes>` : ''}
    </Task>`;
  });

  xml += `
  </Tasks>
  <Resources>`;

  // Add resources
  (project.resources || []).forEach((resource, index) => {
    xml += `
    <Resource>
      <UID>${index + 1}</UID>
      <ID>${index + 1}</ID>
      <Name>${escapeXml(resource.name)}</Name>
      <Type>${resource.type === 'person' ? 1 : resource.type === 'equipment' ? 2 : 3}</Type>
      ${resource.cost ? `<Cost>${resource.cost}</Cost>` : ''}
    </Resource>`;
  });

  xml += `
  </Resources>
</Project>`;

  return xml;
};

// CSV export
const generateCSV = (project: GanttProject): string => {
  const headers = [
    'ID',
    'Task Name',
    'Start Date',
    'End Date',
    'Duration (Days)',
    'Progress (%)',
    'Dependencies',
    'Assignee',
    'Milestone',
    'Notes',
  ];

  const rows = project.tasks.map((task, index) => {
    const duration = Math.ceil(
      (task.end.getTime() - task.start.getTime()) / (1000 * 60 * 60 * 24)
    );
    return [
      index + 1,
      `"${task.name.replace(/"/g, '""')}"`,
      task.start.toISOString().split('T')[0],
      task.end.toISOString().split('T')[0],
      duration,
      task.progress,
      task.dependencies?.join(';') || '',
      task.assignee || '',
      task.milestone ? 'Yes' : 'No',
      task.notes ? `"${task.notes.replace(/"/g, '""')}"` : '',
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};

// iCalendar export (for tasks as events)
const generateICS = (project: GanttProject): string => {
  const formatICSDate = (date: Date) => 
    date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Bauplan Buddy//Gantt Export//DE
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${project.name}`;

  project.tasks.forEach((task) => {
    ics += `
BEGIN:VEVENT
UID:${task.id}@bauplan-buddy
DTSTART:${formatICSDate(task.start)}
DTEND:${formatICSDate(task.end)}
SUMMARY:${task.name}
DESCRIPTION:Fortschritt: ${task.progress}%${task.notes ? '\\n' + task.notes : ''}
${task.assignee ? `ORGANIZER:mailto:${task.assignee}@example.com` : ''}
STATUS:${task.progress === 100 ? 'COMPLETED' : 'IN-PROCESS'}
END:VEVENT`;
  });

  ics += `
END:VCALENDAR`;

  return ics;
};

// JSON export with full structure
const generateJSON = (project: GanttProject): string => {
  return JSON.stringify(project, (key, value) => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  }, 2);
};

class GanttExportService {
  /**
   * Export Gantt project to specified format
   */
  async export(
    project: GanttProject,
    format: ExportFormat
  ): Promise<{ content: string; mimeType: string; extension: string }> {
    let content: string;
    let mimeType: string;
    let extension: string;

    switch (format) {
      case 'xml':
        content = generateMSProjectXML(project);
        mimeType = 'application/xml';
        extension = 'xml';
        break;
      case 'csv':
        content = generateCSV(project);
        mimeType = 'text/csv';
        extension = 'csv';
        break;
      case 'ics':
        content = generateICS(project);
        mimeType = 'text/calendar';
        extension = 'ics';
        break;
      case 'json':
      default:
        content = generateJSON(project);
        mimeType = 'application/json';
        extension = 'json';
    }

    return { content, mimeType, extension };
  }

  /**
   * Download export file
   */
  async download(project: GanttProject, format: ExportFormat): Promise<void> {
    const { content, mimeType, extension } = await this.export(project, format);
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name.replace(/[^a-z0-9]/gi, '_')}_export.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Validate project data before export
   */
  validate(project: GanttProject): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!project.name) {
      errors.push('Projektname fehlt');
    }

    if (!project.tasks || project.tasks.length === 0) {
      errors.push('Keine Aufgaben vorhanden');
    }

    project.tasks.forEach((task, index) => {
      if (!task.name) {
        errors.push(`Aufgabe ${index + 1}: Name fehlt`);
      }
      if (!task.start) {
        errors.push(`Aufgabe ${index + 1}: Startdatum fehlt`);
      }
      if (!task.end) {
        errors.push(`Aufgabe ${index + 1}: Enddatum fehlt`);
      }
      if (task.start && task.end && task.start > task.end) {
        errors.push(`Aufgabe ${index + 1}: Startdatum liegt nach Enddatum`);
      }
    });

    // Check for circular dependencies
    const dependencyMap = new Map<string, string[]>();
    project.tasks.forEach(task => {
      if (task.dependencies) {
        dependencyMap.set(task.id, task.dependencies);
      }
    });

    const visited = new Set<string>();
    const checkCircular = (id: string, path: Set<string>): boolean => {
      if (path.has(id)) return true;
      if (visited.has(id)) return false;
      
      visited.add(id);
      path.add(id);
      
      const deps = dependencyMap.get(id) || [];
      for (const dep of deps) {
        if (checkCircular(dep, path)) {
          errors.push(`Zirkuläre Abhängigkeit gefunden bei: ${id}`);
          return true;
        }
      }
      
      path.delete(id);
      return false;
    };

    project.tasks.forEach(task => {
      checkCircular(task.id, new Set());
    });

    return { valid: errors.length === 0, errors };
  }
}

// Export singleton
export const ganttExportService = new GanttExportService();
export default ganttExportService;
