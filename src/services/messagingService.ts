import { v4 as uuidv4 } from 'uuid';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  receiverId?: string; // For direct messages
  roomId?: string; // For group chats
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  timestamp: Date;
  edited?: boolean;
  editedAt?: Date;
  replyTo?: string; // Message ID this is replying to
  reactions: MessageReaction[];
  attachments: MessageAttachment[];
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  mentions: string[]; // User IDs mentioned in message
  isDeleted?: boolean;
}

export interface MessageReaction {
  id: string;
  userId: string;
  userName: string;
  emoji: string;
  timestamp: Date;
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  type: 'direct' | 'group' | 'project' | 'team';
  participants: ChatParticipant[];
  admins: string[]; // User IDs
  createdBy: string;
  createdAt: Date;
  lastMessage?: ChatMessage;
  lastActivity: Date;
  isArchived: boolean;
  settings: RoomSettings;
  projectId?: string; // Link to project if project room
  teamId?: string; // Link to team if team room
}

export interface ChatParticipant {
  userId: string;
  userName: string;
  userAvatar?: string;
  role: 'member' | 'admin' | 'moderator';
  joinedAt: Date;
  lastSeen: Date;
  isOnline: boolean;
  unreadCount: number;
  mutedUntil?: Date;
}

export interface RoomSettings {
  allowFileUploads: boolean;
  allowReactions: boolean;
  maxMessageLength: number;
  retentionDays?: number;
  requireApprovalForNewMembers: boolean;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  roomId: string;
  timestamp: Date;
}

export interface MessageThread {
  id: string;
  rootMessageId: string;
  messages: ChatMessage[];
  participants: string[];
  lastActivity: Date;
}

export interface ChatNotification {
  id: string;
  type: 'message' | 'mention' | 'reaction' | 'room_invite';
  userId: string;
  messageId?: string;
  roomId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

export class MessagingService {
  private static instance: MessagingService;
  private messages: Map<string, ChatMessage[]> = new Map(); // roomId -> messages
  private rooms: Map<string, ChatRoom> = new Map();
  private typingIndicators: Map<string, TypingIndicator[]> = new Map(); // roomId -> typing users
  private onlineUsers: Set<string> = new Set();
  private messageListeners: Map<string, Array<(message: ChatMessage) => void>> = new Map();
  private roomListeners: Array<(rooms: ChatRoom[]) => void> = [];
  private typingListeners: Map<string, Array<(typingUsers: TypingIndicator[]) => void>> = new Map();
  private currentUserId: string = '';

  static getInstance(): MessagingService {
    if (!MessagingService.instance) {
      MessagingService.instance = new MessagingService();
    }
    return MessagingService.instance;
  }

  // Initialize service with current user
  initialize(userId: string): void {
    this.currentUserId = userId;
    this.loadStoredData();
    this.simulateWebSocketConnection();
  }

  // Load data from localStorage
  private loadStoredData(): void {
    try {
      const storedRooms = localStorage.getItem('chat_rooms');
      if (storedRooms) {
        const rooms = JSON.parse(storedRooms) as Array<
          Omit<ChatRoom, 'createdAt' | 'lastActivity' | 'participants'> & {
            createdAt: string;
            lastActivity: string;
            participants: Array<
              Omit<ChatParticipant, 'joinedAt' | 'lastSeen'> & {
                joinedAt: string;
                lastSeen: string;
              }
            >;
          }
        >;
        rooms.forEach((room) => {
          this.rooms.set(room.id, {
            ...room,
            createdAt: new Date(room.createdAt),
            lastActivity: new Date(room.lastActivity),
            participants: room.participants.map((p) => ({
              ...p,
              joinedAt: new Date(p.joinedAt),
              lastSeen: new Date(p.lastSeen)
            }))
          });
        });
      }

      const storedMessages = localStorage.getItem('chat_messages');
      if (storedMessages) {
        const messagesByRoom = JSON.parse(storedMessages) as Record<
          string,
          Array<
            Omit<ChatMessage, 'timestamp' | 'editedAt'> & {
              timestamp: string;
              editedAt?: string;
            }
          >
        >;
        Object.entries(messagesByRoom).forEach(([roomId, messages]) => {
          this.messages.set(roomId, messages.map((msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
            editedAt: msg.editedAt ? new Date(msg.editedAt) : undefined
          })));
        });
      }
    } catch (error) {
      console.error('Failed to load messaging data:', error);
    }
  }

  // Save data to localStorage
  private saveData(): void {
    try {
      const roomsArray = Array.from(this.rooms.values());
      localStorage.setItem('chat_rooms', JSON.stringify(roomsArray));

      const messagesObject: Record<string, ChatMessage[]> = {};
      this.messages.forEach((messages, roomId) => {
        messagesObject[roomId] = messages;
      });
      localStorage.setItem('chat_messages', JSON.stringify(messagesObject));
    } catch (error) {
      console.error('Failed to save messaging data:', error);
    }
  }

  // Create initial demo rooms and messages
  private simulateWebSocketConnection(): void {
    // Create demo rooms if none exist
    if (this.rooms.size === 0) {
      this.createDemoData();
    }

    // Simulate online status updates
    setInterval(() => {
      this.updateOnlineStatus();
    }, 30000);

    // Simulate incoming messages occasionally
    setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance every interval
        this.simulateIncomingMessage();
      }
    }, 45000);
  }

  private createDemoData(): void {
    // Create a project room
    const projectRoom: ChatRoom = {
      id: 'room-project-001',
      name: 'Projekt Neubau Müller',
      description: 'Chat für das Neubauprojekt Familie Müller',
      type: 'project',
      participants: [
        {
          userId: this.currentUserId,
          userName: 'Sie',
          role: 'admin',
          joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          lastSeen: new Date(),
          isOnline: true,
          unreadCount: 0
        },
        {
          userId: 'user-002',
          userName: 'Thomas Schmidt',
          role: 'member',
          joinedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000),
          isOnline: false,
          unreadCount: 2
        },
        {
          userId: 'user-003',
          userName: 'Anna Weber',
          role: 'member',
          joinedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          lastSeen: new Date(Date.now() - 10 * 60 * 1000),
          isOnline: true,
          unreadCount: 1
        }
      ],
      admins: [this.currentUserId],
      createdBy: this.currentUserId,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      lastActivity: new Date(),
      isArchived: false,
      settings: {
        allowFileUploads: true,
        allowReactions: true,
        maxMessageLength: 2000,
        requireApprovalForNewMembers: false
      },
      projectId: 'PRJ-2024-001'
    };

    // Create a team room
    const teamRoom: ChatRoom = {
      id: 'room-team-001',
      name: 'Team Alpha',
      description: 'Allgemeiner Chat für Team Alpha',
      type: 'team',
      participants: [
        {
          userId: this.currentUserId,
          userName: 'Sie',
          role: 'admin',
          joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          lastSeen: new Date(),
          isOnline: true,
          unreadCount: 0
        },
        {
          userId: 'user-004',
          userName: 'Michael Jung',
          role: 'member',
          joinedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
          lastSeen: new Date(Date.now() - 30 * 60 * 1000),
          isOnline: true,
          unreadCount: 0
        },
        {
          userId: 'user-005',
          userName: 'Sarah Miller',
          role: 'member',
          joinedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          lastSeen: new Date(Date.now() - 3 * 60 * 60 * 1000),
          isOnline: false,
          unreadCount: 3
        }
      ],
      admins: [this.currentUserId],
      createdBy: this.currentUserId,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      lastActivity: new Date(Date.now() - 60 * 60 * 1000),
      isArchived: false,
      settings: {
        allowFileUploads: true,
        allowReactions: true,
        maxMessageLength: 1000,
        requireApprovalForNewMembers: false
      },
      teamId: 'team-alpha'
    };

    this.rooms.set(projectRoom.id, projectRoom);
    this.rooms.set(teamRoom.id, teamRoom);

    // Create demo messages
    this.createDemoMessages();
    this.saveData();
  }

  private createDemoMessages(): void {
    const projectMessages: ChatMessage[] = [
      {
        id: uuidv4(),
        senderId: 'user-002',
        senderName: 'Thomas Schmidt',
        roomId: 'room-project-001',
        content: 'Guten Morgen! Sind die Materialen für heute angekommen?',
        messageType: 'text',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        reactions: [],
        attachments: [],
        status: 'read',
        mentions: []
      },
      {
        id: uuidv4(),
        senderId: this.currentUserId,
        senderName: 'Sie',
        roomId: 'room-project-001',
        content: 'Ja, alles ist da. Können wir um 10 Uhr mit dem Fundament beginnen?',
        messageType: 'text',
        timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
        reactions: [
          {
            id: uuidv4(),
            userId: 'user-002',
            userName: 'Thomas Schmidt',
            emoji: '👍',
            timestamp: new Date(Date.now() - 2.4 * 60 * 60 * 1000)
          }
        ],
        attachments: [],
        status: 'read',
        mentions: []
      },
      {
        id: uuidv4(),
        senderId: 'user-003',
        senderName: 'Anna Weber',
        roomId: 'room-project-001',
        content: 'Perfekt! Ich bring die Vermessungsgeräte mit.',
        messageType: 'text',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        reactions: [],
        attachments: [],
        status: 'read',
        mentions: []
      }
    ];

    const teamMessages: ChatMessage[] = [
      {
        id: uuidv4(),
        senderId: 'user-004',
        senderName: 'Michael Jung',
        roomId: 'room-team-001',
        content: 'Team-Meeting morgen um 9 Uhr. Bitte alle da sein!',
        messageType: 'text',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        reactions: [],
        attachments: [],
        status: 'read',
        mentions: [this.currentUserId, 'user-005']
      },
      {
        id: uuidv4(),
        senderId: this.currentUserId,
        senderName: 'Sie',
        roomId: 'room-team-001',
        content: 'Bin dabei! Soll ich die Quartalszahlen mitbringen?',
        messageType: 'text',
        timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000),
        reactions: [],
        attachments: [],
        status: 'read',
        mentions: []
      }
    ];

    this.messages.set('room-project-001', projectMessages);
    this.messages.set('room-team-001', teamMessages);
  }

  private updateOnlineStatus(): void {
    this.rooms.forEach(room => {
      room.participants.forEach(participant => {
        // Simulate online/offline status changes
        if (Math.random() < 0.2) {
          participant.isOnline = !participant.isOnline;
          participant.lastSeen = new Date();
        }
      });
    });
    this.saveData();
    this.notifyRoomListeners();
  }

  private simulateIncomingMessage(): void {
    const roomIds = Array.from(this.rooms.keys());
    if (roomIds.length === 0) return;

    const randomRoomId = roomIds[Math.floor(Math.random() * roomIds.length)];
    const room = this.rooms.get(randomRoomId);
    if (!room) return;

    const otherParticipants = room.participants.filter(p => p.userId !== this.currentUserId);
    if (otherParticipants.length === 0) return;

    const randomSender = otherParticipants[Math.floor(Math.random() * otherParticipants.length)];
    
    const sampleMessages = [
      'Alles klar für heute!',
      'Brauchen wir noch was vom Baumarkt?',
      'Terminverschiebung auf nächste Woche ok?',
      'Fotos vom Fortschritt sind im Cloud-Ordner',
      'Kunde hat nachgefragt wegen Fertigstellung'
    ];

    const message: ChatMessage = {
      id: uuidv4(),
      senderId: randomSender.userId,
      senderName: randomSender.userName,
      roomId: randomRoomId,
      content: sampleMessages[Math.floor(Math.random() * sampleMessages.length)],
      messageType: 'text',
      timestamp: new Date(),
      reactions: [],
      attachments: [],
      status: 'sent',
      mentions: []
    };

    this.addMessage(message);
  }

  // Public API methods
  getRooms(): ChatRoom[] {
    return Array.from(this.rooms.values())
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }

  getRoom(roomId: string): ChatRoom | undefined {
    return this.rooms.get(roomId);
  }

  getMessages(roomId: string, limit?: number, offset?: number): ChatMessage[] {
    const messages = this.messages.get(roomId) || [];
    if (limit) {
      const start = offset || 0;
      return messages.slice(start, start + limit);
    }
    return messages;
  }

  sendMessage(content: string, roomId: string, messageType: 'text' | 'image' | 'file' = 'text', attachments: MessageAttachment[] = []): Promise<ChatMessage> {
    return new Promise((resolve) => {
      const message: ChatMessage = {
        id: uuidv4(),
        senderId: this.currentUserId,
        senderName: 'Sie',
        roomId,
        content,
        messageType,
        timestamp: new Date(),
        reactions: [],
        attachments,
        status: 'sending',
        mentions: this.extractMentions(content)
      };

      this.addMessage(message);

      // Simulate sending delay
      setTimeout(() => {
        message.status = 'sent';
        this.updateMessage(message);
        resolve(message);
      }, 500);
    });
  }

  private extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  }

  addMessage(message: ChatMessage): void {
    const roomMessages = this.messages.get(message.roomId!) || [];
    roomMessages.push(message);
    this.messages.set(message.roomId!, roomMessages);

    // Update room last activity
    const room = this.rooms.get(message.roomId!);
    if (room) {
      room.lastActivity = message.timestamp;
      room.lastMessage = message;
    }

    this.saveData();
    this.notifyMessageListeners(message.roomId!);
  }

  updateMessage(message: ChatMessage): void {
    const roomMessages = this.messages.get(message.roomId!) || [];
    const index = roomMessages.findIndex(m => m.id === message.id);
    if (index !== -1) {
      roomMessages[index] = message;
      this.saveData();
      this.notifyMessageListeners(message.roomId!);
    }
  }

  addReaction(messageId: string, roomId: string, emoji: string): void {
    const messages = this.messages.get(roomId) || [];
    const message = messages.find(m => m.id === messageId);
    if (message) {
      const existingReaction = message.reactions.find(r => r.userId === this.currentUserId && r.emoji === emoji);
      if (existingReaction) {
        // Remove reaction
        message.reactions = message.reactions.filter(r => r !== existingReaction);
      } else {
        // Add reaction
        message.reactions.push({
          id: uuidv4(),
          userId: this.currentUserId,
          userName: 'Sie',
          emoji,
          timestamp: new Date()
        });
      }
      this.saveData();
      this.notifyMessageListeners(roomId);
    }
  }

  createRoom(name: string, type: ChatRoom['type'], participantIds: string[] = [], projectId?: string, teamId?: string): ChatRoom {
    const room: ChatRoom = {
      id: uuidv4(),
      name,
      type,
      participants: [
        {
          userId: this.currentUserId,
          userName: 'Sie',
          role: 'admin',
          joinedAt: new Date(),
          lastSeen: new Date(),
          isOnline: true,
          unreadCount: 0
        },
        ...participantIds.map(id => ({
          userId: id,
          userName: `User ${id}`,
          role: 'member' as const,
          joinedAt: new Date(),
          lastSeen: new Date(),
          isOnline: false,
          unreadCount: 0
        }))
      ],
      admins: [this.currentUserId],
      createdBy: this.currentUserId,
      createdAt: new Date(),
      lastActivity: new Date(),
      isArchived: false,
      settings: {
        allowFileUploads: true,
        allowReactions: true,
        maxMessageLength: 2000,
        requireApprovalForNewMembers: false
      },
      projectId,
      teamId
    };

    this.rooms.set(room.id, room);
    this.messages.set(room.id, []);
    this.saveData();
    this.notifyRoomListeners();
    return room;
  }

  // Event listeners
  onMessage(roomId: string, callback: (message: ChatMessage) => void): () => void {
    if (!this.messageListeners.has(roomId)) {
      this.messageListeners.set(roomId, []);
    }
    this.messageListeners.get(roomId)!.push(callback);

    return () => {
      const listeners = this.messageListeners.get(roomId) || [];
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    };
  }

  onRoomsUpdate(callback: (rooms: ChatRoom[]) => void): () => void {
    this.roomListeners.push(callback);
    return () => {
      const index = this.roomListeners.indexOf(callback);
      if (index !== -1) {
        this.roomListeners.splice(index, 1);
      }
    };
  }

  private notifyMessageListeners(roomId: string): void {
    const listeners = this.messageListeners.get(roomId) || [];
    const messages = this.getMessages(roomId);
    const latestMessage = messages[messages.length - 1];
    if (latestMessage) {
      listeners.forEach(callback => callback(latestMessage));
    }
  }

  private notifyRoomListeners(): void {
    const rooms = this.getRooms();
    this.roomListeners.forEach(callback => callback(rooms));
  }

  // Typing indicators
  startTyping(roomId: string): void {
    const indicators = this.typingIndicators.get(roomId) || [];
    const existing = indicators.find(i => i.userId === this.currentUserId);
    
    if (!existing) {
      indicators.push({
        userId: this.currentUserId,
        userName: 'Sie',
        roomId,
        timestamp: new Date()
      });
      this.typingIndicators.set(roomId, indicators);
      this.notifyTypingListeners(roomId);
    }

    // Auto-stop typing after 3 seconds
    setTimeout(() => this.stopTyping(roomId), 3000);
  }

  stopTyping(roomId: string): void {
    const indicators = this.typingIndicators.get(roomId) || [];
    const filtered = indicators.filter(i => i.userId !== this.currentUserId);
    this.typingIndicators.set(roomId, filtered);
    this.notifyTypingListeners(roomId);
  }

  getTypingUsers(roomId: string): TypingIndicator[] {
    return this.typingIndicators.get(roomId) || [];
  }

  onTyping(roomId: string, callback: (typingUsers: TypingIndicator[]) => void): () => void {
    if (!this.typingListeners.has(roomId)) {
      this.typingListeners.set(roomId, []);
    }
    this.typingListeners.get(roomId)!.push(callback);

    return () => {
      const listeners = this.typingListeners.get(roomId) || [];
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    };
  }

  private notifyTypingListeners(roomId: string): void {
    const listeners = this.typingListeners.get(roomId) || [];
    const typingUsers = this.getTypingUsers(roomId);
    listeners.forEach(callback => callback(typingUsers));
  }

  // Search messages
  searchMessages(query: string, roomId?: string): ChatMessage[] {
    const results: ChatMessage[] = [];
    const roomsToSearch = roomId ? [roomId] : Array.from(this.messages.keys());

    roomsToSearch.forEach(rId => {
      const messages = this.messages.get(rId) || [];
      const filtered = messages.filter(msg => 
        msg.content.toLowerCase().includes(query.toLowerCase()) ||
        msg.senderName.toLowerCase().includes(query.toLowerCase())
      );
      results.push(...filtered);
    });

    return results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Get unread count
  getUnreadCount(): number {
    let total = 0;
    this.rooms.forEach(room => {
      const participant = room.participants.find(p => p.userId === this.currentUserId);
      if (participant) {
        total += participant.unreadCount;
      }
    });
    return total;
  }

  // Mark messages as read
  markAsRead(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      const participant = room.participants.find(p => p.userId === this.currentUserId);
      if (participant) {
        participant.unreadCount = 0;
        this.saveData();
        this.notifyRoomListeners();
      }
    }
  }
}

export default MessagingService.getInstance();
