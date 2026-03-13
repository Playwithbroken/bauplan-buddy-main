import { HashRouter, Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

type DesktopUserRole = "ADMIN" | "MANAGER" | "USER" | "GUEST";

interface DesktopUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: DesktopUserRole;
  status: "ACTIVE";
  permissions: string[];
}

declare global {
  interface Window {
    desktop?: {
      checkForUpdates?: () => Promise<unknown>;
      openFileDialog?: (
        filters?: { name: string; extensions: string[] }[],
        properties?: string[],
        title?: string
      ) => Promise<{ canceled?: boolean; filePaths?: string[] }>;
      openExternal?: (url: string) => Promise<unknown>;
    };
  }
}

const STORAGE_KEY = "bauplan_offline_user";

const DEMO_USERS: Array<{ email: string; password: string; role: DesktopUserRole; firstName: string; lastName: string }> = [
  {
    email: "admin@bauplan.de",
    password: "admin123",
    role: "ADMIN",
    firstName: "Admin",
    lastName: "Beta",
  },
  {
    email: "manager@bauplan.de",
    password: "manager123",
    role: "MANAGER",
    firstName: "Projekt",
    lastName: "Leitung",
  },
  {
    email: "user@bauplan.de",
    password: "user123",
    role: "USER",
    firstName: "Team",
    lastName: "Mitglied",
  },
];

function buildOfflineUser(candidate: (typeof DEMO_USERS)[number]): DesktopUser {
  return {
    id: `offline-${candidate.email}`,
    email: candidate.email,
    firstName: candidate.firstName,
    lastName: candidate.lastName,
    name: `${candidate.firstName} ${candidate.lastName}`.trim(),
    role: candidate.role,
    status: "ACTIVE",
    permissions: [],
  };
}

function readStoredUser(): DesktopUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DesktopUser) : null;
  } catch {
    return null;
  }
}

function saveStoredUser(user: DesktopUser | null) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

function DesktopLoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const quickLogin = (candidate: (typeof DEMO_USERS)[number]) => {
    saveStoredUser(buildOfflineUser(candidate));
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-10">
        <div className="mb-10">
          <p className="mb-3 inline-flex rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
            Desktop Beta Safe Boot
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">Bauplan Buddy</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            Der Desktop startet in einem stabilen Beta-Modus, damit die App
            zuverlässig oeffnet, auch wenn die volle Web-Shell auf manchen
            Rechnern noch blockiert.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur">
            <h2 className="text-xl font-semibold">Schnell anmelden</h2>
            <p className="mt-2 text-sm text-slate-300">
              Fuer den Desktop-Beta-Test wird direkt mit lokalen Demo-Konten gearbeitet.
            </p>

            <div className="mt-6 grid gap-3">
              {DEMO_USERS.map((candidate) => (
                <button
                  key={candidate.email}
                  className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-4 text-left transition hover:border-cyan-400/60 hover:bg-slate-900"
                  onClick={() => quickLogin(candidate)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold">{candidate.firstName} {candidate.lastName}</div>
                      <div className="mt-1 text-xs text-slate-400">{candidate.email}</div>
                    </div>
                    <div className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                      {candidate.role}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            ) : null}
          </section>

          <aside className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-6">
            <h2 className="text-xl font-semibold text-amber-100">Aktueller Zustand</h2>
            <ul className="mt-4 space-y-3 text-sm text-amber-50/90">
              <li>Desktop startet ohne die blockierende Web-Shell.</li>
              <li>Datei-Auswahl und Update-Check bleiben direkt im Desktop verfuegbar.</li>
              <li>Lokale Beta-Daten werden getrennt vom Web-Profil gehalten.</li>
            </ul>
            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-xs text-slate-300">
              Wenn der volle Desktop-Stack wieder stabil ist, kann dieser Safe-Boot
              Pfad entfernt werden.
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function DesktopDashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<DesktopUser | null>(() => readStoredUser());
  const [selectedFile, setSelectedFile] = useState("");
  const [status, setStatus] = useState("Desktop Beta bereit.");

  useEffect(() => {
    setUser(readStoredUser());
  }, []);

  const desktopAvailable = useMemo(() => typeof window.desktop !== "undefined", []);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    saveStoredUser(null);
    navigate("/login", { replace: true });
  };

  const handleCheckUpdates = async () => {
    if (!window.desktop?.checkForUpdates) {
      setStatus("Desktop-Updater im aktuellen Build nicht verfuegbar.");
      return;
    }

    setStatus("Suche nach Updates...");
    try {
      await window.desktop.checkForUpdates();
      setStatus("Update-Pruefung wurde gestartet.");
    } catch (error) {
      setStatus(`Update-Pruefung fehlgeschlagen: ${String(error)}`);
    }
  };

  const handlePickPdf = async () => {
    if (!window.desktop?.openFileDialog) {
      setStatus("Dateiauswahl im aktuellen Build nicht verfuegbar.");
      return;
    }

    try {
      const result = await window.desktop.openFileDialog(
        [{ name: "PDF", extensions: ["pdf"] }],
        ["openFile"],
        "PDF fuer Desktop-Test auswaehlen"
      );

      const pickedPath = result?.filePaths?.[0];
      if (pickedPath) {
        setSelectedFile(pickedPath);
        setStatus("PDF erfolgreich ausgewaehlt.");
      } else {
        setStatus("Dateiauswahl abgebrochen.");
      }
    } catch (error) {
      setStatus(`Dateiauswahl fehlgeschlagen: ${String(error)}`);
    }
  };

  const handleOpenRelease = async () => {
    const releaseUrl =
      "https://github.com/Playwithbroken/bauplan-buddy-main/releases";

    if (window.desktop?.openExternal) {
      await window.desktop.openExternal(releaseUrl);
      return;
    }

    window.open(releaseUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_30%),linear-gradient(180deg,_#020617,_#0f172a)] text-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
              Desktop Beta Safe Boot
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Willkommen, {user.firstName}</h1>
            <p className="mt-2 text-sm text-slate-300">
              Stabiler Desktop-Startpfad mit lokalen Beta-Funktionen.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm hover:bg-slate-900"
              onClick={handleOpenRelease}
            >
              Releases
            </button>
            <button
              className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm text-red-100 hover:bg-red-500/20"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        <main className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-white/10 bg-slate-900/50 p-6">
            <h2 className="text-xl font-semibold">Desktop-Funktionen</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <button
                className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition hover:border-cyan-400/60 hover:bg-white/10"
                onClick={handlePickPdf}
              >
                <div className="text-sm font-semibold">PDF auswaehlen</div>
                <div className="mt-2 text-xs text-slate-300">
                  Testet den nativen Datei-Dialog des Desktop-Builds.
                </div>
              </button>

              <button
                className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition hover:border-cyan-400/60 hover:bg-white/10"
                onClick={handleCheckUpdates}
              >
                <div className="text-sm font-semibold">Nach Updates suchen</div>
                <div className="mt-2 text-xs text-slate-300">
                  Testet den nativen Updater-Kanal fuer Beta-Tester.
                </div>
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Status
              </div>
              <div className="mt-2 text-sm text-slate-100">{status}</div>
              <div className="mt-3 text-xs text-slate-400">
                {desktopAvailable ? "Desktop API erkannt." : "Desktop API nicht erkannt."}
              </div>
              {selectedFile ? (
                <div className="mt-3 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
                  {selectedFile}
                </div>
              ) : null}
            </div>
          </section>

          <aside className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Beta-Hinweise</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>Dies ist ein stabiler Desktop-Bootpfad fuer die Beta.</li>
              <li>Lokale Anmeldung erfolgt absichtlich offline-first.</li>
              <li>Weitere Module werden nach dem Startup-Fix wieder schrittweise zugeschaltet.</li>
            </ul>

            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Naechster Schritt
              </div>
              <div className="mt-2 text-sm text-slate-100">
                Sobald dieser Build sauber startet, kann die volle Shell gezielt
                wieder aktiviert werden.
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}

function DesktopRouteGate() {
  return readStoredUser() ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Navigate to="/login" replace />
  );
}

export default function DesktopBootstrapApp() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<DesktopRouteGate />} />
        <Route path="/login" element={<DesktopLoginPage />} />
        <Route path="/dashboard" element={<DesktopDashboardPage />} />
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-slate-950 px-6 py-12 text-slate-50">
              <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/5 p-6">
                <h1 className="text-2xl font-semibold">Desktop Beta</h1>
                <p className="mt-3 text-sm text-slate-300">
                  Diese Route ist im stabilen Desktop-Bootpfad noch nicht aktiv.
                </p>
                <Link
                  to="/dashboard"
                  className="mt-6 inline-flex rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100"
                >
                  Zurueck zum Dashboard
                </Link>
              </div>
            </div>
          }
        />
      </Routes>
    </HashRouter>
  );
}
