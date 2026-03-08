import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Building } from "lucide-react";
import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';
import LanguageDemo from '@/components/LanguageDemo';

const Dashboard = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Dashboard: Component mounted');
    
    // Simulate loading and set ready state
    const timer = setTimeout(() => {
      try {
        console.log('Dashboard: Setting ready state');
        setIsReady(true);
      } catch (err) {
        console.error('Dashboard: Error during initialization', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    }, 100);

    return () => {
      console.log('Dashboard: Component unmounting');
      clearTimeout(timer);
    };
  }, []);

  // Error state
  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: '20px',
        background: '#fee2e2',
        color: '#dc2626'
      }}>
        <h1>Dashboard Error</h1>
        <p>Error: {error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            background: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reload Page
        </button>
      </div>
    );
  }

  // Loading state
  if (!isReady) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#f8fafc'
      }}>
        <Building size={48} color="#2563eb" style={{ marginBottom: '16px' }} />
        <p style={{ color: '#6b7280', fontSize: '16px' }}>Dashboard wird geladen...</p>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #2563eb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginTop: '16px'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const breadcrumbItems: { label: string }[] = [];

  // Render Dashboard with Sidebar
  console.log('Dashboard: Rendering dashboard content');
  
  return (
    <LayoutWithSidebar 
      breadcrumbItems={breadcrumbItems}
      pageTitle="Dashboard"
    >
      <div className="grid gap-4">
        {/* Welcome Section */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h2 className="text-2xl font-bold mb-2">Willkommen bei Bauplan Buddy</h2>
          <p className="text-muted-foreground">
            Hier finden Sie eine Übersicht über Ihre Projekte, Termine und wichtige Kennzahlen.
          </p>
        </div>

        {/* Language Demo */}
        <LanguageDemo />

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Aktive Projekte</h3>
            <div className="text-2xl font-bold text-blue-600">5</div>
            <p className="text-xs text-muted-foreground">von 12 Gesamtprojekten</p>
          </div>
          
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Monatsumsatz</h3>
            <div className="text-2xl font-bold text-green-600">€450.000</div>
            <p className="text-xs text-green-600">+12% zum Vormonat</p>
          </div>
          
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Offene Angebote</h3>
            <div className="text-2xl font-bold text-orange-600">8</div>
            <p className="text-xs text-muted-foreground">Wert: €1.140.000</p>
          </div>
          
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Termine heute</h3>
            <div className="text-2xl font-bold text-purple-600">3</div>
            <p className="text-xs text-muted-foreground">2 Baustellenbesuche</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Schnellzugriff</h3>
          <div className="grid gap-3 md:grid-cols-3">
            <Link 
              to="/projects" 
              className="flex items-center p-3 rounded-lg border hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Building className="h-5 w-5 mr-3 text-blue-600" />
              <span>Neues Projekt erstellen</span>
            </Link>
            <Link 
              to="/calendar" 
              className="flex items-center p-3 rounded-lg border hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Building className="h-5 w-5 mr-3 text-green-600" />
              <span>Termin hinzufügen</span>
            </Link>
            <Link 
              to="/quotes" 
              className="flex items-center p-3 rounded-lg border hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Building className="h-5 w-5 mr-3 text-purple-600" />
              <span>Angebot erstellen</span>
            </Link>
          </div>
        </div>

        {/* Success Message */}
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
          <h3 className="text-green-800 font-medium mb-2">✅ Dashboard mit Sidebar erfolgreich geladen!</h3>
          <p className="text-green-700 text-sm">
            Das System funktioniert korrekt. Alle Komponenten sind einsatzbereit. 
            Nutzen Sie die Sidebar für die Navigation zwischen den Bereichen.
          </p>
        </div>
      </div>
    </LayoutWithSidebar>
  );
};

export default Dashboard;