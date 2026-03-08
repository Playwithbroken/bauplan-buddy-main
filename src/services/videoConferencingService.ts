export interface VideoConferenceProvider {
  id: string;
  name: string;
  type: 'zoom' | 'teams' | 'meet' | 'webex' | 'jitsi' | 'custom';
  enabled: boolean;
  authenticated: boolean;
  apiKey: string;
  apiSecret?: string;
  clientId?: string;
  redirectUri?: string;
  webhookUrl?: string;
  config: ProviderConfig;
  lastSync: Date;
  rateLimits: RateLimitInfo;
}

export interface ProviderConfig {
  defaultDuration: number; // minutes
  autoRecording: boolean;
  waitingRoom: boolean;
  joinBeforeHost: boolean;
  muteOnEntry: boolean;
  videoOnEntry: boolean;
  maxParticipants: number;
  allowScreenShare: boolean;
  allowChat: boolean;
  securitySettings: SecuritySettings;
}

export interface SecuritySettings {
  requirePassword: boolean;
  requireAuthentication: boolean;
  enableEncryption: boolean;
  allowAnonymousJoin: boolean;
  lockMeeting: boolean;
  webinarMode: boolean;
}

export interface RateLimitInfo {
  requestsPerMinute: number;
  requestsRemaining: number;
  resetTime: Date;
}

export interface VideoMeeting {
  id: string;
  title: string;
  description: string;
  hostId: string;
  hostName: string;
  providerId: string;
  providerType: string;
  meetingId: string;
  externalMeetingId: string;
  joinUrl: string;
  password?: string;
  startTime: Date;
  endTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  timezone: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  participants: MeetingParticipant[];
  invitees: MeetingInvitee[];
  settings: MeetingSettings;
  recording?: RecordingInfo;
  chat?: ChatMessage[];
  polls?: Poll[];
  breakoutRooms?: BreakoutRoom[];
  projectId?: string;
  eventId?: string;
  created: Date;
  updated: Date;
}

export interface MeetingParticipant {
  id: string;
  userId?: string;
  name: string;
  email: string;
  role: 'host' | 'co-host' | 'participant' | 'panelist';
  joinTime: Date;
  leaveTime?: Date;
  duration?: number;
  isActive: boolean;
  cameraOn: boolean;
  microphoneOn: boolean;
  screenSharing: boolean;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  device: DeviceInfo;
}

export interface MeetingInvitee {
  email: string;
  name: string;
  role: 'required' | 'optional';
  status: 'pending' | 'accepted' | 'declined' | 'joined';
  joinedAt?: Date;
  notificationsSent: number;
  lastNotification?: Date;
}

export interface MeetingSettings {
  waitingRoom: boolean;
  joinBeforeHost: boolean;
  muteOnEntry: boolean;
  videoOnEntry: boolean;
  allowScreenShare: boolean;
  allowChat: boolean;
  allowRecording: boolean;
  autoRecord: boolean;
  recordToCloud: boolean;
  enableBreakoutRooms: boolean;
  maxParticipants: number;
  requirePassword: boolean;
  enablePolls: boolean;
  enableAnnotations: boolean;
}

export interface RecordingInfo {
  id: string;
  status: 'recording' | 'processing' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  fileSize?: number;
  downloadUrl?: string;
  playbackUrl?: string;
  cloudStorage: boolean;
  transcription?: TranscriptionInfo;
  highlights?: RecordingHighlight[];
}

export interface TranscriptionInfo {
  available: boolean;
  status: 'processing' | 'completed' | 'failed';
  language: string;
  confidence: number;
  text?: string;
  downloadUrl?: string;
  speakers: SpeakerInfo[];
}

export interface SpeakerInfo {
  id: string;
  name: string;
  speakingTime: number;
  segments: TranscriptSegment[];
}

export interface TranscriptSegment {
  startTime: number;
  endTime: number;
  text: string;
  confidence: number;
  speakerId: string;
}

export interface RecordingHighlight {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  type: 'action_item' | 'decision' | 'question' | 'important_point';
  description: string;
  participants: string[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
  type: 'public' | 'private' | 'system';
  recipientId?: string;
  attachments?: ChatAttachment[];
}

export interface ChatAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface Poll {
  id: string;
  title: string;
  question: string;
  options: PollOption[];
  type: 'single_choice' | 'multiple_choice' | 'rating' | 'text';
  status: 'draft' | 'active' | 'ended';
  startTime?: Date;
  endTime?: Date;
  anonymous: boolean;
  showResults: boolean;
  responses: PollResponse[];
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface PollResponse {
  participantId: string;
  participantName: string;
  response: string[];
  timestamp: Date;
}

export interface BreakoutRoom {
  id: string;
  name: string;
  capacity: number;
  participants: string[];
  status: 'open' | 'closed';
  autoAssignment: boolean;
  duration?: number;
  startTime?: Date;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet' | 'phone';
  os: string;
  browser: string;
  microphone: string;
  camera: string;
  speaker: string;
}

export interface MeetingAnalytics {
  meetingId: string;
  totalParticipants: number;
  averageParticipants: number;
  peakParticipants: number;
  totalDuration: number;
  averageJoinTime: number;
  participantEngagement: ParticipantEngagement[];
  qualityMetrics: QualityMetrics;
  chatActivity: ChatActivity;
  recordingStats?: RecordingStats;
}

export interface ParticipantEngagement {
  participantId: string;
  name: string;
  joinDuration: number;
  cameraOnTime: number;
  microphoneOnTime: number;
  chatMessages: number;
  screenShareTime: number;
  engagementScore: number;
}

export interface QualityMetrics {
  averageAudioQuality: number;
  averageVideoQuality: number;
  connectionIssues: number;
  dropouts: number;
  latencyIssues: number;
}

export interface ChatActivity {
  totalMessages: number;
  activeParticipants: number;
  messageFrequency: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface RecordingStats {
  recordingDuration: number;
  fileSize: number;
  viewCount: number;
  downloadCount: number;
  transcriptionAccuracy: number;
}

export class VideoConferencingService {
  private static instance: VideoConferencingService;
  private providers: Map<string, VideoConferenceProvider> = new Map();
  private meetings: Map<string, VideoMeeting> = new Map();
  private analytics: Map<string, MeetingAnalytics> = new Map();
  private activeMeetings: Set<string> = new Set();

  static getInstance(): VideoConferencingService {
    if (!VideoConferencingService.instance) {
      VideoConferencingService.instance = new VideoConferencingService();
    }
    return VideoConferencingService.instance;
  }

  constructor() {
    this.loadData();
    this.initializeDefaultProviders();
    this.startMeetingMonitoring();
  }

  private loadData(): void {
    try {
      // Load providers
      const storedProviders = localStorage.getItem('video_providers');
      if (storedProviders) {
        const providerData = JSON.parse(storedProviders);
        Object.entries(providerData).forEach(([id, provider]: [string, VideoConferenceProvider]) => {
          this.providers.set(id, {
            ...provider,
            lastSync: new Date(provider.lastSync),
            rateLimits: {
              ...provider.rateLimits,
              resetTime: new Date(provider.rateLimits.resetTime)
            }
          });
        });
      }

      // Load meetings
      const storedMeetings = localStorage.getItem('video_meetings');
      if (storedMeetings) {
        const meetingData = JSON.parse(storedMeetings);
        Object.entries(meetingData).forEach(([id, meeting]: [string, VideoMeeting]) => {
          this.meetings.set(id, {
            ...meeting,
            startTime: new Date(meeting.startTime),
            endTime: new Date(meeting.endTime),
            actualStartTime: meeting.actualStartTime ? new Date(meeting.actualStartTime) : undefined,
            actualEndTime: meeting.actualEndTime ? new Date(meeting.actualEndTime) : undefined,
            created: new Date(meeting.created),
            updated: new Date(meeting.updated),
            participants: meeting.participants?.map((p: MeetingParticipant) => ({
              ...p,
              joinTime: new Date(p.joinTime),
              leaveTime: p.leaveTime ? new Date(p.leaveTime) : undefined
            })) || [],
            chat: meeting.chat?.map((msg: ChatMessage) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            })) || []
          });
        });
      }
    } catch (error) {
      console.error('Failed to load video conferencing data:', error);
    }
  }

  private saveData(): void {
    try {
      // Save providers
      const providerData: Record<string, VideoConferenceProvider> = {};
      this.providers.forEach((provider, id) => {
        providerData[id] = provider;
      });
      localStorage.setItem('video_providers', JSON.stringify(providerData));

      // Save meetings
      const meetingData: Record<string, VideoMeeting> = {};
      this.meetings.forEach((meeting, id) => {
        meetingData[id] = meeting;
      });
      localStorage.setItem('video_meetings', JSON.stringify(meetingData));
    } catch (error) {
      console.error('Failed to save video conferencing data:', error);
    }
  }

  private initializeDefaultProviders(): void {
    // Add default providers if they don't exist
    const defaultProviders = [
      {
        id: 'zoom_default',
        name: 'Zoom',
        type: 'zoom' as const,
        enabled: false,
        authenticated: false
      },
      {
        id: 'teams_default',
        name: 'Microsoft Teams',
        type: 'teams' as const,
        enabled: false,
        authenticated: false
      },
      {
        id: 'meet_default',
        name: 'Google Meet',
        type: 'meet' as const,
        enabled: false,
        authenticated: false
      },
      {
        id: 'jitsi_default',
        name: 'Jitsi Meet',
        type: 'jitsi' as const,
        enabled: true,
        authenticated: true // Jitsi doesn't require authentication
      }
    ];

    defaultProviders.forEach(providerData => {
      if (!this.providers.has(providerData.id)) {
        const provider: VideoConferenceProvider = {
          ...providerData,
          apiKey: '',
          config: this.getDefaultProviderConfig(),
          lastSync: new Date(),
          rateLimits: {
            requestsPerMinute: 100,
            requestsRemaining: 100,
            resetTime: new Date(Date.now() + 60000)
          }
        };
        this.providers.set(providerData.id, provider);
      }
    });

    this.saveData();
  }

  private getDefaultProviderConfig(): ProviderConfig {
    return {
      defaultDuration: 60,
      autoRecording: false,
      waitingRoom: true,
      joinBeforeHost: false,
      muteOnEntry: true,
      videoOnEntry: false,
      maxParticipants: 100,
      allowScreenShare: true,
      allowChat: true,
      securitySettings: {
        requirePassword: true,
        requireAuthentication: false,
        enableEncryption: true,
        allowAnonymousJoin: true,
        lockMeeting: false,
        webinarMode: false
      }
    };
  }

  private startMeetingMonitoring(): void {
    // Monitor active meetings every 30 seconds
    setInterval(() => {
      this.updateActiveMeetings();
    }, 30000);
  }

  private updateActiveMeetings(): void {
    const now = new Date();
    
    this.meetings.forEach((meeting, id) => {
      const isActive = meeting.status === 'live' || 
        (meeting.status === 'scheduled' && 
         meeting.startTime <= now && 
         meeting.endTime > now);

      if (isActive && !this.activeMeetings.has(id)) {
        this.activeMeetings.add(id);
        this.onMeetingStart(meeting);
      } else if (!isActive && this.activeMeetings.has(id)) {
        this.activeMeetings.delete(id);
        this.onMeetingEnd(meeting);
      }
    });
  }

  private onMeetingStart(meeting: VideoMeeting): void {
    meeting.status = 'live';
    meeting.actualStartTime = new Date();
    this.saveData();
    
    // Send notifications to participants
    this.notifyMeetingStart(meeting);
  }

  private onMeetingEnd(meeting: VideoMeeting): void {
    meeting.status = 'ended';
    meeting.actualEndTime = new Date();
    
    // Generate analytics
    this.generateMeetingAnalytics(meeting);
    this.saveData();
  }

  private notifyMeetingStart(meeting: VideoMeeting): void {
    // In a real implementation, send push notifications or emails
    console.log(`Meeting "${meeting.title}" has started`);
  }

  private generateMeetingAnalytics(meeting: VideoMeeting): void {
    const analytics: MeetingAnalytics = {
      meetingId: meeting.id,
      totalParticipants: meeting.participants.length,
      averageParticipants: meeting.participants.length,
      peakParticipants: meeting.participants.length,
      totalDuration: meeting.actualEndTime && meeting.actualStartTime ? 
        meeting.actualEndTime.getTime() - meeting.actualStartTime.getTime() : 0,
      averageJoinTime: this.calculateAverageJoinTime(meeting.participants),
      participantEngagement: this.calculateEngagement(meeting.participants),
      qualityMetrics: this.calculateQualityMetrics(meeting.participants),
      chatActivity: this.calculateChatActivity(meeting.chat || [])
    };

    this.analytics.set(meeting.id, analytics);
  }

  private calculateAverageJoinTime(participants: MeetingParticipant[]): number {
    if (participants.length === 0) return 0;
    
    const totalJoinTime = participants.reduce((sum, p) => sum + (p.duration || 0), 0);
    return totalJoinTime / participants.length;
  }

  private calculateEngagement(participants: MeetingParticipant[]): ParticipantEngagement[] {
    return participants.map(participant => ({
      participantId: participant.id,
      name: participant.name,
      joinDuration: participant.duration || 0,
      cameraOnTime: participant.duration || 0, // Simplified
      microphoneOnTime: participant.duration || 0, // Simplified
      chatMessages: 0, // Would count from chat messages
      screenShareTime: 0, // Would track screen sharing time
      engagementScore: Math.random() * 100 // Simplified scoring
    }));
  }

  private calculateQualityMetrics(participants: MeetingParticipant[]): QualityMetrics {
    return {
      averageAudioQuality: 85,
      averageVideoQuality: 80,
      connectionIssues: 0,
      dropouts: 0,
      latencyIssues: 0
    };
  }

  private calculateChatActivity(chat: ChatMessage[]): ChatActivity {
    const publicMessages = chat.filter(msg => msg.type === 'public');
    const uniqueParticipants = new Set(publicMessages.map(msg => msg.senderId));
    
    return {
      totalMessages: publicMessages.length,
      activeParticipants: uniqueParticipants.size,
      messageFrequency: publicMessages.length / Math.max(1, 60), // Messages per minute
      sentiment: 'neutral'
    };
  }

  // Provider Management
  public async authenticateProvider(providerId: string, credentials: { apiKey?: string; apiSecret?: string; clientId?: string }): Promise<boolean> {
    const provider = this.providers.get(providerId);
    if (!provider) return false;

    try {
      // In a real implementation, this would authenticate with the actual provider
      provider.apiKey = credentials.apiKey || '';
      provider.apiSecret = credentials.apiSecret;
      provider.clientId = credentials.clientId;
      provider.authenticated = true;
      provider.enabled = true;
      
      this.saveData();
      return true;
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }

  public getProviders(): VideoConferenceProvider[] {
    return Array.from(this.providers.values());
  }

  public updateProviderConfig(providerId: string, config: Partial<ProviderConfig>): boolean {
    const provider = this.providers.get(providerId);
    if (!provider) return false;

    provider.config = { ...provider.config, ...config };
    this.saveData();
    return true;
  }

  // Meeting Management
  public async createMeeting(meetingData: Partial<VideoMeeting>): Promise<VideoMeeting> {
    const provider = this.providers.get(meetingData.providerId || 'jitsi_default');
    if (!provider) {
      throw new Error('Provider not found');
    }

    const meeting: VideoMeeting = {
      id: `meeting_${Date.now()}`,
      title: meetingData.title || 'New Meeting',
      description: meetingData.description || '',
      hostId: meetingData.hostId || 'current_user',
      hostName: meetingData.hostName || 'Current User',
      providerId: provider.id,
      providerType: provider.type,
      meetingId: this.generateMeetingId(),
      externalMeetingId: this.generateExternalMeetingId(provider.type),
      joinUrl: this.generateJoinUrl(provider.type),
      password: this.generateMeetingPassword(),
      startTime: meetingData.startTime || new Date(),
      endTime: meetingData.endTime || new Date(Date.now() + 60 * 60 * 1000),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      status: 'scheduled',
      participants: [],
      invitees: meetingData.invitees || [],
      settings: {
        ...provider.config,
        waitingRoom: meetingData.settings?.waitingRoom ?? provider.config.waitingRoom,
        joinBeforeHost: meetingData.settings?.joinBeforeHost ?? provider.config.joinBeforeHost,
        muteOnEntry: meetingData.settings?.muteOnEntry ?? provider.config.muteOnEntry,
        videoOnEntry: meetingData.settings?.videoOnEntry ?? provider.config.videoOnEntry,
        allowScreenShare: meetingData.settings?.allowScreenShare ?? provider.config.allowScreenShare,
        allowChat: meetingData.settings?.allowChat ?? provider.config.allowChat,
        allowRecording: true,
        autoRecord: provider.config.autoRecording,
        recordToCloud: true,
        enableBreakoutRooms: false,
        maxParticipants: provider.config.maxParticipants,
        requirePassword: provider.config.securitySettings.requirePassword,
        enablePolls: true,
        enableAnnotations: true
      },
      projectId: meetingData.projectId,
      eventId: meetingData.eventId,
      created: new Date(),
      updated: new Date()
    };

    this.meetings.set(meeting.id, meeting);
    
    // Send invitations
    await this.sendMeetingInvitations(meeting);
    
    this.saveData();
    return meeting;
  }

  private generateMeetingId(): string {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
  }

  private generateExternalMeetingId(providerType: string): string {
    switch (providerType) {
      case 'zoom':
        return Math.floor(Math.random() * 9000000000) + 1000000000 + '';
      case 'teams':
        return `teams_${Date.now()}`;
      case 'meet':
        return `meet_${Math.random().toString(36).substr(2, 10)}`;
      case 'jitsi':
        return `bauplan_${Date.now()}`;
      default:
        return `meeting_${Date.now()}`;
    }
  }

  private generateJoinUrl(providerType: string): string {
    const meetingId = this.generateExternalMeetingId(providerType);
    
    switch (providerType) {
      case 'zoom':
        return `https://zoom.us/j/${meetingId}`;
      case 'teams':
        return `https://teams.microsoft.com/l/meetup-join/${meetingId}`;
      case 'meet':
        return `https://meet.google.com/${meetingId}`;
      case 'jitsi':
        return `https://meet.jit.si/${meetingId}`;
      default:
        return `https://example.com/meeting/${meetingId}`;
    }
  }

  private generateMeetingPassword(): string {
    return Math.random().toString(36).substr(2, 8);
  }

  private async sendMeetingInvitations(meeting: VideoMeeting): Promise<void> {
    // In a real implementation, this would send actual invitations
    meeting.invitees.forEach(invitee => {
      console.log(`Sending invitation to ${invitee.email} for meeting "${meeting.title}"`);
    });
  }

  public updateMeeting(meetingId: string, updates: Partial<VideoMeeting>): VideoMeeting | null {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) return null;

    const updatedMeeting: VideoMeeting = {
      ...meeting,
      ...updates,
      updated: new Date()
    };

    this.meetings.set(meetingId, updatedMeeting);
    this.saveData();
    return updatedMeeting;
  }

  public deleteMeeting(meetingId: string): boolean {
    const deleted = this.meetings.delete(meetingId);
    if (deleted) {
      this.activeMeetings.delete(meetingId);
      this.analytics.delete(meetingId);
      this.saveData();
    }
    return deleted;
  }

  public startMeeting(meetingId: string): boolean {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) return false;

    meeting.status = 'live';
    meeting.actualStartTime = new Date();
    this.activeMeetings.add(meetingId);
    this.saveData();
    return true;
  }

  public endMeeting(meetingId: string): boolean {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) return false;

    meeting.status = 'ended';
    meeting.actualEndTime = new Date();
    this.activeMeetings.delete(meetingId);
    this.generateMeetingAnalytics(meeting);
    this.saveData();
    return true;
  }

  // Query Methods
  public getMeetings(startDate?: Date, endDate?: Date): VideoMeeting[] {
    const meetings = Array.from(this.meetings.values());
    
    if (startDate || endDate) {
      return meetings.filter(meeting => {
        if (startDate && meeting.endTime < startDate) return false;
        if (endDate && meeting.startTime > endDate) return false;
        return true;
      });
    }
    
    return meetings;
  }

  public getActiveMeetings(): VideoMeeting[] {
    return Array.from(this.activeMeetings).map(id => this.meetings.get(id)!).filter(Boolean);
  }

  public getMeetingsByProject(projectId: string): VideoMeeting[] {
    return Array.from(this.meetings.values()).filter(meeting => meeting.projectId === projectId);
  }

  public getMeetingAnalytics(meetingId: string): MeetingAnalytics | null {
    return this.analytics.get(meetingId) || null;
  }

  public getConferencingStats(): {
    totalMeetings: number;
    activeMeetings: number;
    totalParticipants: number;
    averageDuration: number;
  } {
    const meetings = Array.from(this.meetings.values());
    const activeMeetingsCount = this.activeMeetings.size;
    const totalParticipants = meetings.reduce((sum, meeting) => sum + meeting.participants.length, 0);
    const totalDuration = meetings.reduce((sum, meeting) => {
      if (meeting.actualStartTime && meeting.actualEndTime) {
        return sum + (meeting.actualEndTime.getTime() - meeting.actualStartTime.getTime());
      }
      return sum;
    }, 0);
    
    return {
      totalMeetings: meetings.length,
      activeMeetings: activeMeetingsCount,
      totalParticipants,
      averageDuration: meetings.length > 0 ? totalDuration / meetings.length : 0
    };
  }
}

export default VideoConferencingService.getInstance();