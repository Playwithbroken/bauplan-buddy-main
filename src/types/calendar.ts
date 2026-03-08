// Calendar Event Types and Interfaces

export type EventType = 'site-visit' | 'delivery' | 'meeting' | 'milestone' | 'internal';
export type EventStatus = 'confirmed' | 'pending' | 'cancelled';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  type: EventType;
  status: EventStatus;
  date: Date;
  endDate: Date;
  location: string;
  attendees: string[];
  project?: string;
  projectId?: string;
  customer?: string;
  customerId?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CreateEventData {
  title: string;
  description?: string;
  type: EventType;
  status?: EventStatus;
  date: Date;
  endDate: Date;
  location: string;
  attendees: string[];
  projectId?: string;
  customerId?: string;
}

export interface UpdateEventData extends Partial<CreateEventData> {
  id: string;
}

export interface EventFilters {
  startDate?: Date;
  endDate?: Date;
  type?: EventType;
  status?: EventStatus;
  projectId?: string;
  customerId?: string;
  attendees?: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  color: string;
  isActive: boolean;
}

export interface EventsResponse {
  events: CalendarEvent[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  code: string;
  details?: unknown;
}

// Calendar View Types
export type CalendarViewType = 'month' | 'week' | 'day';

export interface CalendarState {
  currentDate: Date;
  selectedDate: Date | undefined;
  activeView: CalendarViewType;
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
}