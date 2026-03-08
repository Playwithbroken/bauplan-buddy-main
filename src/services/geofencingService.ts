/**
 * Geofencing Service
 * GPS-based location tracking and geofencing for construction sites
 */

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  timestamp?: Date;
}

export interface Geofence {
  id: string;
  name: string;
  center: GeoCoordinate;
  radius: number; // meters
  type: 'site' | 'office' | 'warehouse' | 'custom';
  projectId?: string;
  address?: string;
  notifyOnEnter?: boolean;
  notifyOnExit?: boolean;
  autoLogTime?: boolean;
  workingHours?: {
    start: string; // HH:mm
    end: string;
  };
}

export interface GeofenceEvent {
  id: string;
  geofenceId: string;
  userId: string;
  type: 'enter' | 'exit';
  timestamp: Date;
  location: GeoCoordinate;
  duration?: number; // milliseconds, only for exit events
}

export interface TimeEntry {
  id: string;
  userId: string;
  geofenceId: string;
  projectId?: string;
  checkIn: Date;
  checkOut?: Date;
  duration?: number;
  autoLogged: boolean;
  notes?: string;
  status: 'active' | 'completed' | 'adjusted';
}

export interface GeofencingState {
  isTracking: boolean;
  currentLocation: GeoCoordinate | null;
  activeGeofences: string[]; // IDs of geofences user is currently in
  lastUpdate: Date | null;
  accuracy: 'high' | 'low' | 'unknown';
}

// Calculate distance between two coordinates using Haversine formula
export const calculateDistance = (coord1: GeoCoordinate, coord2: GeoCoordinate): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (coord1.latitude * Math.PI) / 180;
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

type GeofenceListener = (event: GeofenceEvent) => void;
type LocationListener = (location: GeoCoordinate) => void;
type StateListener = (state: GeofencingState) => void;

class GeofencingService {
  private geofences: Map<string, Geofence> = new Map();
  private activeGeofences: Set<string> = new Set();
  private timeEntries: Map<string, TimeEntry> = new Map(); // geofenceId -> active entry
  private watchId: number | null = null;
  private state: GeofencingState = {
    isTracking: false,
    currentLocation: null,
    activeGeofences: [],
    lastUpdate: null,
    accuracy: 'unknown',
  };

  private geofenceListeners: Set<GeofenceListener> = new Set();
  private locationListeners: Set<LocationListener> = new Set();
  private stateListeners: Set<StateListener> = new Set();

  /**
   * Check if geolocation is supported
   */
  isSupported(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Request location permission
   */
  async requestPermission(): Promise<PermissionState> {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state;
    } catch {
      // Fallback: try to get position which will trigger permission prompt
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve('granted'),
          (error) => {
            if (error.code === error.PERMISSION_DENIED) {
              resolve('denied');
            } else {
              resolve('prompt');
            }
          }
        );
      });
    }
  }

  /**
   * Add a geofence
   */
  addGeofence(geofence: Geofence): void {
    this.geofences.set(geofence.id, geofence);
    this.saveGeofences();
    
    // Check if already inside this geofence
    if (this.state.currentLocation) {
      this.checkGeofence(geofence, this.state.currentLocation);
    }
  }

  /**
   * Remove a geofence
   */
  removeGeofence(id: string): void {
    this.geofences.delete(id);
    this.activeGeofences.delete(id);
    this.saveGeofences();
    this.updateState();
  }

  /**
   * Get all geofences
   */
  getGeofences(): Geofence[] {
    return Array.from(this.geofences.values());
  }

  /**
   * Get geofence by ID
   */
  getGeofence(id: string): Geofence | undefined {
    return this.geofences.get(id);
  }

  /**
   * Start location tracking
   */
  startTracking(options?: PositionOptions): void {
    if (!this.isSupported() || this.watchId !== null) {
      return;
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handlePositionUpdate(position),
      (error) => this.handlePositionError(error),
      { ...defaultOptions, ...options }
    );

    this.state.isTracking = true;
    this.updateState();
  }

  /**
   * Stop location tracking
   */
  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    this.state.isTracking = false;
    this.updateState();
  }

  /**
   * Get current position (one-time)
   */
  async getCurrentPosition(): Promise<GeoCoordinate | null> {
    if (!this.isSupported()) {
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coord: GeoCoordinate = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude ?? undefined,
            timestamp: new Date(position.timestamp),
          };
          resolve(coord);
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  /**
   * Get current state
   */
  getState(): GeofencingState {
    return { ...this.state };
  }

  /**
   * Get active time entries
   */
  getActiveTimeEntries(): TimeEntry[] {
    return Array.from(this.timeEntries.values()).filter(
      (entry) => entry.status === 'active'
    );
  }

  /**
   * Get time entries for a date range
   */
  getTimeEntries(startDate: Date, endDate: Date): TimeEntry[] {
    const stored = this.loadTimeEntries();
    return stored.filter((entry) => {
      const checkIn = new Date(entry.checkIn);
      return checkIn >= startDate && checkIn <= endDate;
    });
  }

  /**
   * Manually check in to a geofence
   */
  manualCheckIn(geofenceId: string, userId: string, notes?: string): TimeEntry | null {
    const geofence = this.geofences.get(geofenceId);
    if (!geofence) return null;

    const entry: TimeEntry = {
      id: `entry-${Date.now()}`,
      userId,
      geofenceId,
      projectId: geofence.projectId,
      checkIn: new Date(),
      autoLogged: false,
      notes,
      status: 'active',
    };

    this.timeEntries.set(geofenceId, entry);
    this.saveTimeEntry(entry);
    return entry;
  }

  /**
   * Manually check out from a geofence
   */
  manualCheckOut(geofenceId: string, notes?: string): TimeEntry | null {
    const entry = this.timeEntries.get(geofenceId);
    if (!entry || entry.status !== 'active') return null;

    entry.checkOut = new Date();
    entry.duration = entry.checkOut.getTime() - new Date(entry.checkIn).getTime();
    entry.status = 'completed';
    if (notes) entry.notes = notes;

    this.timeEntries.delete(geofenceId);
    this.saveTimeEntry(entry);
    return entry;
  }

  /**
   * Subscribe to geofence events
   */
  onGeofenceEvent(listener: GeofenceListener): () => void {
    this.geofenceListeners.add(listener);
    return () => this.geofenceListeners.delete(listener);
  }

  /**
   * Subscribe to location updates
   */
  onLocationUpdate(listener: LocationListener): () => void {
    this.locationListeners.add(listener);
    return () => this.locationListeners.delete(listener);
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  // Private methods

  private handlePositionUpdate(position: GeolocationPosition): void {
    const location: GeoCoordinate = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude ?? undefined,
      timestamp: new Date(position.timestamp),
    };

    this.state.currentLocation = location;
    this.state.lastUpdate = new Date();
    this.state.accuracy = position.coords.accuracy < 50 ? 'high' : 'low';

    // Notify location listeners
    this.locationListeners.forEach((l) => l(location));

    // Check all geofences
    this.geofences.forEach((geofence) => {
      this.checkGeofence(geofence, location);
    });

    this.updateState();
  }

  private handlePositionError(error: GeolocationPositionError): void {
    console.error('Geolocation error:', error.message);
    this.state.accuracy = 'unknown';
    this.updateState();
  }

  private checkGeofence(geofence: Geofence, location: GeoCoordinate): void {
    const distance = calculateDistance(location, geofence.center);
    const isInside = distance <= geofence.radius;
    const wasInside = this.activeGeofences.has(geofence.id);

    if (isInside && !wasInside) {
      // Entered geofence
      this.activeGeofences.add(geofence.id);
      this.emitGeofenceEvent(geofence, 'enter', location);

      // Auto-log time if enabled
      if (geofence.autoLogTime) {
        this.autoCheckIn(geofence, location);
      }
    } else if (!isInside && wasInside) {
      // Exited geofence
      this.activeGeofences.delete(geofence.id);
      
      // Calculate duration for exit event
      const activeEntry = this.timeEntries.get(geofence.id);
      const duration = activeEntry
        ? Date.now() - new Date(activeEntry.checkIn).getTime()
        : undefined;

      this.emitGeofenceEvent(geofence, 'exit', location, duration);

      // Auto-log time if enabled
      if (geofence.autoLogTime) {
        this.autoCheckOut(geofence);
      }
    }
  }

  private emitGeofenceEvent(
    geofence: Geofence,
    type: 'enter' | 'exit',
    location: GeoCoordinate,
    duration?: number
  ): void {
    const event: GeofenceEvent = {
      id: `event-${Date.now()}`,
      geofenceId: geofence.id,
      userId: 'current-user', // Would come from auth context
      type,
      timestamp: new Date(),
      location,
      duration,
    };

    // Save event
    this.saveGeofenceEvent(event);

    // Notify listeners
    this.geofenceListeners.forEach((l) => l(event));
  }

  private autoCheckIn(geofence: Geofence, location: GeoCoordinate): void {
    // Check working hours if defined
    if (geofence.workingHours) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [startHour, startMin] = geofence.workingHours.start.split(':').map(Number);
      const [endHour, endMin] = geofence.workingHours.end.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
        return; // Outside working hours
      }
    }

    const entry: TimeEntry = {
      id: `entry-${Date.now()}`,
      userId: 'current-user',
      geofenceId: geofence.id,
      projectId: geofence.projectId,
      checkIn: new Date(),
      autoLogged: true,
      status: 'active',
    };

    this.timeEntries.set(geofence.id, entry);
    this.saveTimeEntry(entry);
  }

  private autoCheckOut(geofence: Geofence): void {
    const entry = this.timeEntries.get(geofence.id);
    if (!entry || entry.status !== 'active') return;

    entry.checkOut = new Date();
    entry.duration = entry.checkOut.getTime() - new Date(entry.checkIn).getTime();
    entry.status = 'completed';

    this.timeEntries.delete(geofence.id);
    this.saveTimeEntry(entry);
  }

  private updateState(): void {
    this.state.activeGeofences = Array.from(this.activeGeofences);
    this.stateListeners.forEach((l) => l(this.state));
  }

  // Storage methods

  private saveGeofences(): void {
    try {
      const data = Array.from(this.geofences.values());
      localStorage.setItem('geofences', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save geofences:', e);
    }
  }

  private loadGeofences(): Geofence[] {
    try {
      const data = localStorage.getItem('geofences');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveGeofenceEvent(event: GeofenceEvent): void {
    try {
      const stored = this.loadGeofenceEvents();
      stored.push(event);
      // Keep last 1000 events
      const trimmed = stored.slice(-1000);
      localStorage.setItem('geofence_events', JSON.stringify(trimmed));
    } catch (e) {
      console.error('Failed to save geofence event:', e);
    }
  }

  private loadGeofenceEvents(): GeofenceEvent[] {
    try {
      const data = localStorage.getItem('geofence_events');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveTimeEntry(entry: TimeEntry): void {
    try {
      const stored = this.loadTimeEntries();
      const index = stored.findIndex((e) => e.id === entry.id);
      if (index >= 0) {
        stored[index] = entry;
      } else {
        stored.push(entry);
      }
      localStorage.setItem('time_entries', JSON.stringify(stored));
    } catch (e) {
      console.error('Failed to save time entry:', e);
    }
  }

  private loadTimeEntries(): TimeEntry[] {
    try {
      const data = localStorage.getItem('time_entries');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Initialize service from storage
   */
  initialize(): void {
    const geofences = this.loadGeofences();
    geofences.forEach((g) => this.geofences.set(g.id, g));
  }
}

// Export singleton
export const geofencingService = new GeofencingService();
export default geofencingService;
