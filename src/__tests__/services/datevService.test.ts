import datevService, { DATEVBooking, DATEVExportOptions, formatNumber, formatDateDATEV } from '@/services/datevService';

describe('DATEVService', () => {
    let mockBooking: DATEVBooking[];
    let mockOptions: DATEVExportOptions;

    beforeEach(() => {
        mockBooking = [
            {
                amount: 1190.00,
                debitAccount: '1200', // Bank
                creditAccount: '8400', // Erlöse 19%
                date: new Date('2024-03-15'),
                documentNumber: 'RE-2024-001',
                description: 'Rechnung Projekt Alpha',
                taxCode: '3'
            }
        ];

        mockOptions = {
            consultant: '1234567',
            client: '12345',
            fiscalYearStart: new Date('2024-01-01'),
            accountLength: 4,
            dateFrom: new Date('2024-03-01'),
            dateTo: new Date('2024-03-31'),
            description: 'Test Export'
        };
    });

    test('should validate DATEV options correctly', () => {
        const validErrors = datevService.validateOptions(mockOptions);
        expect(validErrors.length).toBe(0);

        const invalidOptions = { ...mockOptions, consultant: '123' };
        const errors = datevService.validateOptions(invalidOptions);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors).toContain('Beraternummer muss genau 7 Ziffern haben');
    });

    test('should format numbers for DATEV (German format)', () => {
        expect(formatNumber(1234.56)).toBe('1234,56');
    });

    test('should format dates for DATEV (DDMM)', () => {
        expect(formatDateDATEV(new Date('2024-03-15'))).toBe('1503');
    });

    test('should build correctly formatted header', () => {
        // @ts-ignore - access private method
        const header = (datevService as any).buildHeader(mockOptions, 'Buchungsstapel', 1);
        expect(header).toContain('"EXTF"');
        expect(header).toContain('700');
        expect(header).toContain('1234567');
        expect(header).toContain('12345');
    });

    test('should export bookings to CSV string', () => {
        const csv = datevService.exportBookings(mockBooking, mockOptions);
        const lines = csv.split('\n');
        expect(lines.length).toBe(3); // Header + ColumnHeader + Line
        expect(csv).toContain('1190,00');
        expect(csv).toContain('RE-2024-001');
        expect(csv).toContain('1503');
    });

    test('should perform full export and return result object', async () => {
        const result = await datevService.fullExport(mockBooking, [], [], [], mockOptions);
        expect(result.success).toBe(true);
        expect(result.files.length).toBe(1);
        expect(result.statistics.bookings).toBe(1);
        expect(result.statistics.totalDebit).toBe(1190);
    });

    test('should handle invalid consultant number in full export', async () => {
        const invalidOptions = { ...mockOptions, consultant: '123' };
        const result = await datevService.fullExport(mockBooking, [], [], [], invalidOptions);
        expect(result.success).toBe(false);
        expect(result.errors).toContain('Beraternummer muss 7-stellig sein');
    });
});
