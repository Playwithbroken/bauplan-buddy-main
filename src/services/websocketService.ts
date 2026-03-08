/**
 * WebSocket Service for Real-Time Features
 * Handles live updates, notifications, and collaborative editing
 */

type WebSocketEventType =
  | 'project_updated'
  | 'quote_created'
  | 'invoice_paid'
  | 'team_member_online'
  | 'team_member_offline'
  | 'chat_message'
  | 'notification'
  | 'document_updated'
  | 'appointment_created'
  | 'appointment_updated';

type WebSocketPayload = Record<string, unknown> | unknown[] | string | number | boolean | null;

interface WebSocketMessage<TPayload = WebSocketPayload> {
  type: WebSocketEventType;
  data: TPayload;
  timestamp: string;
  userId?: string;
  tenantId?: string;
}

type WebSocketListener<TPayload = WebSocketPayload> = (message: WebSocketMessage<TPayload>) => void;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isWebSocketMessage = (value: unknown): value is WebSocketMessage => {
  if (!isRecord(value)) {
    return false;
  }

  if (typeof value.type !== 'string' || typeof value.timestamp !== 'string') {
    return false;
  }

  return true;
};

class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<WebSocketEventType, Set<WebSocketListener>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isIntentionallyClosed = false;
  private url: string;
  private userId: string | null = null;
  private tenantId: string | null = null;

  constructor() {
    // Use environment variable or default to local development
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = import.meta.env.VITE_WS_URL || `${wsProtocol}//${window.location.host}`;
    this.url = `${wsHost}/ws`;
  }

  /**
   * Connect to WebSocket server
   */
  connect(userId: string, tenantId: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    this.userId = userId;
    this.tenantId = tenantId;
    this.isIntentionallyClosed = false;

    try {
      // Add authentication parameters
      const wsUrl = `${this.url}?userId=${userId}&tenantId=${tenantId}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isIntentionallyClosed = true;
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Subscribe to specific event type
   */
  on<TPayload = WebSocketPayload>(eventType: WebSocketEventType, listener: WebSocketListener<TPayload>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    this.listeners.get(eventType)!.add(listener as WebSocketListener);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(listener as WebSocketListener);
    };
  }

  /**
   * Send message to server
   */
  send<TPayload = WebSocketPayload>(type: WebSocketEventType, data: TPayload): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected. Message not sent:', type);
      return;
    }

    const message: WebSocketMessage<TPayload> = {
      type,
      data,
      timestamp: new Date().toISOString(),
      userId: this.userId || undefined,
      tenantId: this.tenantId || undefined,
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Broadcast user presence (online/typing status)
   */
  broadcastPresence(status: 'online' | 'offline' | 'typing', context?: string): void {
    this.send('team_member_online', {
      status,
      context,
      userId: this.userId,
    });
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  // Private handlers

  private handleOpen(): void {
    console.log('WebSocket connected');
    this.reconnectAttempts = 0;
    
    // Start heartbeat
    this.startHeartbeat();

    // Broadcast online status
    this.broadcastPresence('online');
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const parsed = JSON.parse(event.data) as unknown;
      if (!isWebSocketMessage(parsed)) {
        console.warn('WebSocket: Received malformed message', parsed);
        return;
      }

      const message = parsed as WebSocketMessage;
      
      // Handle heartbeat response
      if (
        message.type === 'notification' &&
        isRecord(message.data) &&
        message.data.type === 'pong'
      ) {
        return;
      }

      // Notify listeners
      const listeners = this.listeners.get(message.type);
      if (listeners) {
        listeners.forEach(listener => listener(message));
      }

      // Log for debugging
      console.log('WebSocket message received:', message.type, message.data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
  }

  private handleClose(event: CloseEvent): void {
    console.log('WebSocket closed:', event.code, event.reason);
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Attempt reconnection if not intentionally closed
    if (!this.isIntentionallyClosed) {
      this.scheduleReconnect();
    }
  }

  private startHeartbeat(): void {
    // Send ping every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send('notification', { type: 'ping' });
      }
    }, 30000);
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('WebSocket: Max reconnection attempts reached. Switching to offline mode.');
      // Don't try to reconnect anymore - app works fine in offline mode
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`WebSocket: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (this.userId && this.tenantId && !this.isIntentionallyClosed) {
        this.connect(this.userId, this.tenantId);
      }
    }, delay);
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export type { WebSocketEventType, WebSocketMessage, WebSocketListener, WebSocketPayload };
