import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AppConfigProvider } from "./contexts/AppConfigContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/query-client";
import "./index.css";
import "./styles/fonts.css";
import "./styles/micro-interactions.css";
import "./styles/fonts.css";
import "./styles/micro-interactions.css";
import { offlineSync } from "./services/offlineSyncService";
import { ErrorHandlingService } from "./services/errorHandlingService";
import { isProduction } from "@/utils/env";
import designSystemService from "./services/designSystemService";

const isDesktopFileRuntime =
  typeof window !== "undefined" && window.location.protocol === "file:";

// Initialize offline services with better error handling
try {
  if (isProduction()) {
    console.log("main.tsx: Starting offline service initialization...");
    offlineSync.syncNow();
    console.log("main.tsx: Offline service initialized successfully");
  } else {
    console.log("main.tsx: Skipping offline service in development");
    // Ensure no old service worker controls dev (prevents corrupted module cache)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .then(() =>
          caches?.keys ? caches.keys() : Promise.resolve<string[]>([])
        )
        .then((keys: readonly string[]) =>
          Promise.all((keys || []).map((k) => caches.delete(k)))
        )
        .catch((e) => console.warn("main.tsx: SW cleanup failed (dev):", e));
    }
  }
} catch (error) {
  console.error("main.tsx: Failed to initialize offline service:", error);
  // Continue anyway - don't block app loading
}

// Initialize design system (branding, density, theming)
try {
  designSystemService.initialize();
  console.log("main.tsx: Design system initialized");
} catch (error) {
  console.error("main.tsx: Design system initialization failed:", error);
}

// Global error handler for unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  console.error("main.tsx: Unhandled promise rejection:", event.reason);
  // Don't prevent default to allow normal error handling
});

// Global error handler for JavaScript errors
window.addEventListener("error", (event) => {
  console.error("main.tsx: Global error caught:", event.error);
  // Continue execution
});

// Network connectivity check
let isOnline = navigator.onLine;
window.addEventListener("online", () => {
  console.log("main.tsx: Network connection restored");
  isOnline = true;
});
window.addEventListener("offline", () => {
  console.log("main.tsx: Network connection lost");
  isOnline = false;
});

// Hide loading screen once React app starts mounting
document.body.classList.add("app-ready");
const loadingScreen = document.getElementById("loading-screen");
if (loadingScreen) {
  loadingScreen.style.display = "none";
}
console.log("main.tsx: Loading screen hidden, app ready");

// Single fallback timeout to ensure loading screen is removed
setTimeout(() => {
  const loadingElement = document.getElementById("loading-screen");
  if (loadingElement) {
    loadingElement.style.display = "none";
    loadingElement.style.visibility = "hidden";
    loadingElement.style.opacity = "0";
  }
}, 500);

// EMERGENCY: If React doesn't fully load within 3 seconds, show enhanced emergency dashboard
if (!isDesktopFileRuntime) {
  setTimeout(() => {
  const rootElement = document.getElementById("root");
  if (
    rootElement &&
    (rootElement.innerHTML.includes("Lädt React App") ||
      rootElement.innerHTML.trim() === "")
  ) {
    console.warn(
      "main.tsx: EMERGENCY - React loading taking too long, showing emergency dashboard"
    );

    // Try to load cached data from localStorage
    let cachedData = { projects: 0, invoices: 0, customers: 0, tasks: 0 };
    try {
      const appState = localStorage.getItem("app-storage");
      if (appState) {
        const parsed = JSON.parse(appState);
        cachedData = {
          projects: parsed.projects?.length || 0,
          invoices: parsed.invoices?.length || 0,
          customers: parsed.customers?.length || 0,
          tasks: parsed.tasks?.length || 0,
        };
      }
    } catch (e) {
      console.warn("Could not load cached data:", e);
    }

    const timestamp = new Date().toLocaleString("de-DE");
    const isOffline = !navigator.onLine;

    rootElement.innerHTML = `
      <div style="
        min-height: 100vh;
        background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <!-- Enhanced Header with Emergency Badge -->
        <header style="
          background: white;
          border-bottom: 2px solid #f59e0b;
          padding: 16px 24px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        ">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="
                width: 48px;
                height: 48px;
                background: linear-gradient(135deg, #f59e0b, #fbbf24);
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 20px;
                animation: pulse 2s infinite;
              ">⚡</div>
              <div>
                <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #1e293b;">Bauplan Buddy - Notfallmodus</h1>
                <p style="margin: 0; font-size: 13px; color: #64748b;">Emergency Dashboard • ${timestamp}</p>
              </div>
            </div>
            <div style="
              background: #fef3c7;
              border: 2px solid #f59e0b;
              border-radius: 8px;
              padding: 8px 16px;
              font-size: 14px;
              font-weight: 600;
              color: #92400e;
            ">
              ⚠️ ${isOffline ? "OFFLINE-MODUS" : "NOTFALLMODUS"}
            </div>
          </div>
        </header>
        
        <!-- Main Content -->
        <main style="padding: 24px;">
          <!-- Alert Banner -->
          <div style="
            max-width: 1400px;
            margin: 0 auto 24px;
            background: linear-gradient(135deg, #fee2e2, #fecaca);
            border: 2px solid #ef4444;
            border-radius: 12px;
            padding: 20px;
            color: #991b1b;
          ">
            <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 24px;">🚨</span>
              React-Anwendung konnte nicht geladen werden
            </h3>
            <p style="margin: 0 0 16px 0; line-height: 1.6;">
              Die Hauptanwendung antwortet nicht oder benötigt zu lange zum Laden. 
              Dieser Notfall-Dashboard bietet eingeschränkte Funktionalität und Zugriff auf wichtige Daten.
            </p>
            <div style="display: flex; flex-wrap: wrap; gap: 12px;">
              <button onclick="window.location.reload()" style="
                background: #ef4444;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                transition: all 0.2s;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              " onmouseover="this.style.background='#dc2626'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)'" onmouseout="this.style.background='#ef4444'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'">
                🔄 Seite neu laden
              </button>
              <button onclick="window.open(window.location.origin + '/', '_blank')" style="
                background: #2563eb;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                transition: all 0.2s;
              " onmouseover="this.style.background='#1d4ed8'" onmouseout="this.style.background='#2563eb'">
                🌐 Neues Fenster öffnen
              </button>
              <button onclick="console.clear()" style="
                background: #6b7280;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
              ">
                🧹 Konsole leeren
              </button>
            </div>
          </div>

          <!-- Stats Dashboard -->
          <div style="
            max-width: 1400px;
            margin: 0 auto 24px;
          ">
            <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #1e293b;">📊 Datenspeicher-Übersicht</h2>
            <div style="
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
              gap: 16px;
            ">
              <!-- Projects Stat -->
              <div style="
                background: linear-gradient(135deg, #dbeafe, #bfdbfe);
                border-radius: 12px;
                padding: 20px;
                border: 2px solid #3b82f6;
                box-shadow: 0 2px 8px rgba(59,130,246,0.2);
              ">
                <div style="font-size: 14px; color: #1e3a8a; font-weight: 600; margin-bottom: 8px;">📋 Projekte</div>
                <div style="font-size: 36px; font-weight: 800; color: #1e40af; margin-bottom: 4px;">${
                  cachedData.projects
                }</div>
                <div style="font-size: 12px; color: #1e3a8a;">Im LocalStorage</div>
              </div>
              
              <!-- Invoices Stat -->
              <div style="
                background: linear-gradient(135deg, #dcfce7, #bbf7d0);
                border-radius: 12px;
                padding: 20px;
                border: 2px solid #10b981;
                box-shadow: 0 2px 8px rgba(16,185,129,0.2);
              ">
                <div style="font-size: 14px; color: #065f46; font-weight: 600; margin-bottom: 8px;">💰 Rechnungen</div>
                <div style="font-size: 36px; font-weight: 800; color: #047857; margin-bottom: 4px;">${
                  cachedData.invoices
                }</div>
                <div style="font-size: 12px; color: #065f46;">Im LocalStorage</div>
              </div>
              
              <!-- Customers Stat -->
              <div style="
                background: linear-gradient(135deg, #fce7f3, #fbcfe8);
                border-radius: 12px;
                padding: 20px;
                border: 2px solid #ec4899;
                box-shadow: 0 2px 8px rgba(236,72,153,0.2);
              ">
                <div style="font-size: 14px; color: #831843; font-weight: 600; margin-bottom: 8px;">👥 Kunden</div>
                <div style="font-size: 36px; font-weight: 800; color: #9f1239; margin-bottom: 4px;">${
                  cachedData.customers
                }</div>
                <div style="font-size: 12px; color: #831843;">Im LocalStorage</div>
              </div>
              
              <!-- Tasks Stat -->
              <div style="
                background: linear-gradient(135deg, #fef3c7, #fde68a);
                border-radius: 12px;
                padding: 20px;
                border: 2px solid #f59e0b;
                box-shadow: 0 2px 8px rgba(245,158,11,0.2);
              ">
                <div style="font-size: 14px; color: #78350f; font-weight: 600; margin-bottom: 8px;">✅ Aufgaben</div>
                <div style="font-size: 36px; font-weight: 800; color: #92400e; margin-bottom: 4px;">${
                  cachedData.tasks
                }</div>
                <div style="font-size: 12px; color: #78350f;">Im LocalStorage</div>
              </div>
            </div>
          </div>

          <div style="
            max-width: 1400px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 20px;
          ">
            <!-- System Status Card -->
            <div style="
              background: white;
              border-radius: 12px;
              padding: 24px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              border: 2px solid #e2e8f0;
            ">
              <h2 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 8px;">
                <span>📊</span> System Status
              </h2>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f8fafc; border-radius: 6px;">
                  <span style="color: #475569; font-weight: 500;">🌐 Netzwerk:</span>
                  <span style="color: ${
                    isOffline ? "#ef4444" : "#10b981"
                  }; font-weight: 700;">${
      isOffline ? "❌ Offline" : "✅ Online"
    }</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f8fafc; border-radius: 6px;">
                  <span style="color: #475569; font-weight: 500;">⚛️ React App:</span>
                  <span style="color: #ef4444; font-weight: 700;">❌ Fehler</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f8fafc; border-radius: 6px;">
                  <span style="color: #475569; font-weight: 500;">⚡ Notfallmodus:</span>
                  <span style="color: #f59e0b; font-weight: 700;">✅ Aktiv</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f8fafc; border-radius: 6px;">
                  <span style="color: #475569; font-weight: 500;">💾 LocalStorage:</span>
                  <span style="color: #10b981; font-weight: 700;">${
                    cachedData.projects > 0 ? "✅ Verfügbar" : "⚠️ Leer"
                  }</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f8fafc; border-radius: 6px;">
                  <span style="color: #475569; font-weight: 500;">📅 Version:</span>
                  <span style="color: #64748b; font-weight: 600;">Emergency v2.0</span>
                </div>
              </div>
            </div>
            
            <!-- Quick Actions Card -->
            <div style="
              background: white;
              border-radius: 12px;
              padding: 24px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              border: 2px solid #e2e8f0;
            ">
              <h2 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 8px;">
                <span>🚀</span> Schnellaktionen
              </h2>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <button onclick="window.location.reload()" style="
                  background: linear-gradient(135deg, #2563eb, #3b82f6);
                  color: white;
                  border: none;
                  padding: 14px 18px;
                  border-radius: 8px;
                  cursor: pointer;
                  font-size: 14px;
                  font-weight: 600;
                  transition: all 0.2s;
                  box-shadow: 0 2px 4px rgba(37,99,235,0.3);
                  text-align: left;
                  display: flex;
                  align-items: center;
                  gap: 10px;
                " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(37,99,235,0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(37,99,235,0.3)'">
                  <span style="font-size: 18px;">🔄</span>
                  <div>
                    <div>App neu laden</div>
                    <div style="font-size: 11px; opacity: 0.9;">Vollständigen Neustart versuchen</div>
                  </div>
                </button>
                
                <button onclick="localStorage.clear(); alert('LocalStorage geleert! Seite wird neu geladen...'); window.location.reload();" style="
                  background: linear-gradient(135deg, #ef4444, #f87171);
                  color: white;
                  border: none;
                  padding: 14px 18px;
                  border-radius: 8px;
                  cursor: pointer;
                  font-size: 14px;
                  font-weight: 600;
                  transition: all 0.2s;
                  text-align: left;
                  display: flex;
                  align-items: center;
                  gap: 10px;
                " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                  <span style="font-size: 18px;">🧹</span>
                  <div>
                    <div>Cache leeren & Neustarten</div>
                    <div style="font-size: 11px; opacity: 0.9;">LocalStorage zurücksetzen</div>
                  </div>
                </button>
                
                <button onclick="window.open(window.location.origin + '/', '_blank')" style="
                  background: linear-gradient(135deg, #10b981, #34d399);
                  color: white;
                  border: none;
                  padding: 14px 18px;
                  border-radius: 8px;
                  cursor: pointer;
                  font-size: 14px;
                  font-weight: 600;
                  transition: all 0.2s;
                  text-align: left;
                  display: flex;
                  align-items: center;
                  gap: 10px;
                " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                  <span style="font-size: 18px;">🌐</span>
                  <div>
                    <div>Neues Fenster öffnen</div>
                    <div style="font-size: 11px; opacity: 0.9;">Frische App-Instanz starten</div>
                  </div>
                </button>
                
                <button onclick="if(confirm('Entwicklerkonsole öffnen?')) { console.log('%c🔧 EMERGENCY DASHBOARD DEBUG INFO', 'font-size: 16px; font-weight: bold; color: #f59e0b;'); console.log('Cached Data:', ${JSON.stringify(
                  cachedData
                )}); console.log('Online:', ${!isOffline}); console.log('Timestamp:', '${timestamp}'); }" style="
                  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
                  color: white;
                  border: none;
                  padding: 14px 18px;
                  border-radius: 8px;
                  cursor: pointer;
                  font-size: 14px;
                  font-weight: 600;
                  transition: all 0.2s;
                  text-align: left;
                  display: flex;
                  align-items: center;
                  gap: 10px;
                " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                  <span style="font-size: 18px;">🔍</span>
                  <div>
                    <div>Debug-Informationen</div>
                    <div style="font-size: 11px; opacity: 0.9;">In Konsole ausgeben (F12)</div>
                  </div>
                </button>
              </div>
            </div>
            
            <!-- Help & Resources Card -->
            <div style="
              background: white;
              border-radius: 12px;
              padding: 24px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              border: 2px solid #e2e8f0;
            ">
              <h2 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 8px;">
                <span>💡</span> Fehlerbehebung
              </h2>
              <div style="
                background: #fef3c7;
                border-left: 4px solid #f59e0b;
                border-radius: 6px;
                padding: 16px;
                margin-bottom: 16px;
              ">
                <div style="font-weight: 700; color: #92400e; margin-bottom: 12px;">🔧 Empfohlene Schritte:</div>
                <ol style="margin: 0; padding-left: 20px; color: #78350f; line-height: 1.8;">
                  <li>Seite neu laden (F5 oder Strg+R)</li>
                  <li>Browser-Cache leeren (Strg+Shift+Delete)</li>
                  <li>Entwicklerkonsole prüfen (F12)</li>
                  <li>Browser neu starten</li>
                  <li>Neues Browserfenster/-tab öffnen</li>
                </ol>
              </div>
              <div style="
                background: #e0e7ff;
                border-left: 4px solid #6366f1;
                border-radius: 6px;
                padding: 16px;
              ">
                <div style="font-weight: 700; color: #3730a3; margin-bottom: 8px;">ℹ️ Technische Details:</div>
                <div style="font-size: 12px; color: #4338ca; line-height: 1.6;">
                  <div><strong>Zeitstempel:</strong> ${timestamp}</div>
                  <div><strong>Browser:</strong> ${navigator.userAgent
                    .split(" ")
                    .slice(-2)
                    .join(" ")}</div>
                  <div><strong>LocalStorage:</strong> ${
                    cachedData.projects +
                    cachedData.invoices +
                    cachedData.customers +
                    cachedData.tasks
                  } Einträge</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Features/Modules Overview -->
          <div style="
            max-width: 1400px;
            margin: 24px auto 0;
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            border: 2px solid #e2e8f0;
          ">
            <h2 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 8px;">
              <span>🛠️</span> Verfügbare Module (nach Neustart)
            </h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
              <div style="padding: 12px; background: #f1f5f9; border-radius: 8px; text-align: center; font-weight: 500; color: #475569;">
                📅 Terminplanung
              </div>
              <div style="padding: 12px; background: #f1f5f9; border-radius: 8px; text-align: center; font-weight: 500; color: #475569;">
                📋 Projektmanagement
              </div>
              <div style="padding: 12px; background: #f1f5f9; border-radius: 8px; text-align: center; font-weight: 500; color: #475569;">
                📄 Dokumentenverwaltung
              </div>
              <div style="padding: 12px; background: #f1f5f9; border-radius: 8px; text-align: center; font-weight: 500; color: #475569;">
                💰 Rechnungswesen
              </div>
              <div style="padding: 12px; background: #f1f5f9; border-radius: 8px; text-align: center; font-weight: 500; color: #475569;">
                👥 Teamverwaltung
              </div>
              <div style="padding: 12px; background: #f1f5f9; border-radius: 8px; text-align: center; font-weight: 500; color: #475569;">
                📊 Analytics & Reports
              </div>
              <div style="padding: 12px; background: #f1f5f9; border-radius: 8px; text-align: center; font-weight: 500; color: #475569;">
                🚚 Lieferscheine
              </div>
              <div style="padding: 12px; background: #f1f5f9; border-radius: 8px; text-align: center; font-weight: 500; color: #475569;">
                📦 Auftragsbestätigungen
              </div>
            </div>
          </div>
        </main>
        
        <!-- CSS Animations -->
        <style>
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
          }
        </style>
      </div>
    `;
  }
  }, 3000);
}

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }

  console.log("main.tsx: Creating React root and rendering Bauplan Buddy App");
  const root = createRoot(rootElement);

  // IMMEDIATE: Clear any fallback content
  rootElement.innerHTML = "";

  root.render(
    <QueryClientProvider client={queryClient}>
      <AppConfigProvider>
        <App />
      </AppConfigProvider>
    </QueryClientProvider>
  );

  console.log("main.tsx: Bauplan Buddy app rendered successfully");

  // ENSURE: Loading screen is definitely hidden after React renders
  setTimeout(() => {
    document.body.classList.add("app-ready");
    const loadingScreen = document.getElementById("loading-screen");
    if (loadingScreen) {
      loadingScreen.style.display = "none";
      loadingScreen.style.visibility = "hidden";
      loadingScreen.style.opacity = "0";
    }
  }, 100);
} catch (error) {
  console.error("main.tsx: Error rendering Bauplan Buddy app:", error);

  // Fallback error display
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        padding: 20px;
        background: #fee2e2;
        color: #dc2626;
        font-family: system-ui, -apple-system, sans-serif;
      ">
        <h1>Bauplan Buddy - Fehler beim Laden</h1>
        <p>Fehler: ${
          error instanceof Error ? error.message : "Unbekannter Fehler"
        }</p>
        <div style="margin: 16px 0; padding: 12px; background: white; border-radius: 6px; color: #374151;">
          <p style="margin: 0; font-size: 14px;">Hinweis: React funktioniert korrekt. Das Problem liegt bei komplexen App-Komponenten.</p>
        </div>
        <button 
          onclick="window.location.reload()"
          style="
            padding: 10px 20px;
            background: #dc2626;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 16px;
          "
        >
          Seite neu laden
        </button>
      </div>
    `;
  }
}
