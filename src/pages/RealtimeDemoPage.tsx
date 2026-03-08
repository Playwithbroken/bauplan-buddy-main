/**
 * Real-Time Features Demo Page
 * Showcases all real-time capabilities
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LiveActivityFeed, TeamPresence, LiveNotifications } from '@/components/realtime';
import { FloatingChatButton } from '@/components/realtime/FloatingChatButton';
import { useWebSocket } from '@/hooks/useWebSocket';
import {
  Radio,
  Wifi,
  WifiOff,
  Zap,
  Users,
  MessageSquare,
  Activity,
  Bell,
} from 'lucide-react';

export function RealtimeDemoPage() {
  const [testEventSent, setTestEventSent] = useState(false);
  const { send, isConnected, broadcastPresence } = useWebSocket({
    userId: 'demo-user',
    tenantId: 'demo-tenant',
    autoConnect: false, // Demo page - don't auto-connect
  });

  const sendTestNotification = () => {
    send('notification', {
      type: 'success',
      title: 'Test-Benachrichtigung',
      message: 'Dies ist eine Beispiel-Benachrichtigung aus dem Demo',
    });
    setTestEventSent(true);
    setTimeout(() => setTestEventSent(false), 2000);
  };

  const sendProjectUpdate = () => {
    send('project_updated', {
      projectId: 'demo-project-1',
      projectName: 'Musterprojekt Alpha',
      description: 'Status wurde aktualisiert',
    });
    setTestEventSent(true);
    setTimeout(() => setTestEventSent(false), 2000);
  };

  const sendInvoiceUpdate = () => {
    send('invoice_paid', {
      invoiceId: 'inv-12345',
      invoiceNumber: 'RE-2024-001',
      amount: '5.000,00 €',
    });
    setTestEventSent(true);
    setTimeout(() => setTestEventSent(false), 2000);
  };

  const broadcastOnlineStatus = () => {
    broadcastPresence('online');
    setTestEventSent(true);
    setTimeout(() => setTestEventSent(false), 2000);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Real-Time Features Demo</h1>
        </div>
        <p className="text-muted-foreground">
          Erleben Sie Live-Updates, Team-Präsenz und Echtzeit-Benachrichtigungen
        </p>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" />
            WebSocket Status
          </CardTitle>
          <CardDescription>
            Verbindungsstatus zum Real-Time Server
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {isConnected() ? (
              <>
                <Wifi className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-600">Verbunden</p>
                  <p className="text-sm text-muted-foreground">
                    Echtzeit-Updates aktiv
                  </p>
                </div>
                <Badge variant="outline" className="ml-auto">
                  Online
                </Badge>
              </>
            ) : (
              <>
                <WifiOff className="h-6 w-6 text-red-600" />
                <div>
                  <p className="font-medium text-red-600">Getrennt</p>
                  <p className="text-sm text-muted-foreground">
                    Automatische Wiederverbindung läuft...
                  </p>
                </div>
                <Badge variant="destructive" className="ml-auto">
                  Offline
                </Badge>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Demo Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Benachrichtigungen
          </TabsTrigger>
          <TabsTrigger value="presence">
            <Users className="h-4 w-4 mr-2" />
            Team-Präsenz
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4 mr-2" />
            Aktivitäten
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <Bell className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Live Benachrichtigungen</CardTitle>
                <CardDescription>
                  Echtzeit-Benachrichtigungen für wichtige Ereignisse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={sendTestNotification} className="w-full">
                  Test-Benachrichtigung senden
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>Team-Präsenz</CardTitle>
                <CardDescription>
                  Sehen Sie, wer gerade online ist
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <TeamPresence />
                  <Button
                    onClick={broadcastOnlineStatus}
                    variant="outline"
                    className="w-full mt-2"
                  >
                    Online-Status senden
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MessageSquare className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>Team-Chat</CardTitle>
                <CardDescription>
                  Echtzeit-Messaging zwischen Teammitgliedern
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  Klicken Sie auf den Chat-Button unten rechts
                </p>
                <Badge variant="secondary">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Immer verfügbar
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Test Events */}
          <Card>
            <CardHeader>
              <CardTitle>Test-Events senden</CardTitle>
              <CardDescription>
                Simulieren Sie verschiedene Ereignisse, um Live-Updates zu testen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button onClick={sendTestNotification} variant="outline">
                  Benachrichtigung
                </Button>
                <Button onClick={sendProjectUpdate} variant="outline">
                  Projekt-Update
                </Button>
                <Button onClick={sendInvoiceUpdate} variant="outline">
                  Rechnung bezahlt
                </Button>
                <Button onClick={broadcastOnlineStatus} variant="outline">
                  Online-Status
                </Button>
              </div>
              {testEventSent && (
                <Badge variant="default" className="mt-2">
                  Event gesendet! 🚀
                </Badge>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Live-Benachrichtigungen Testen</CardTitle>
              <CardDescription>
                Benachrichtigungen erscheinen in der Sidebar und als Toast
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Button onClick={sendTestNotification}>
                  Test-Benachrichtigung senden
                </Button>
                <Button onClick={sendProjectUpdate} variant="secondary">
                  Projekt-Update senden
                </Button>
                <Button onClick={sendInvoiceUpdate} variant="secondary">
                  Rechnungs-Update senden
                </Button>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Tipp:</strong> Öffnen Sie die Benachrichtigungen in der
                  Sidebar (Glocken-Symbol), um alle Events zu sehen!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Presence Tab */}
        <TabsContent value="presence">
          <Card>
            <CardHeader>
              <CardTitle>Team-Präsenz</CardTitle>
              <CardDescription>
                Sehen Sie in Echtzeit, welche Teammitglieder online sind
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <TeamPresence />
              </div>
              <Button onClick={broadcastOnlineStatus} className="w-full">
                Online-Status broadcasten
              </Button>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong>Features:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Echtzeit Online/Offline Status</li>
                  <li>Typing Indikatoren</li>
                  <li>Avatar-Anzeige</li>
                  <li>Anzahl online Benutzer</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Feed Tab */}
        <TabsContent value="activity">
          <LiveActivityFeed />
        </TabsContent>
      </Tabs>

      {/* Floating Chat Button */}
      <FloatingChatButton />
    </div>
  );
}

export default RealtimeDemoPage;
