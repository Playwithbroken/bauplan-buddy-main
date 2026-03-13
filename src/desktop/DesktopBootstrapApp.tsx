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

const DEMO_USERS: Array<{
  email: string;
  password: string;
  role: DesktopUserRole;
  firstName: string;
  lastName: string;
}> = [
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

interface DesktopBootstrapAppProps {
  onSwitchToNormalMode?: () => void;
}

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

function DesktopLoginPage({ onSwitchToNormalMode }: DesktopBootstrapAppProps) {
  const navigate = useNavigate();
  const [error] = useState("");

  const quickLogin = (candidate: (typeof DEMO_USERS)[number]) => {
    saveStoredUser(buildOfflineUser(candidate));
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-10">
        <div className="mb-10">
          <p className="mb-3 inline-flex rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
            Desktop Recovery
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">Bauplan Buddy</h1>
          {onSwitchToNormalMode ? (
            <button
              className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/20"
              onClick={onSwitchToNormalMode}
            >
              App erneut versuchen
            </button>
          ) : null}
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            Der Desktop ist in einen stabilen Wiederherstellungsmodus gewechselt,
            damit die App weiter benutzbar bleibt, falls der volle Startpfad
            auf diesem Rechner gerade nicht sauber laeuft.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur">
            <h2 className="text-xl font-semibold">Schnell anmelden</h2>
            <p className="mt-2 text-sm text-slate-300">
              Lokale Recovery-Anmeldung fuer Diagnose und Weiterarbeit.
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
                      <div className="text-sm font-semibold">
                        {candidate.firstName} {candidate.lastName}
                      </div>
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
              <li>Die App verwendet gerade einen stabilen Recovery-Startpfad.</li>
              <li>Datei-Auswahl und Update-Check bleiben direkt verfuegbar.</li>
              <li>Lokale Daten bleiben getrennt vom normalen App-Profil.</li>
            </ul>
            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-xs text-slate-300">
              Dieser Modus ist nur ein interner Fallback fuer Desktop-Starts,
              bis der volle App-Pfad stabil genug ist.
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function DesktopDashboardPage({ onSwitchToNormalMode }: DesktopBootstrapAppProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<DesktopUser | null>(() => readStoredUser());
  const [selectedFile, setSelectedFile] = useState("");
  const [status, setStatus] = useState("Desktop Recovery bereit.");

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
              Desktop Recovery
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Willkommen, {user.firstName}</h1>
            <p className="mt-2 text-sm text-slate-300">
              Stabiler Recovery-Startpfad mit nativen Desktop-Funktionen.
            </p>
          </div>
          <div className="flex gap-3">
            {onSwitchToNormalMode ? (
              <button
                className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100 hover:bg-emerald-500/20"
                onClick={onSwitchToNormalMode}
              >
                App erneut versuchen
              </button>
            ) : null}
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
            <h2 className="text-xl font-semibold">Recovery-Hinweise</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>Dies ist ein interner Recovery-Pfad fuer Desktop-Starts.</li>
              <li>Lokale Anmeldung bleibt absichtlich offline-first.</li>
              <li>Der volle App-Pfad kann danach erneut getestet werden.</li>
            </ul>

            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Hinweis
              </div>
              <div className="mt-2 text-sm text-slate-100">
                Dieser Screen sollte nur erscheinen, wenn der normale Desktop-Start
                nicht sauber abgeschlossen wurde.
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

export default function DesktopBootstrapApp({
  onSwitchToNormalMode,
}: DesktopBootstrapAppProps) {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<DesktopRouteGate />} />
        <Route
          path="/login"
          element={<DesktopLoginPage onSwitchToNormalMode={onSwitchToNormalMode} />}
        />
        <Route
          path="/dashboard"
          element={
            <DesktopDashboardPage onSwitchToNormalMode={onSwitchToNormalMode} />
          }
        />
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-slate-950 px-6 py-12 text-slate-50">
              <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/5 p-6">
                <h1 className="text-2xl font-semibold">Desktop Recovery</h1>
                <p className="mt-3 text-sm text-slate-300">
                  Diese Route ist im internen Recovery-Pfad nicht aktiv.
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
