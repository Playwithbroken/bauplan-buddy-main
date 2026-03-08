import schedulingService, { ScheduleTask, ScheduleResource, ScheduleSlot } from '@/services/schedulingService';

describe('SchedulingService', () => {
    let mockTasks: ScheduleTask[];
    let mockResources: ScheduleResource[];

    beforeEach(() => {
        mockTasks = [
            {
                id: 'task-1',
                name: 'Grundmauer errichten',
                duration: 8,
                priority: 'high',
                projectId: 'project-1',
                skills: ['masonry']
            },
            {
                id: 'task-2',
                name: 'Dachstuhl setzen',
                duration: 12,
                priority: 'high',
                projectId: 'project-1',
                dependencies: ['task-1'],
                skills: ['carpentry']
            }
        ];

        mockResources = [
            {
                id: 'res-1',
                name: 'Hans Maurer',
                type: 'person',
                skills: ['masonry'],
                availability: {
                    monday: { start: '07:00', end: '16:00' },
                    tuesday: { start: '07:00', end: '16:00' },
                    wednesday: { start: '07:00', end: '16:00' },
                    thursday: { start: '07:00', end: '16:00' },
                    friday: { start: '07:00', end: '16:00' }
                },
                costPerHour: 45
            },
            {
                id: 'res-2',
                name: 'Peter Zimmerer',
                type: 'person',
                skills: ['carpentry'],
                availability: {
                    monday: { start: '07:00', end: '16:00' },
                    tuesday: { start: '07:00', end: '16:00' },
                    wednesday: { start: '07:00', end: '16:00' },
                    thursday: { start: '07:00', end: '16:00' },
                    friday: { start: '07:00', end: '16:00' }
                },
                costPerHour: 50
            }
        ];

        schedulingService.setTasks(mockTasks);
        schedulingService.setResources(mockResources);
    });

    test('should sort tasks topologically based on dependencies', () => {
        // @ts-ignore - accessing private method for testing
        const sorted = schedulingService.topologicalSort();
        expect(sorted[0].id).toBe('task-1');
        expect(sorted[1].id).toBe('task-2');
    });

    test('should generate schedule suggestions', async () => {
        const suggestions = await schedulingService.generateSchedule();
        expect(suggestions.length).toBeGreaterThan(0);
        expect(suggestions[0].slots.length).toBe(2);
    });

    test('should detect overlapping resource conflicts', () => {
        const slots: ScheduleSlot[] = [
            {
                taskId: 'task-1',
                resourceId: 'res-1',
                startTime: new Date('2024-01-15T08:00:00Z'),
                endTime: new Date('2024-01-15T12:00:00Z'),
                confidence: 100
            },
            {
                taskId: 'task-2',
                resourceId: 'res-1', // Same resource
                startTime: new Date('2024-01-15T10:00:00Z'), // Overlap
                endTime: new Date('2024-01-15T14:00:00Z'),
                confidence: 100
            }
        ];

        const conflicts = schedulingService.validateSchedule(slots);
        expect(conflicts.some(c => c.type === 'resource')).toBe(true);
        expect(conflicts.find(c => c.type === 'resource')?.taskId).toBe('task-2');
    });

    test('should detect dependency conflicts', () => {
        const slots: ScheduleSlot[] = [
            {
                taskId: 'task-1',
                resourceId: 'res-1',
                startTime: new Date('2024-01-15T10:00:00Z'),
                endTime: new Date('2024-01-15T14:00:00Z'),
                confidence: 100
            },
            {
                taskId: 'task-2', // Depends on task-1
                resourceId: 'res-2',
                startTime: new Date('2024-01-15T08:00:00Z'), // Starts before task-1 ends
                endTime: new Date('2024-01-15T12:00:00Z'),
                confidence: 100
            }
        ];

        const conflicts = schedulingService.validateSchedule(slots);
        expect(conflicts.some(c => c.type === 'dependency')).toBe(true);
        expect(conflicts.find(c => c.type === 'dependency')?.taskId).toBe('task-2');
    });

    test('should find next available slot for a task', () => {
        const slot = schedulingService.findNextSlot('task-1');
        expect(slot).not.toBeNull();
        expect(slot?.taskId).toBe('task-1');
        expect(slot?.resourceId).toBe('res-1');
    });

    test('should suggest optimal resource based on skills', () => {
        const resource = schedulingService.suggestResource('task-2');
        expect(resource).not.toBeNull();
        expect(resource?.id).toBe('res-2'); // res-2 has carpentry skill
    });

    test('should estimate completion date', () => {
        const startDate = new Date('2024-01-01');
        const completion = schedulingService.estimateCompletion([], startDate);
        expect(completion.getTime()).toBeGreaterThan(startDate.getTime());
    });
});
