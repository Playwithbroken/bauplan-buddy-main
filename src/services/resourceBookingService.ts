export interface Resource {
  id: string;
  name: string;
  type: 'room' | 'equipment' | 'vehicle' | 'tool';
  category: string;
  description: string;
  location: string;
  capacity?: number;
  availability: ResourceAvailability;
  pricing: ResourcePricing;
  bookingRules: BookingRules;
  status: 'available' | 'maintenance' | 'out_of_service';
  created: Date;
  updated: Date;
}

export interface ResourceAvailability {
  defaultSchedule: Schedule[];
  minimumNotice: number; // hours
  maximumAdvanceBooking: number; // days
}

export interface Schedule {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  available: boolean;
}

export interface ResourcePricing {
  baseRate: number;
  rateType: 'hourly' | 'daily' | 'fixed';
  currency: string;
}

export interface BookingRules {
  minimumDuration: number; // minutes
  maximumDuration: number; // minutes
  requiresApproval: boolean;
  approvers: string[];
  bufferTime: number; // minutes between bookings
}

export interface ResourceBooking {
  id: string;
  resourceId: string;
  resourceName: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  approvalStatus: 'not_required' | 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  pricing: BookingPricing;
  created: Date;
  updated: Date;
}

export interface BookingPricing {
  baseAmount: number;
  totalAmount: number;
  currency: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
}

export interface ResourceUtilization {
  resourceId: string;
  period: { start: Date; end: Date };
  totalHours: number;
  bookedHours: number;
  utilizationRate: number;
  bookingCount: number;
  revenue: number;
}

export class ResourceBookingService {
  private static instance: ResourceBookingService;
  private resources: Map<string, Resource> = new Map();
  private bookings: Map<string, ResourceBooking> = new Map();

  static getInstance(): ResourceBookingService {
    if (!ResourceBookingService.instance) {
      ResourceBookingService.instance = new ResourceBookingService();
    }
    return ResourceBookingService.instance;
  }

  constructor() {
    this.loadData();
    this.initializeDefaultResources();
  }

  private loadData(): void {
    try {
      const storedResources = localStorage.getItem('resources');
      if (storedResources) {
        const resourceData = JSON.parse(storedResources);
        Object.entries(resourceData).forEach(([id, resource]: [string, Resource]) => {
          this.resources.set(id, {
            ...resource,
            created: new Date(resource.created),
            updated: new Date(resource.updated)
          });
        });
      }

      const storedBookings = localStorage.getItem('resource_bookings');
      if (storedBookings) {
        const bookingData = JSON.parse(storedBookings);
        Object.entries(bookingData).forEach(([id, booking]: [string, ResourceBooking]) => {
          this.bookings.set(id, {
            ...booking,
            startTime: new Date(booking.startTime),
            endTime: new Date(booking.endTime),
            approvedAt: booking.approvedAt ? new Date(booking.approvedAt) : undefined,
            created: new Date(booking.created),
            updated: new Date(booking.updated)
          });
        });
      }
    } catch (error) {
      console.error('Failed to load resource booking data:', error);
    }
  }

  private saveData(): void {
    try {
      const resourceData: Record<string, Resource> = {};
      this.resources.forEach((resource, id) => {
        resourceData[id] = resource;
      });
      localStorage.setItem('resources', JSON.stringify(resourceData));

      const bookingData: Record<string, ResourceBooking> = {};
      this.bookings.forEach((booking, id) => {
        bookingData[id] = booking;
      });
      localStorage.setItem('resource_bookings', JSON.stringify(bookingData));
    } catch (error) {
      console.error('Failed to save resource booking data:', error);
    }
  }

  private initializeDefaultResources(): void {
    if (this.resources.size > 0) return;

    const defaultResources: Partial<Resource>[] = [
      {
        id: 'room_001',
        name: 'Conference Room A',
        type: 'room',
        category: 'meeting_room',
        description: 'Large conference room with projector',
        location: 'Floor 2, Building A',
        capacity: 12
      },
      {
        id: 'vehicle_001',
        name: 'Work Van #1',
        type: 'vehicle',
        category: 'transport',
        description: 'Ford Transit van for construction work',
        location: 'Main parking lot'
      },
      {
        id: 'equipment_001',
        name: 'Excavator CAT 320',
        type: 'equipment',
        category: 'heavy_machinery',
        description: 'Caterpillar excavator for earthmoving',
        location: 'Equipment yard'
      }
    ];

    defaultResources.forEach(resourceData => {
      const resource: Resource = {
        ...resourceData,
        availability: {
          defaultSchedule: [
            { dayOfWeek: 1, startTime: '08:00', endTime: '18:00', available: true },
            { dayOfWeek: 2, startTime: '08:00', endTime: '18:00', available: true },
            { dayOfWeek: 3, startTime: '08:00', endTime: '18:00', available: true },
            { dayOfWeek: 4, startTime: '08:00', endTime: '18:00', available: true },
            { dayOfWeek: 5, startTime: '08:00', endTime: '18:00', available: true }
          ],
          minimumNotice: 2,
          maximumAdvanceBooking: 90
        },
        pricing: {
          baseRate: resourceData.type === 'room' ? 50 : resourceData.type === 'vehicle' ? 80 : 200,
          rateType: 'hourly',
          currency: 'EUR'
        },
        bookingRules: {
          minimumDuration: 60,
          maximumDuration: 480,
          requiresApproval: resourceData.type === 'equipment',
          approvers: ['manager@company.com'],
          bufferTime: 15
        },
        status: 'available',
        created: new Date(),
        updated: new Date()
      } as Resource;

      this.resources.set(resource.id, resource);
    });

    this.saveData();
  }

  // Resource Management
  public createResource(resourceData: Partial<Resource>): Resource {
    const resource: Resource = {
      id: `resource_${Date.now()}`,
      name: resourceData.name || 'New Resource',
      type: resourceData.type || 'equipment',
      category: resourceData.category || 'general',
      description: resourceData.description || '',
      location: resourceData.location || '',
      capacity: resourceData.capacity,
      availability: resourceData.availability || {
        defaultSchedule: [],
        minimumNotice: 1,
        maximumAdvanceBooking: 30
      },
      pricing: resourceData.pricing || {
        baseRate: 0,
        rateType: 'hourly',
        currency: 'EUR'
      },
      bookingRules: resourceData.bookingRules || {
        minimumDuration: 60,
        maximumDuration: 480,
        requiresApproval: false,
        approvers: [],
        bufferTime: 0
      },
      status: resourceData.status || 'available',
      created: new Date(),
      updated: new Date()
    };

    this.resources.set(resource.id, resource);
    this.saveData();
    return resource;
  }

  public updateResource(resourceId: string, updates: Partial<Resource>): Resource | null {
    const resource = this.resources.get(resourceId);
    if (!resource) return null;

    const updatedResource: Resource = {
      ...resource,
      ...updates,
      updated: new Date()
    };

    this.resources.set(resourceId, updatedResource);
    this.saveData();
    return updatedResource;
  }

  public deleteResource(resourceId: string): boolean {
    const deleted = this.resources.delete(resourceId);
    if (deleted) {
      this.saveData();
    }
    return deleted;
  }

  // Booking Management
  public async createBooking(bookingData: Partial<ResourceBooking>): Promise<ResourceBooking> {
    const resource = this.resources.get(bookingData.resourceId!);
    if (!resource) {
      throw new Error('Resource not found');
    }

    const isAvailable = this.checkAvailability(
      bookingData.resourceId!,
      bookingData.startTime!,
      bookingData.endTime!
    );

    if (!isAvailable) {
      throw new Error('Resource is not available at the requested time');
    }

    const duration = (bookingData.endTime!.getTime() - bookingData.startTime!.getTime()) / 60000;
    const pricing = this.calculatePricing(resource, duration);

    const booking: ResourceBooking = {
      id: `booking_${Date.now()}`,
      resourceId: bookingData.resourceId!,
      resourceName: resource.name,
      userId: bookingData.userId || 'current_user',
      userName: bookingData.userName || 'Current User',
      title: bookingData.title || `${resource.name} Booking`,
      description: bookingData.description || '',
      startTime: bookingData.startTime!,
      endTime: bookingData.endTime!,
      duration,
      status: 'pending',
      approvalStatus: resource.bookingRules.requiresApproval ? 'pending' : 'not_required',
      pricing,
      created: new Date(),
      updated: new Date()
    };

    this.bookings.set(booking.id, booking);

    if (!resource.bookingRules.requiresApproval) {
      booking.status = 'confirmed';
      booking.approvalStatus = 'approved';
    }

    this.saveData();
    return booking;
  }

  private calculatePricing(resource: Resource, duration: number): BookingPricing {
    let baseAmount = 0;
    
    switch (resource.pricing.rateType) {
      case 'hourly':
        baseAmount = resource.pricing.baseRate * (duration / 60);
        break;
      case 'daily':
        baseAmount = resource.pricing.baseRate * Math.ceil(duration / (24 * 60));
        break;
      case 'fixed':
        baseAmount = resource.pricing.baseRate;
        break;
    }

    return {
      baseAmount,
      totalAmount: baseAmount,
      currency: resource.pricing.currency,
      paymentStatus: 'pending'
    };
  }

  private checkAvailability(resourceId: string, startTime: Date, endTime: Date): boolean {
    const resource = this.resources.get(resourceId);
    if (!resource || resource.status !== 'available') return false;

    // Check for conflicts with existing bookings
    const conflicts = Array.from(this.bookings.values()).filter(booking =>
      booking.resourceId === resourceId &&
      booking.status !== 'cancelled' &&
      booking.startTime < endTime &&
      booking.endTime > startTime
    );

    if (conflicts.length > 0) return false;

    // Check availability schedule
    const dayOfWeek = startTime.getDay();
    const schedule = resource.availability.defaultSchedule.find(s => s.dayOfWeek === dayOfWeek);
    
    if (!schedule || !schedule.available) return false;

    // Check time bounds
    const startTimeStr = startTime.toTimeString().substring(0, 5);
    const endTimeStr = endTime.toTimeString().substring(0, 5);
    
    return startTimeStr >= schedule.startTime && endTimeStr <= schedule.endTime;
  }

  public approveBooking(bookingId: string, approverId: string): boolean {
    const booking = this.bookings.get(bookingId);
    if (!booking) return false;

    booking.approvalStatus = 'approved';
    booking.status = 'confirmed';
    booking.approvedBy = approverId;
    booking.approvedAt = new Date();
    booking.updated = new Date();

    this.saveData();
    return true;
  }

  public rejectBooking(bookingId: string, approverId: string, reason: string): boolean {
    const booking = this.bookings.get(bookingId);
    if (!booking) return false;

    booking.approvalStatus = 'rejected';
    booking.status = 'cancelled';
    booking.approvedBy = approverId;
    booking.approvedAt = new Date();
    booking.updated = new Date();

    this.saveData();
    return true;
  }

  public updateBooking(bookingId: string, updates: Partial<ResourceBooking>): ResourceBooking | null {
    const booking = this.bookings.get(bookingId);
    if (!booking) return null;

    const updatedBooking: ResourceBooking = {
      ...booking,
      ...updates,
      updated: new Date()
    };

    this.bookings.set(bookingId, updatedBooking);
    this.saveData();
    return updatedBooking;
  }

  public cancelBooking(bookingId: string): boolean {
    const booking = this.bookings.get(bookingId);
    if (!booking) return false;

    booking.status = 'cancelled';
    booking.updated = new Date();

    this.saveData();
    return true;
  }

  // Query Methods
  public getResources(type?: string): Resource[] {
    const resources = Array.from(this.resources.values());
    return type ? resources.filter(r => r.type === type) : resources;
  }

  public getResource(resourceId: string): Resource | null {
    return this.resources.get(resourceId) || null;
  }

  public getBookings(resourceId?: string, userId?: string): ResourceBooking[] {
    let bookings = Array.from(this.bookings.values());
    
    if (resourceId) {
      bookings = bookings.filter(b => b.resourceId === resourceId);
    }
    
    if (userId) {
      bookings = bookings.filter(b => b.userId === userId);
    }
    
    return bookings.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  public getAvailableResources(startTime: Date, endTime: Date, type?: string): Resource[] {
    return this.getResources(type).filter(resource => 
      this.checkAvailability(resource.id, startTime, endTime)
    );
  }

  public getPendingApprovals(): ResourceBooking[] {
    return Array.from(this.bookings.values()).filter(
      booking => booking.approvalStatus === 'pending'
    );
  }

  public getResourceUtilization(resourceId: string, days: number = 30): ResourceUtilization {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    const bookings = Array.from(this.bookings.values())
      .filter(b => b.resourceId === resourceId && 
                   b.startTime >= startDate && 
                   b.status === 'completed');

    const totalHours = days * 24;
    const bookedHours = bookings.reduce((sum, booking) => 
      sum + (booking.duration / 60), 0);

    return {
      resourceId,
      period: { start: startDate, end: now },
      totalHours,
      bookedHours,
      utilizationRate: (bookedHours / totalHours) * 100,
      bookingCount: bookings.length,
      revenue: bookings.reduce((sum, b) => sum + b.pricing.totalAmount, 0)
    };
  }

  public getBookingStats(): {
    totalBookings: number;
    pendingBookings: number;
    confirmedBookings: number;
    totalRevenue: number;
  } {
    const bookings = Array.from(this.bookings.values());
    
    return {
      totalBookings: bookings.length,
      pendingBookings: bookings.filter(b => b.status === 'pending').length,
      confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
      totalRevenue: bookings.reduce((sum, b) => sum + b.pricing.totalAmount, 0)
    };
  }
}

export default ResourceBookingService.getInstance();