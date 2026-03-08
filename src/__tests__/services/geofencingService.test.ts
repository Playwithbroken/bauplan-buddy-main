import geofencingService, { GeoCoordinate, Geofence, calculateDistance } from '@/services/geofencingService';

describe('GeofencingService', () => {
    let mockSite: Geofence;
    let mockCoordInside: GeoCoordinate;
    let mockCoordOutside: GeoCoordinate;

    beforeEach(() => {
        // Munich coordinate context
        mockSite = {
            id: 'site-1',
            name: 'Baustelle München Nord',
            center: { latitude: 48.137154, longitude: 11.576124 },
            radius: 100, // 100m
            type: 'site',
            autoLogTime: true
        };

        // ~10m away from center
        mockCoordInside = { latitude: 48.137254, longitude: 11.576124 };
        
        // ~1km away from center
        mockCoordOutside = { latitude: 48.147154, longitude: 11.576124 };

        geofencingService.addGeofence(mockSite);
        // Clear active geofences for each test
        (geofencingService as any).activeGeofences.clear();
        (geofencingService as any).timeEntries.clear();
        
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
        
        // Mock navigator.geolocation
        Object.defineProperty(navigator, 'geolocation', {
            value: {
                watchPosition: jest.fn(),
                clearWatch: jest.fn(),
                getCurrentPosition: jest.fn()
            },
            writable: true
        });
    });

    test('should calculate distance correctly using Haversine formula', () => {
        const distance = calculateDistance(mockSite.center, mockCoordInside);
        expect(distance).toBeLessThan(100);
        expect(distance).toBeGreaterThan(0);

        const farDistance = calculateDistance(mockSite.center, mockCoordOutside);
        expect(farDistance).toBeGreaterThan(100);
    });

    test('should detect when entering a geofence', () => {
        const eventListener = jest.fn();
        geofencingService.onGeofenceEvent(eventListener);

        // Trigger entrance via internal method to skip navigator mocking complexities
        (geofencingService as any).handlePositionUpdate({
            coords: { latitude: mockCoordInside.latitude, longitude: mockCoordInside.longitude, accuracy: 10 },
            timestamp: Date.now()
        });

        expect(eventListener).toHaveBeenCalledWith(expect.objectContaining({
            type: 'enter',
            geofenceId: 'site-1'
        }));
        expect(geofencingService.getState().activeGeofences).toContain('site-1');
    });

    test('should detect when exiting a geofence', () => {
        // First enter
        (geofencingService as any).handlePositionUpdate({
            coords: { latitude: mockCoordInside.latitude, longitude: mockCoordInside.longitude, accuracy: 10 },
            timestamp: Date.now()
        });

        const eventListener = jest.fn();
        geofencingService.onGeofenceEvent(eventListener);

        // Move outside
        (geofencingService as any).handlePositionUpdate({
            coords: { latitude: mockCoordOutside.latitude, longitude: mockCoordOutside.longitude, accuracy: 10 },
            timestamp: Date.now()
        });

        expect(eventListener).toHaveBeenCalledWith(expect.objectContaining({
            type: 'exit',
            geofenceId: 'site-1'
        }));
        expect(geofencingService.getState().activeGeofences).not.toContain('site-1');
    });

    test('should auto-check-in when entering a geofence with autoLogTime enabled', () => {
        (geofencingService as any).handlePositionUpdate({
            coords: { latitude: mockCoordInside.latitude, longitude: mockCoordInside.longitude, accuracy: 10 },
            timestamp: Date.now()
        });

        const activeEntries = geofencingService.getActiveTimeEntries();
        expect(activeEntries.length).toBe(1);
        expect(activeEntries[0].geofenceId).toBe('site-1');
        expect(activeEntries[0].autoLogged).toBe(true);
    });

    test('should auto-check-out when exiting a geofence', () => {
        // Enter
        (geofencingService as any).handlePositionUpdate({
            coords: { latitude: mockCoordInside.latitude, longitude: mockCoordInside.longitude, accuracy: 10 },
            timestamp: Date.now()
        });

        // Exit
        (geofencingService as any).handlePositionUpdate({
            coords: { latitude: mockCoordOutside.latitude, longitude: mockCoordOutside.longitude, accuracy: 10 },
            timestamp: Date.now()
        });

        const activeEntries = geofencingService.getActiveTimeEntries();
        expect(activeEntries.length).toBe(0);
    });

    test('should manually check in and out correctly', () => {
        const entry = geofencingService.manualCheckIn('site-1', 'user-123', 'Work started');
        expect(entry).not.toBeNull();
        expect(entry?.status).toBe('active');
        expect(geofencingService.getActiveTimeEntries().length).toBe(1);

        const checkout = geofencingService.manualCheckOut('site-1', 'Work finished');
        expect(checkout).not.toBeNull();
        expect(checkout?.status).toBe('completed');
        expect(geofencingService.getActiveTimeEntries().length).toBe(0);
    });
});
