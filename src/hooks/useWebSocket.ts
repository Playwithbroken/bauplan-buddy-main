/**
 * React Hook for WebSocket Integration
 */

import { useEffect, useCallback, useRef } from 'react';
import { websocketService, WebSocketEventType, WebSocketMessage, WebSocketListener, WebSocketPayload } from '@/services/websocketService';

interface UseWebSocketOptions {
  userId?: string;
  tenantId?: string;
  autoConnect?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { userId, tenantId, autoConnect = false } = options; // Changed default to false
  const isConnectedRef = useRef(false);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && userId && tenantId && !isConnectedRef.current) {
      websocketService.connect(userId, tenantId);
      isConnectedRef.current = true;
    }

    // Cleanup on unmount
    return () => {
      if (isConnectedRef.current) {
        websocketService.disconnect();
        isConnectedRef.current = false;
      }
    };
  }, [userId, tenantId, autoConnect]);

  // Subscribe to event
  const subscribe = useCallback(
    <TPayload = WebSocketPayload>(
      eventType: WebSocketEventType,
      callback: WebSocketListener<TPayload>
    ) => websocketService.on<TPayload>(eventType, callback),
    []
  );

  // Send message
  const send = useCallback(
    <TPayload = WebSocketPayload>(type: WebSocketEventType, data: TPayload) => {
      websocketService.send<TPayload>(type, data);
    },
    []
  );

  // Broadcast presence
  const broadcastPresence = useCallback((
    status: 'online' | 'offline' | 'typing',
    context?: string
  ) => {
    websocketService.broadcastPresence(status, context);
  }, []);

  // Check connection status
  const isConnected = useCallback(() => {
    return websocketService.isConnected();
  }, []);

  return {
    subscribe,
    send,
    broadcastPresence,
    isConnected,
  };
}
