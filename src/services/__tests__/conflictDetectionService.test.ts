import { describe, it, expect, beforeEach } from '@jest/globals';
import { ConflictDetectionService, ConflictDetectionOptions } from '../conflictDetectionService';
import { StoredAppointment } from '../appointmentService';

describe('ConflictDetectionService', () => {
  const baseAppointment: StoredAppointment = {
    id: 'APT-001',
    title: 'Test Appointment',
    description: 'Test description',
    type: 'site-visit',
    date: '2024-03-15',
    startTime: '09:00',
    endTime: '10:00',
    location: 'Test Location',
    projectId: 'PRJ-001',
    attendees: ['John Doe'],
    teamMembers: ['TM-001'],
    equipment: ['EQ-001'],
    priority: 'medium',
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

  const conflictingAppointment: StoredAppointment = {
    ...baseAppointment,
    id: 'APT-002',
    title: 'Conflicting Appointment',
    startTime: '09:30',
    endTime: '10:30',
    teamMembers: ['TM-001'], // Same team member
    equipment: ['EQ-002'] // Different equipment
  };

  const nonConflictingAppointment: StoredAppointment = {
    ...baseAppointment,
    id: 'APT-003',
    title: 'Non-conflicting Appointment',
    startTime: '11:00',
    endTime: '12:00',
    teamMembers: ['TM-002'], // Different team member
    equipment: ['EQ-002'] // Different equipment
  };

  describe('detectConflicts', () => {
    it('should return no conflicts for non-overlapping appointments', () => {
      const testAppointment = {
        date: '2024-03-15',
        startTime: '08:00',
        endTime: '09:00',
        teamMembers: ['TM-001'],
        equipment: ['EQ-001']
      };

      const result = ConflictDetectionService.detectConflicts(
        testAppointment,
        [nonConflictingAppointment]
      );

      expect(result.hasConflicts).toBe(false);
      expect(result.conflicts).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect team member conflicts', () => {
      const testAppointment = {
        date: '2024-03-15',
        startTime: '09:30',
        endTime: '10:30',
        teamMembers: ['TM-001'], // Same as baseAppointment
        equipment: ['EQ-002']
      };

      const result = ConflictDetectionService.detectConflicts(
        testAppointment,
        [baseAppointment]
      );

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe('team');
      expect(result.conflicts[0].resourceId).toBe('TM-001');
      expect(result.conflicts[0].severity).toBe('error');
    });

    it('should detect equipment conflicts', () => {
      const testAppointment = {
        date: '2024-03-15',
        startTime: '09:30',
        endTime: '10:30',
        teamMembers: ['TM-002'],
        equipment: ['EQ-001'] // Same as baseAppointment
      };

      const result = ConflictDetectionService.detectConflicts(
        testAppointment,
        [baseAppointment]
      );

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe('equipment');
      expect(result.conflicts[0].resourceId).toBe('EQ-001');
      expect(result.conflicts[0].severity).toBe('error');
    });

    it('should detect location conflicts for site visits', () => {
      const testAppointment = {
        type: 'site-visit',
        date: '2024-03-15',
        startTime: '09:30',
        endTime: '10:30',
        location: 'Test Location', // Same location as baseAppointment
        teamMembers: ['TM-002'],
        equipment: ['EQ-002']
      };

      const siteVisitAppointment = {
        ...baseAppointment,
        type: 'site-visit'
      };

      const result = ConflictDetectionService.detectConflicts(
        testAppointment,
        [siteVisitAppointment]
      );

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('location');
      expect(result.warnings[0].severity).toBe('warning');
    });

    it('should exclude appointments by ID when specified', () => {
      const testAppointment = {
        date: '2024-03-15',
        startTime: '09:30',
        endTime: '10:30',
        teamMembers: ['TM-001'],
        equipment: ['EQ-001']
      };

      const options: ConflictDetectionOptions = {
        excludeAppointmentId: 'APT-001'
      };

      const result = ConflictDetectionService.detectConflicts(
        testAppointment,
        [baseAppointment],
        options
      );

      expect(result.hasConflicts).toBe(false);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should respect buffer time when detecting conflicts', () => {
      const testAppointment = {
        date: '2024-03-15',
        startTime: '10:00', // Starts exactly when baseAppointment ends
        endTime: '11:00',
        teamMembers: ['TM-001'],
        equipment: ['EQ-001']
      };

      const options: ConflictDetectionOptions = {
        bufferMinutes: 30 // 30-minute buffer
      };

      const result = ConflictDetectionService.detectConflicts(
        testAppointment,
        [baseAppointment],
        options
      );

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts.length).toBeGreaterThan(0);
    });

    it('should handle missing appointment details gracefully', () => {
      const incompleteAppointment = {
        title: 'Incomplete'
      };

      const result = ConflictDetectionService.detectConflicts(
        incompleteAppointment,
        [baseAppointment]
      );

      expect(result.hasConflicts).toBe(false);
      expect(result.suggestions).toContain('Vollständige Termindetails erforderlich für Konfliktprüfung');
    });

    it('should disable team member checking when option is false', () => {
      const testAppointment = {
        date: '2024-03-15',
        startTime: '09:30',
        endTime: '10:30',
        teamMembers: ['TM-001'],
        equipment: ['EQ-002']
      };

      const options: ConflictDetectionOptions = {
        checkTeamMembers: false
      };

      const result = ConflictDetectionService.detectConflicts(
        testAppointment,
        [baseAppointment],
        options
      );

      expect(result.hasConflicts).toBe(false);
      expect(result.conflicts.filter(c => c.type === 'team')).toHaveLength(0);
    });

    it('should disable equipment checking when option is false', () => {
      const testAppointment = {
        date: '2024-03-15',
        startTime: '09:30',
        endTime: '10:30',
        teamMembers: ['TM-002'],
        equipment: ['EQ-001']
      };

      const options: ConflictDetectionOptions = {
        checkEquipment: false
      };

      const result = ConflictDetectionService.detectConflicts(
        testAppointment,
        [baseAppointment],
        options
      );

      expect(result.hasConflicts).toBe(false);
      expect(result.conflicts.filter(c => c.type === 'equipment')).toHaveLength(0);
    });
  });

  describe('getTeamMemberAvailability', () => {
    it('should return availability for team member', () => {
      const result = ConflictDetectionService.getTeamMemberAvailability(
        'TM-001',
        '2024-03-15',
        [baseAppointment]
      );

      expect(result.available).toBe(false);
      expect(result.busySlots).toHaveLength(1);
      expect(result.busySlots[0].start).toBe('09:00');
      expect(result.busySlots[0].end).toBe('10:00');
      expect(result.busySlots[0].appointment).toEqual(baseAppointment);
    });

    it('should return available when team member has no appointments', () => {
      const result = ConflictDetectionService.getTeamMemberAvailability(
        'TM-999',
        '2024-03-15',
        [baseAppointment]
      );

      expect(result.available).toBe(true);
      expect(result.busySlots).toHaveLength(0);
    });
  });

  describe('getEquipmentAvailability', () => {
    it('should return availability for equipment', () => {
      const result = ConflictDetectionService.getEquipmentAvailability(
        'EQ-001',
        '2024-03-15',
        [baseAppointment]
      );

      expect(result.available).toBe(false);
      expect(result.busySlots).toHaveLength(1);
      expect(result.busySlots[0].start).toBe('09:00');
      expect(result.busySlots[0].end).toBe('10:00');
    });

    it('should return available when equipment is not in use', () => {
      const result = ConflictDetectionService.getEquipmentAvailability(
        'EQ-999',
        '2024-03-15',
        [baseAppointment]
      );

      expect(result.available).toBe(true);
      expect(result.busySlots).toHaveLength(0);
    });
  });

  describe('suggestAlternativeTimeSlots', () => {
    it('should suggest alternative time slots when conflicts exist', () => {
      const testAppointment = {
        date: '2024-03-15',
        teamMembers: ['TM-001'],
        equipment: ['EQ-001']
      };

      const result = ConflictDetectionService.suggestAlternativeTimeSlots(
        testAppointment,
        [baseAppointment],
        60 // 1-hour duration
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('start');
      expect(result[0]).toHaveProperty('end');
      expect(result[0]).toHaveProperty('score');
      
      // Should be sorted by score (highest first)
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].score).toBeGreaterThanOrEqual(result[i + 1].score);
      }
    });

    it('should return empty array when no date is provided', () => {
      const testAppointment = {};

      const result = ConflictDetectionService.suggestAlternativeTimeSlots(
        testAppointment,
        [baseAppointment]
      );

      expect(result).toEqual([]);
    });

    it('should limit suggestions to 5 slots', () => {
      const testAppointment = {
        date: '2024-03-16', // Different date with no conflicts
        teamMembers: ['TM-002'],
        equipment: ['EQ-002']
      };

      const result = ConflictDetectionService.suggestAlternativeTimeSlots(
        testAppointment,
        [],
        60
      );

      expect(result.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getConflictSummary', () => {
    it('should return summary for no conflicts', () => {
      const analysis = {
        hasConflicts: false,
        conflicts: [],
        warnings: [],
        suggestions: []
      };

      const result = ConflictDetectionService.getConflictSummary(analysis);

      expect(result).toBe('Keine Konflikte gefunden');
    });

    it('should return summary for conflicts only', () => {
      const analysis = {
        hasConflicts: true,
        conflicts: [{ type: 'team' }, { type: 'equipment' }] as Array<{ type: string }>,
        warnings: [],
        suggestions: []
      };

      const result = ConflictDetectionService.getConflictSummary(analysis);

      expect(result).toBe('2 Konflikte');
    });

    it('should return summary for warnings only', () => {
      const analysis = {
        hasConflicts: false,
        conflicts: [],
        warnings: [{ type: 'location' }] as Array<{ type: string }>,
        suggestions: []
      };

      const result = ConflictDetectionService.getConflictSummary(analysis);

      expect(result).toBe('1 Warnung');
    });

    it('should return summary for both conflicts and warnings', () => {
      const analysis = {
        hasConflicts: true,
        conflicts: [{ type: 'team' }] as Array<{ type: string }>,
        warnings: [{ type: 'location' }, { type: 'time_overlap' }] as Array<{ type: string }>,
        suggestions: []
      };

      const result = ConflictDetectionService.getConflictSummary(analysis);

      expect(result).toBe('1 Konflikt, 2 Warnungen');
    });
  });
});