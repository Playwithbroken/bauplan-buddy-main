import notificationBotService, { NotificationRecipient, BotMessage } from '@/services/notificationBotService';

describe('NotificationBotService', () => {
    let mockRecipient: Omit<NotificationRecipient, 'id'> & { id?: string };

    beforeEach(() => {
        mockRecipient = {
            name: 'Hans Müller',
            platform: 'whatsapp',
            identifier: '+49123456789',
            verified: false,
            preferences: {
                projectUpdates: true,
                taskAssignments: true,
                deadlineReminders: true,
                invoiceAlerts: true,
                chatMessages: true
            }
        };

        // Reset service state
        (notificationBotService as any).recipients.clear();
        (notificationBotService as any).config.clear();
        (notificationBotService as any).initialize();
        
        // Mock localStorage
        const store: Record<string, string> = {};
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: (key: string) => store[key] || null,
                setItem: (key: string, value: string) => { store[key] = value },
                removeItem: (key: string) => { delete store[key] },
                clear: () => { Object.keys(store).forEach(k => delete store[k]) }
            },
            writable: true
        });

        // Mock console.log to avoid noise
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    test('should add and retrieve recipients', () => {
        const added = notificationBotService.addRecipient(mockRecipient as any);
        expect(added.id).toBeDefined();
        expect(notificationBotService.getRecipients()[0].identifier).toBe('+49123456789');
    });

    test('should handle verification flow', async () => {
        const recipient = notificationBotService.addRecipient(mockRecipient as any);
        notificationBotService.configurePlatform({ platform: 'whatsapp', apiKey: 'test-key' });

        const sent = await notificationBotService.sendVerification(recipient.id);
        expect(sent).toBe(true);

        const code = localStorage.getItem(`verify-${recipient.id}`);
        expect(code).toBeDefined();

        const verified = notificationBotService.verifyRecipient(recipient.id, code!);
        expect(verified).toBe(true);
        expect(notificationBotService.getRecipients().find(r => r.id === recipient.id)?.verified).toBe(true);
    });

    test('should send template messages correctly', async () => {
        const recipient = notificationBotService.addRecipient({ ...mockRecipient, verified: true } as any);
        notificationBotService.configurePlatform({ platform: 'whatsapp', apiKey: 'test-key' });

        const result = await notificationBotService.sendTemplateMessage(
            recipient.id,
            'project-update',
            { projectName: 'Hotel Neubau', updateText: 'Betonage abgeschlossen', updatedBy: 'Schmidt' }
        );

        expect(result).not.toBeNull();
        expect(result?.status).toBe('sent');
        expect(result?.content).toContain('Hotel Neubau');
        expect(result?.content).toContain('Betonage abgeschlossen');
    });

    test('should respect user preferences', async () => {
        const recipient = notificationBotService.addRecipient({
            ...mockRecipient,
            verified: true,
            preferences: { ...mockRecipient.preferences, projectUpdates: false }
        } as any);
        notificationBotService.configurePlatform({ platform: 'whatsapp', apiKey: 'test-key' });

        const result = await notificationBotService.sendTemplateMessage(
            recipient.id,
            'project-update',
            { projectName: 'Test', updateText: 'Update', updatedBy: 'User' }
        );

        expect(result).toBeNull(); // Should not send due to preference
    });

    test('should broadcast messages to verified recipients', async () => {
        (notificationBotService as any).recipients.clear();
        (notificationBotService as any).templates.clear();
        
        notificationBotService.configurePlatform({ platform: 'whatsapp', apiKey: 'test-key' });

        // Add template
        notificationBotService.addTemplate({
            name: 'Test Project Update',
            platform: 'whatsapp',
            category: 'project',
            content: 'Update: {{projectName}}',
            variables: ['projectName']
        });
        
        // Add recipients
        const r1 = notificationBotService.addRecipient({ ...mockRecipient } as any);
        r1.verified = true; // Ensure verified
        
        const r2 = notificationBotService.addRecipient({ ...mockRecipient, identifier: '+49987654321' } as any);
        r2.verified = false;

        const result = await notificationBotService.broadcast(
            'project',
            'any-id',
            { projectName: 'Global' }
        );

        expect(result.sent).toBe(1);
    });
});
