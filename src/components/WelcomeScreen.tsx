import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStorage } from '@/hooks/useAppStorage';
import { 
  Database, 
  Download, 
  Settings, 
  Zap,
  Shield,
  Smartphone,
  CheckCircle
} from 'lucide-react';

const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { state, updateSettings } = useAppStorage();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Show welcome screen only on first visit
    const hasVisited = localStorage.getItem('bauplan_buddy_has_visited');
    if (!hasVisited) {
      setShowWelcome(true);
    }
  }, []);

  const handleGetStarted = () => {
    localStorage.setItem('bauplan_buddy_has_visited', 'true');
    updateSettings({ cacheEnabled: true });
    navigate('/dashboard');
  };

  if (!showWelcome) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Willkommen bei Bauplan Buddy</h1>
          <p className="text-lg text-muted-foreground">
            Ihre vollständige Bauverwaltungslösung - Offline-fähig und lokal gespeichert
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-blue-600" />
                <CardTitle>Lokale Speicherung</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Alle Ihre Daten werden sicher in Ihrem Browser gespeichert. 
                Kein Cloud-Zwang, volle Kontrolle über Ihre Daten.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                <CardTitle>Blitzschnell</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Sofortiger Zugriff auf alle Funktionen. Kein Warten auf 
                Server-Antworten - alles läuft direkt im Browser.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-600" />
                <CardTitle>Offline-Fähig</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Arbeiten Sie auch ohne Internetverbindung weiter. 
                Perfekt für Baustellen und unterwegs.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Smartphone className="h-5 w-5 text-purple-600" />
                <CardTitle>Progressive Web App</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Installieren Sie die App auf Ihrem Gerät für ein 
                natives App-Erlebnis - auf Desktop und Mobile.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Was wird lokal gespeichert?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Angebote, Projekte und Auftragsbestätigungen</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Rechnungen (Eingang & Ausgang) und Lieferscheine</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Termine, Kunden und Lieferanten</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Dokumente, Teams und Einstellungen</span>
              </div>
              <div className="flex items-center space-x-2">
                <Download className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Export/Import-Funktion für Backups</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-muted/50 p-6 rounded-lg mb-8">
          <div className="flex items-start space-x-3">
            <Settings className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-2">Hinweis zur Datensicherheit</p>
              <p className="text-muted-foreground">
                Ihre Daten bleiben ausschließlich auf Ihrem Gerät. Erstellen Sie regelmäßig Backups 
                über die Exportfunktion in den Einstellungen. Bei einem Browserwechsel oder Gerätetausch 
                können Sie Ihre Daten einfach importieren.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Button 
            onClick={handleGetStarted}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            Jetzt starten
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
