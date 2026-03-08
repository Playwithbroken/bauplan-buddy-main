import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Video, VideoOff, Mic, MicOff, Users, Clock, 
  Play, Square, Settings, Plus, Copy, ExternalLink,
  Calendar, MapPin, User, Monitor, BarChart3,
  Zap, Globe, Shield, Camera, PhoneCall
} from 'lucide-react';
import {
  Dialog,
  MultiWindowDialog,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DialogFrame } from '@/components/ui/dialog-frame';
import VideoConferencingService, {
  VideoMeeting,
  VideoConferenceProvider,
  MeetingAnalytics
} from '@/services/videoConferencingService';

interface VideoConferencingProps {
  className?: string;
}

const VideoConferencing: React.FC<VideoConferencingProps> = ({ className }) => {
  const { toast } = useToast();
  const [videoService] = useState(() => VideoConferencingService);
  const [providers, setProviders] = useState<VideoConferenceProvider[]>([]);
  const [meetings, setMeetings] = useState<VideoMeeting[]>([]);
  const [activeMeetings, setActiveMeetings] = useState<VideoMeeting[]>([]);
  const [stats, setStats] = useState({ totalMeetings: 0, activeMeetings: 0, totalParticipants: 0, averageDuration: 0 });
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    providerId: '',
    waitingRoom: true,
    muteOnEntry: true,
    videoOnEntry: false,
    requirePassword: true,
    invitees: '' // Comma-separated emails
  });

  useEffect(() => {
    loadData();
    
    // Set up real-time updates
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const loadData = React.useCallback(() => {
    setProviders(videoService.getProviders());
    setMeetings(videoService.getMeetings());
    setActiveMeetings(videoService.getActiveMeetings());
    setStats(videoService.getConferencingStats());
  }, [videoService]);

  const handleAuthenticateProvider = async (providerId: string) => {
    try {
      // In a real implementation, this would open OAuth flow
      const credentials = {
        apiKey: `demo_api_key_${Date.now()}`,
        apiSecret: `demo_secret_${Date.now()}`,
        clientId: `demo_client_${Date.now()}`
      };

      const success = await videoService.authenticateProvider(providerId, credentials);
      if (success) {
        loadData();
        toast({
          title: "Provider Authenticated",
          description: "Video conferencing provider has been connected successfully.",
        });
      } else {
        toast({
          title: "Authentication Failed",
          description: "Failed to authenticate with the provider.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Authentication Error",
        description: "An error occurred during authentication.",
        variant: "destructive"
      });
    }
  };

  const handleCreateMeeting = async () => {
    if (!newMeeting.title || !newMeeting.startTime || !newMeeting.endTime || !newMeeting.providerId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      const invitees = newMeeting.invitees
        .split(',')
        .map(email => email.trim())
        .filter(email => email)
        .map(email => ({
          email,
          name: email.split('@')[0],
          role: 'required' as const,
          status: 'pending' as const,
          notificationsSent: 0
        }));

      const meeting = await videoService.createMeeting({
        title: newMeeting.title,
        description: newMeeting.description,
        startTime: new Date(newMeeting.startTime),
        endTime: new Date(newMeeting.endTime),
        providerId: newMeeting.providerId,
        hostId: 'current_user',
        hostName: 'Current User',
        invitees,
        settings: {
          waitingRoom: newMeeting.waitingRoom,
          muteOnEntry: newMeeting.muteOnEntry,
          videoOnEntry: newMeeting.videoOnEntry,
          requirePassword: newMeeting.requirePassword,
          joinBeforeHost: false,
          allowScreenShare: true,
          allowChat: true,
          allowRecording: true,
          autoRecord: false,
          recordToCloud: true,
          enableBreakoutRooms: false,
          maxParticipants: 100,
          enablePolls: true,
          enableAnnotations: true
        }
      });

      loadData();
      setIsCreatingMeeting(false);
      setNewMeeting({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        providerId: '',
        waitingRoom: true,
        muteOnEntry: true,
        videoOnEntry: false,
        requirePassword: true,
        invitees: ''
      });

      toast({
        title: "Meeting Created",
        description: `"${meeting.title}" has been scheduled successfully.`,
      });
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: "Failed to create the meeting. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleStartMeeting = (meetingId: string) => {
    const success = videoService.startMeeting(meetingId);
    if (success) {
      loadData();
      toast({
        title: "Meeting Started",
        description: "The meeting has been started successfully.",
      });
    }
  };

  const handleEndMeeting = (meetingId: string) => {
    const success = videoService.endMeeting(meetingId);
    if (success) {
      loadData();
      toast({
        title: "Meeting Ended",
        description: "The meeting has been ended successfully.",
      });
    }
  };

  const handleCopyJoinUrl = (joinUrl: string) => {
    navigator.clipboard.writeText(joinUrl);
    toast({
      title: "Link Copied",
      description: "Meeting join link has been copied to clipboard.",
    });
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'zoom':
        return <Video className="h-4 w-4" />;
      case 'teams':
        return <Users className="h-4 w-4" />;
      case 'meet':
        return <Globe className="h-4 w-4" />;
      case 'jitsi':
        return <PhoneCall className="h-4 w-4" />;
      default:
        return <Video className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
      scheduled: 'secondary',
      live: 'default',
      ended: 'outline',
      cancelled: 'destructive'
    };
    
    const colors: Record<string, string> = {
      scheduled: 'text-blue-600',
      live: 'text-green-600',
      ended: 'text-gray-600',
      cancelled: 'text-red-600'
    };

    return { variant: variants[status] || 'outline', color: colors[status] || 'text-gray-600' };
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Video Conferencing</h2>
          <p className="text-muted-foreground">
            Schedule and manage video meetings with your team
          </p>
        </div>
        <MultiWindowDialog open={isCreatingMeeting} onOpenChange={setIsCreatingMeeting} modal={false}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Meeting
            </Button>
          </DialogTrigger>
          <DialogFrame
            title={
              <span className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Schedule New Meeting
              </span>
            }
            width="fit-content"
            minWidth={640}
            maxWidth={1024}
            resizable={true}
            footer={
              <div className="flex justify-end gap-2 w-full">
                <Button variant="outline" onClick={() => setIsCreatingMeeting(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateMeeting}>
                  Create Meeting
                </Button>
              </div>
            }
          >
            <DialogDescription>
              Create a new video meeting and invite participants
            </DialogDescription>
            <div className="space-y-4">
              <div>
                <Label htmlFor="meeting-title">Meeting Title *</Label>
                <Input
                  id="meeting-title"
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter meeting title"
                />
              </div>
              
              <div>
                <Label htmlFor="meeting-description">Description</Label>
                <Textarea
                  id="meeting-description"
                  value={newMeeting.description}
                  onChange={(e) => setNewMeeting(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Meeting description or agenda"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="provider">Video Platform *</Label>
                <Select
                  value={newMeeting.providerId}
                  onValueChange={(value) => setNewMeeting(prev => ({ ...prev, providerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select video platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.filter(p => p.authenticated).map(provider => (
                      <SelectItem key={provider.id} value={provider.id}>
                        <div className="flex items-center gap-2">
                          {getProviderIcon(provider.type)}
                          {provider.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-time">Start Time *</Label>
                  <Input
                    id="start-time"
                    type="datetime-local"
                    value={newMeeting.startTime}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="end-time">End Time *</Label>
                  <Input
                    id="end-time"
                    type="datetime-local"
                    value={newMeeting.endTime}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="invitees">Invitees (comma-separated emails)</Label>
                <Textarea
                  id="invitees"
                  value={newMeeting.invitees}
                  onChange={(e) => setNewMeeting(prev => ({ ...prev, invitees: e.target.value }))}
                  placeholder="user1@example.com, user2@example.com"
                  rows={2}
                />
              </div>

              <div className="space-y-3">
                <Label>Meeting Settings</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="waiting-room">Waiting Room</Label>
                    <Switch
                      id="waiting-room"
                      checked={newMeeting.waitingRoom}
                      onCheckedChange={(checked) => setNewMeeting(prev => ({ ...prev, waitingRoom: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="mute-entry">Mute on Entry</Label>
                    <Switch
                      id="mute-entry"
                      checked={newMeeting.muteOnEntry}
                      onCheckedChange={(checked) => setNewMeeting(prev => ({ ...prev, muteOnEntry: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="video-entry">Video on Entry</Label>
                    <Switch
                      id="video-entry"
                      checked={newMeeting.videoOnEntry}
                      onCheckedChange={(checked) => setNewMeeting(prev => ({ ...prev, videoOnEntry: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="require-password">Require Password</Label>
                    <Switch
                      id="require-password"
                      checked={newMeeting.requirePassword}
                      onCheckedChange={(checked) => setNewMeeting(prev => ({ ...prev, requirePassword: checked }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </DialogFrame>
        </MultiWindowDialog>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total Meetings</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalMeetings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Active Meetings</span>
            </div>
            <div className="text-2xl font-bold">{stats.activeMeetings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Total Participants</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalParticipants}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Avg Duration</span>
            </div>
            <div className="text-2xl font-bold">
              {formatDuration(stats.averageDuration)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="meetings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
          <TabsTrigger value="active">Active ({stats.activeMeetings})</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
        </TabsList>

        <TabsContent value="meetings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Meetings</CardTitle>
              <CardDescription>
                All upcoming and past video meetings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {meetings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No meetings scheduled. Create your first meeting to get started.
                </p>
              ) : (
                <div className="space-y-4">
                  {meetings.slice(0, 10).map((meeting) => (
                    <div
                      key={meeting.id}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{meeting.title}</h3>
                            <Badge {...getStatusBadge(meeting.status)}>
                              {meeting.status.toUpperCase()}
                            </Badge>
                          </div>
                          {meeting.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {meeting.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDateTime(meeting.startTime)} - {formatDateTime(meeting.endTime)}
                            </span>
                            <span className="flex items-center gap-1">
                              {getProviderIcon(meeting.providerType)}
                              {providers.find(p => p.id === meeting.providerId)?.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {meeting.invitees.length} invitees
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {meeting.status === 'scheduled' && (
                            <Button
                              onClick={() => handleStartMeeting(meeting.id)}
                              size="sm"
                              variant="outline"
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Start
                            </Button>
                          )}
                          {meeting.status === 'live' && (
                            <Button
                              onClick={() => handleEndMeeting(meeting.id)}
                              size="sm"
                              variant="outline"
                            >
                              <Square className="h-4 w-4 mr-1" />
                              End
                            </Button>
                          )}
                          <Button
                            onClick={() => handleCopyJoinUrl(meeting.joinUrl)}
                            size="sm"
                            variant="outline"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => window.open(meeting.joinUrl, '_blank')}
                            size="sm"
                            variant="outline"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {meeting.password && (
                        <div className="text-xs text-muted-foreground">
                          <strong>Password:</strong> {meeting.password}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Meetings</CardTitle>
              <CardDescription>
                Currently live video meetings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeMeetings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No active meetings at the moment.
                </p>
              ) : (
                <div className="space-y-4">
                  {activeMeetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      className="border rounded-lg p-4 bg-green-50 dark:bg-green-900/20"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{meeting.title}</h3>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-sm text-green-700 dark:text-green-300">
                              LIVE
                            </span>
                          </div>
                          <Button
                            onClick={() => handleEndMeeting(meeting.id)}
                            size="sm"
                            variant="destructive"
                          >
                            <Square className="h-4 w-4 mr-1" />
                            End Meeting
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{meeting.participants.length} participants</span>
                        <span>
                          Started: {meeting.actualStartTime?.toLocaleTimeString()}
                        </span>
                        <Button
                          onClick={() => window.open(meeting.joinUrl, '_blank')}
                          size="sm"
                          variant="outline"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Join
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Video Conference Providers</CardTitle>
              <CardDescription>
                Manage your video conferencing platform integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {providers.map((provider) => (
                  <div
                    key={provider.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getProviderIcon(provider.type)}
                      <div>
                        <h3 className="font-medium">{provider.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {provider.type.charAt(0).toUpperCase() + provider.type.slice(1)} Integration
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={provider.authenticated ? 'default' : 'secondary'}
                      >
                        {provider.authenticated ? 'Connected' : 'Not Connected'}
                      </Badge>
                      {!provider.authenticated && (
                        <Button
                          onClick={() => handleAuthenticateProvider(provider.id)}
                          variant="outline"
                          size="sm"
                        >
                          Connect
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VideoConferencing;
