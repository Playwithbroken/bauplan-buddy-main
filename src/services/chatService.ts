import { supabase } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  roomId: string;
  type: 'text' | 'image' | 'file' | 'system';
  fileUrl?: string;
  fileName?: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'project' | 'direct' | 'announcement' | 'team';
  memberIds: string[];
  lastMessage?: string;
  lastTimestamp?: Date;
  unreadCount: number;
}

class ChatService {
  private messages: Record<string, ChatMessage[]> = {};
  private rooms: ChatRoom[] = [];
  private listeners: ((msg: ChatMessage) => void)[] = [];
  private unreadListeners: ((totalUnread: number) => void)[] = [];
  private channel: RealtimeChannel | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    // Initial load from storage (for offline/fast startup)
    this.loadFromStorage();
    
    // Connect to Supabase
    try {
      const client = supabase.getClient();
      const user = supabase.getCurrentUser();
      
      if (user) {
        await this.refreshRooms();
        this.setupRealtime();
      }
    } catch (e) {
      console.warn('ChatService: Supabase not initialized or not logged in. Using offline/mock mode.');
      if (this.rooms.length === 0) {
        this.initDefaultRooms();
      }
    }
  }

  private setupRealtime() {
    const client = supabase.getClient();
    const tenant = supabase.getCurrentTenant();
    
    if (!tenant) return;

    this.channel = client
      .channel('chat_messages_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `tenant_id=eq.${tenant.id}`
        },
        (payload) => {
          const newMsg = payload.new as any;
          this.handleIncomingMessage({
            id: newMsg.id,
            roomId: newMsg.room_id,
            senderId: newMsg.sender_id,
            senderName: newMsg.sender_name,
            text: newMsg.content,
            timestamp: new Date(newMsg.created_at),
            type: newMsg.type,
            fileUrl: newMsg.file_url,
            fileName: newMsg.file_name
          });
        }
      )
      .subscribe();
  }

  private handleIncomingMessage(msg: ChatMessage) {
    if (!this.messages[msg.roomId]) {
      this.messages[msg.roomId] = [];
    }
    
    // Prevent duplicates
    if (this.messages[msg.roomId].some(m => m.id === msg.id)) return;

    this.messages[msg.roomId].push(msg);
    
    const room = this.rooms.find(r => r.id === msg.roomId);
    if (room) {
      room.lastMessage = msg.text || (msg.type === 'image' ? 'Bild gesendet' : 'Datei gesendet');
      room.lastTimestamp = msg.timestamp;
      
      // Only increment unread if we're not currently looking at this room
      // (Simplified logic: always increment, components will mark as read)
      room.unreadCount++;
    }
    
    this.saveToStorage();
    this.notifyListeners(msg);
    this.notifyUnreadListeners();
  }

  private async refreshRooms() {
    const client = supabase.getClient();
    const tenant = supabase.getCurrentTenant();
    
    if (!tenant) return;

    const { data: rooms, error } = await client
      .from('chat_rooms')
      .select('*')
      .eq('tenant_id', tenant.id);

    if (error) {
      console.error('Error fetching chat rooms:', error);
      return;
    }

    this.rooms = rooms.map(r => ({
      id: r.id,
      name: r.name,
      type: r.type as any,
      memberIds: [], // Fetching members is a future step
      unreadCount: this.rooms.find(oldR => oldR.id === r.id)?.unreadCount || 0
    }));

    this.saveToStorage();
  }

  private loadFromStorage() {
    const savedMsg = localStorage.getItem('bauplan_chat_messages_v2');
    const savedRooms = localStorage.getItem('bauplan_chat_rooms_v2');
    
    if (savedMsg) {
      this.messages = JSON.parse(savedMsg);
      // Revive dates
      Object.keys(this.messages).forEach(roomId => {
        this.messages[roomId] = this.messages[roomId].map(m => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      });
    }
    
    if (savedRooms) {
      this.rooms = JSON.parse(savedRooms).map((r: any) => ({
        ...r,
        lastTimestamp: r.lastTimestamp ? new Date(r.lastTimestamp) : undefined
      }));
    }
  }

  private saveToStorage() {
    localStorage.setItem('bauplan_chat_messages_v2', JSON.stringify(this.messages));
    localStorage.setItem('bauplan_chat_rooms_v2', JSON.stringify(this.rooms));
  }

  private initDefaultRooms() {
    this.rooms = [
      { id: 'general', name: 'Allgemein', type: 'announcement', memberIds: [], unreadCount: 0 },
    ];
    this.saveToStorage();
  }

  getRooms(): ChatRoom[] {
    return this.rooms;
  }

  getTotalUnreadCount(): number {
    return this.rooms.reduce((sum, r) => sum + r.unreadCount, 0);
  }

  markRoomAsRead(roomId: string) {
    const room = this.rooms.find(r => r.id === roomId);
    if (room && room.unreadCount > 0) {
      room.unreadCount = 0;
      this.saveToStorage();
      this.notifyUnreadListeners();
    }
  }

  async uploadFile(file: File): Promise<string> {
    const tenant = supabase.getCurrentTenant();
    if (!tenant) throw new Error('Not logged in to a tenant');

    const client = supabase.getClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${tenant.id}/${fileName}`;

    const { data, error } = await client.storage
      .from('chat-attachments')
      .upload(filePath, file);

    if (error) {
      console.error('Error uploading file:', error);
      throw error;
    }

    const { data: { publicUrl } } = client.storage
      .from('chat-attachments')
      .getPublicUrl(filePath);

    return publicUrl;
  }

  async getMessages(roomId: string): Promise<ChatMessage[]> {
    const client = supabase.getClient();
    
    // Fetch from DB if possible
    try {
      const { data, error } = await client
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const fetchedMessages = data.map(m => ({
        id: m.id,
        roomId: m.room_id,
        senderId: m.sender_id,
        senderName: m.sender_name,
        text: m.content,
        timestamp: new Date(m.created_at),
        type: m.type as any,
        fileUrl: m.file_url,
        fileName: m.file_name
      }));

      this.messages[roomId] = fetchedMessages;
      this.saveToStorage();
      return fetchedMessages;
    } catch (e) {
      console.warn('ChatService: Could not fetch from DB, using local messages.');
      return this.messages[roomId] || [];
    }
  }

  async sendMessage(roomId: string, sender: { id: string, name: string }, text: string, type: 'text' | 'image' | 'file' = 'text', fileUrl?: string, fileName?: string): Promise<ChatMessage> {
    const tenant = supabase.getCurrentTenant();
    if (!tenant) throw new Error('Not logged in to a tenant');

    const client = supabase.getClient();

    const dbMessage = {
      tenant_id: tenant.id,
      room_id: roomId,
      sender_id: sender.id,
      sender_name: sender.name,
      content: text,
      type,
      file_url: fileUrl,
      file_name: fileName
    };

    const { data, error } = await client
      .from('chat_messages')
      .insert(dbMessage)
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      // Fallback for demo
      const fallbackMsg: ChatMessage = {
        id: uuidv4(),
        roomId,
        senderId: sender.id,
        senderName: sender.name,
        text,
        timestamp: new Date(),
        type,
        fileUrl,
        fileName
      };
      this.handleIncomingMessage(fallbackMsg);
      return fallbackMsg;
    }

    const newMessage: ChatMessage = {
      id: data.id,
      roomId: data.room_id,
      senderId: data.sender_id,
      senderName: data.sender_name,
      text: data.content,
      timestamp: new Date(data.created_at),
      type: data.type,
      fileUrl: data.file_url,
      fileName: data.file_name
    };

    // Note: Realtime will also trigger handleIncomingMessage, but we return this for immediate UI update if needed
    // However, to avoid double-adding, the handleIncomingMessage has a duplicate check.
    this.handleIncomingMessage(newMessage);
    return newMessage;
  }

  subscribe(callback: (msg: ChatMessage) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  subscribeToUnreadCount(callback: (totalUnread: number) => void) {
    this.unreadListeners.push(callback);
    callback(this.getTotalUnreadCount());
    return () => {
      this.unreadListeners = this.unreadListeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(msg: ChatMessage) {
    this.listeners.forEach(l => l(msg));
  }

  private notifyUnreadListeners() {
    const total = this.getTotalUnreadCount();
    this.unreadListeners.forEach(l => l(total));
  }
}

export const chatService = new ChatService();
