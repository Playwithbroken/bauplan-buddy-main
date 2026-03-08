import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageCircle, Users, Clock, TrendingUp, Settings, 
  UserPlus, Hash, Phone, Video, Search, Bell, Archive
} from 'lucide-react';
import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';
import { ChatInterface } from '@/components/chat/ChatInterface';
import MessagingService from '@/services/messagingService';
import { useToast } from '@/hooks/use-toast';

const ChatWithSidebar = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [totalRooms, setTotalRooms] = useState(0);
  const [activeRooms, setActiveRooms] = useState(0);
  const { toast } = useToast();

  // Initialize and load statistics
  useEffect(() => {
    MessagingService.initialize('current-user');
    
    const updateStats = () => {
      const rooms = MessagingService.getRooms();
      const unread = MessagingService.getUnreadCount();
      
      setTotalRooms(rooms.length);
      setUnreadCount(unread);
      
      // Count active rooms (with recent activity in last 24h)
      const now = new Date();
      const active = rooms.filter(room => {
        const diff = now.getTime() - room.lastActivity.getTime();
        return diff < 24 * 60 * 60 * 1000; // 24 hours
      }).length;
      setActiveRooms(active);
      
      // Count online users across all rooms
      const allParticipants = rooms.flatMap(room => room.participants);
      const uniqueOnlineUsers = new Set(
        allParticipants.filter(p => p.isOnline).map(p => p.userId)
      ).size;
      setOnlineUsers(uniqueOnlineUsers);
    };

    updateStats();
    
    // Subscribe to room updates
    const unsubscribe = MessagingService.onRoomsUpdate(updateStats);

    return () => {
      unsubscribe();
    };
  }, []);

  const handleCreateProjectRoom = () => {
    // Demo: Create a new project room
    const projectRooms = ['Renovierung Berlin', 'Neubau München', 'Sanierung Hamburg'];
    const randomProject = projectRooms[Math.floor(Math.random() * projectRooms.length)];
    
    MessagingService.createRoom(
      randomProject, 
      'project', 
      ['user-002', 'user-003'], 
      `proj-${Date.now()}`
    );
    
    toast({
      title: 'Projekt-Raum erstellt',
      description: `Der Raum "${randomProject}" wurde erfolgreich erstellt.`,
    });
  };

  const handleCreateTeamRoom = () => {
    // Demo: Create a new team room
    const teamNames = ['Team Beta', 'Team Gamma', 'Team Delta'];
    const randomTeam = teamNames[Math.floor(Math.random() * teamNames.length)];
    
    MessagingService.createRoom(
      randomTeam, 
      'team', 
      ['user-004', 'user-005'], 
      undefined,
      `team-${Date.now()}`
    );
    
    toast({
      title: 'Team-Raum erstellt',
      description: `Der Raum "${randomTeam}" wurde erfolgreich erstellt.`,
    });
  };

  const breadcrumbItems: { label: string }[] = [];

  return (
    <LayoutWithSidebar 
      breadcrumbItems={breadcrumbItems}
      pageTitle="Team-Kommunikation"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-muted-foreground">
              Echtzeitchat für Teams, Projekte und direkte Nachrichten
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCreateProjectRoom}>
              <Hash className="h-4 w-4 mr-2" />
              Projekt-Chat
            </Button>
            <Button variant="outline" onClick={handleCreateTeamRoom}>
              <Users className="h-4 w-4 mr-2" />
              Team-Chat
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ungelesene Nachrichten</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unreadCount}</div>
              <div className="text-xs text-muted-foreground">
                {unreadCount > 0 ? 'Benachrichtigungen verfügbar' : 'Alles gelesen'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online Nutzer</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{onlineUsers}</div>
              <div className="text-xs text-muted-foreground">
                Aktuell verfügbar
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktive Räume</CardTitle>
              <Hash className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeRooms}</div>
              <div className="text-xs text-muted-foreground">
                Aktivität in 24h
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gesamt Räume</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRooms}</div>
              <div className="text-xs text-muted-foreground">
                Alle verfügbaren Chats
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface Tabs */}
        <Tabs defaultValue="chat" className="space-y-4">
          <TabsList className="h-14 p-2 bg-muted/50 rounded-lg">
            <TabsTrigger 
              value="chat" 
              className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              Chat
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              Einstellungen
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="px-6 py-3 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              Aktivität
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <ChatInterface currentUserId="current-user" className="h-[70vh] min-h-[500px] max-h-[800px]" />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Benachrichtigungen
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Nachrichten-Benachrichtigungen</p>
                      <p className="text-sm text-muted-foreground">
                        Erhalten Sie Benachrichtigungen bei neuen Nachrichten
                      </p>
                    </div>
                    <Badge variant="outline">Aktiviert</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">E-Mail-Zusammenfassungen</p>
                      <p className="text-sm text-muted-foreground">
                        Tägliche Zusammenfassung der Chat-Aktivitäten
                      </p>
                    </div>
                    <Badge variant="outline">Aktiviert</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Sound-Benachrichtigungen</p>
                      <p className="text-sm text-muted-foreground">
                        Ton abspielen bei neuen Nachrichten
                      </p>
                    </div>
                    <Badge variant="secondary">Deaktiviert</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Chat-Einstellungen
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Automatisch online anzeigen</p>
                      <p className="text-sm text-muted-foreground">
                        Status automatisch auf online setzen
                      </p>
                    </div>
                    <Badge variant="outline">Aktiviert</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Lesebestätigungen</p>
                      <p className="text-sm text-muted-foreground">
                        Anderen zeigen, wenn Sie Nachrichten gelesen haben
                      </p>
                    </div>
                    <Badge variant="outline">Aktiviert</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Eingabe-Indikatoren</p>
                      <p className="text-sm text-muted-foreground">
                        Zeigen, wenn Sie eine Nachricht schreiben
                      </p>
                    </div>
                    <Badge variant="outline">Aktiviert</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Aktivitätsverlauf
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Heute</span>
                      <span className="font-medium">24 Nachrichten</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Gestern</span>
                      <span className="font-medium">18 Nachrichten</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Diese Woche</span>
                      <span className="font-medium">127 Nachrichten</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Letzter Monat</span>
                      <span className="font-medium">534 Nachrichten</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Top-Räume
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Projekt Alpha</span>
                      <span className="font-medium">67 Nachrichten</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Team Development</span>
                      <span className="font-medium">45 Nachrichten</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Baustelle München</span>
                      <span className="font-medium">32 Nachrichten</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Allgemein</span>
                      <span className="font-medium">23 Nachrichten</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </LayoutWithSidebar>
  );
};

export default ChatWithSidebar;