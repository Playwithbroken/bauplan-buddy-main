import { Link, useNavigate } from 'react-router-dom';
import {
  Building,
  Calendar,
  CheckCircle,
  Layers,
  Lightbulb,
  LineChart,
  NotebookPen,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';

const Index = () => {
  const navigate = useNavigate();

  const handleProjectStart = () => {
    navigate('/projects');
  };

  const handleFeatureClick = (path: string) => {
    navigate(path);
  };

  return (
    <LayoutWithSidebar>
      <div className="space-y-12">
        <section className="relative overflow-hidden rounded-3xl border bg-slate-950 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35),_transparent_55%)]" />
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,_rgba(168,85,247,0.25),_transparent_60%)]" />
          <div className="relative z-10 px-8 py-12 lg:px-12 xl:px-16">
            <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl space-y-6">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm font-medium text-blue-200">
                  <Sparkles className="h-4 w-4" /> Willkommen zur neuen Startoberflaeche
                </span>
                <div>
                  <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                    Ihre Projekte. Unser digitaler Bauleiter.
                  </h1>
                  <p className="mt-4 text-lg text-slate-200">
                    Bauplan Buddy orchestriert Ressourcen, Termine und Budgets in einem einzigen modernen Workspace.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    size="lg"
                    className="bg-blue-600 text-white hover:bg-blue-500"
                    onClick={handleProjectStart}
                  >
                    <Building className="mr-2 h-5 w-5" /> Projekt starten
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                    onClick={() => handleFeatureClick('/calendar')}
                  >
                    <Calendar className="mr-2 h-5 w-5" /> Kalender oeffnen
                  </Button>
                </div>
              </div>
              <div className="grid w-full max-w-lg gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur lg:max-w-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-200">Aktive Projekte</p>
                  <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs text-blue-100">+2 diese Woche</span>
                </div>
                <p className="text-4xl font-semibold tracking-tight">12</p>
                <div className="grid grid-cols-2 gap-4 pt-2 text-sm">
                  <div>
                    <p className="text-slate-300">Budget gesichert</p>
                    <p className="text-lg font-semibold text-emerald-300">EUR 3.4M</p>
                  </div>
                  <div>
                    <p className="text-slate-300">Termine heute</p>
                    <p className="text-lg font-semibold text-sky-200">5</p>
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-200">
                  <strong className="font-semibold">Naechter Meilenstein:</strong> Baustellenabnahme Projekt Suedtor, 14:30 Uhr.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-6 text-2xl font-semibold tracking-tight">Was heute wichtig ist</h2>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <button
              type="button"
              onClick={() => handleFeatureClick('/projects')}
              className="group h-full rounded-2xl border bg-card p-6 text-left shadow hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                  <Layers className="h-6 w-6" />
                </div>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Projekte</span>
              </div>
              <h3 className="mt-6 text-xl font-semibold">Portfolio ueberblicken</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Erhalten Sie einen Echtzeitstatus zu Kapazitaeten, Budgets und Risiken Ihrer laufenden Baustellen.
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-blue-600 group-hover:gap-3">
                Projektcockpit oeffnen
                <TrendingUp className="h-4 w-4" />
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleFeatureClick('/calendar')}
              className="group h-full rounded-2xl border bg-card p-6 text-left shadow hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">To-do</span>
              </div>
              <h3 className="mt-6 text-xl font-semibold">Termine abstimmen</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Koordinieren Sie Teams, Gewerke und Lieferanten mit Konfliktdetektion und Live-Verfuegbarkeiten.
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-emerald-600 group-hover:gap-3">
                Kalender ansehen
                <Calendar className="h-4 w-4" />
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleFeatureClick('/analytics')}
              className="group h-full rounded-2xl border bg-card p-6 text-left shadow hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
                  <LineChart className="h-6 w-6" />
                </div>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Analysen</span>
              </div>
              <h3 className="mt-6 text-xl font-semibold">Zahlen verstehen</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Visualisieren Sie Forecasts, Cashflow und Abrechnungen fuer transparent gesteuerte Projekte.
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-purple-600 group-hover:gap-3">
                Reports oeffnen
                <TrendingUp className="h-4 w-4" />
              </span>
            </button>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-6 shadow">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold tracking-tight">Schnelle Aktionen</h2>
            <p className="text-sm text-muted-foreground">
              Starten Sie typische Aufgaben ohne Umwege.
            </p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Button
              variant="secondary"
              className="h-auto justify-start gap-3 rounded-xl bg-slate-100 p-5 text-left hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
              onClick={() => handleFeatureClick('/projects/new')}
            >
              <Building className="h-5 w-5 text-blue-600" />
              <span>
                <span className="block text-base font-semibold">Neues Projekt</span>
                <span className="text-sm text-muted-foreground">Briefing anlegen und Team zuweisen</span>
              </span>
            </Button>
            <Button
              variant="secondary"
              className="h-auto justify-start gap-3 rounded-xl bg-slate-100 p-5 text-left hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
              onClick={() => handleFeatureClick('/quotes')}
            >
              <NotebookPen className="h-5 w-5 text-purple-600" />
              <span>
                <span className="block text-base font-semibold">Angebot erstellen</span>
                <span className="text-sm text-muted-foreground">Kalkulation vorbereiten</span>
              </span>
            </Button>
            <Button
              variant="secondary"
              className="h-auto justify-start gap-3 rounded-xl bg-slate-100 p-5 text-left hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
              onClick={() => handleFeatureClick('/teams')}
            >
              <Users className="h-5 w-5 text-emerald-600" />
              <span>
                <span className="block text-base font-semibold">Team planen</span>
                <span className="text-sm text-muted-foreground">Verfuegbarkeiten und Rollen pruefen</span>
              </span>
            </Button>
            <Button
              variant="secondary"
              className="h-auto justify-start gap-3 rounded-xl bg-slate-100 p-5 text-left hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
              onClick={() => handleFeatureClick('/documents')}
            >
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <span>
                <span className="block text-base font-semibold">Dokumente teilen</span>
                <span className="text-sm text-muted-foreground">Plaene und Protokolle synchronisieren</span>
              </span>
            </Button>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border bg-card p-6 shadow">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold tracking-tight">Projektfahrplan</h2>
              <span className="text-sm text-muted-foreground">Naehe Schritte</span>
            </div>
            <ol className="mt-6 space-y-5 border-l pl-6">
              {[
                {
                  title: 'Kickoff vorbereiten',
                  description: 'Agenda, Stakeholder und Ressourcen fuer Woche 12 abstimmen.',
                  icon: <Users className="h-4 w-4" />,
                },
                {
                  title: 'Vergabe abschliessen',
                  description: 'Lieferantenentscheidung finalisieren und Vertragsentwurf teilen.',
                  icon: <CheckCircle className="h-4 w-4" />,
                },
                {
                  title: 'Baustellenlogistik updaten',
                  description: 'Zeitfenster mit Zulieferern synchronisieren und Zugangsplaene versenden.',
                  icon: <Layers className="h-4 w-4" />,
                },
              ].map((item, index) => (
                <li key={item.title} className="relative">
                  <div className="absolute -left-[33px] flex h-8 w-8 items-center justify-center rounded-full border bg-background text-muted-foreground">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">{index + 1}. {item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-2xl border bg-card p-6 shadow">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold tracking-tight">Performance Snapshot</h2>
              <span className="text-sm text-blue-600">Live</span>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border bg-slate-100 p-4 dark:bg-slate-900">
                <p className="text-xs text-muted-foreground">Termintreue</p>
                <p className="mt-2 text-3xl font-semibold">94%</p>
                <p className="text-xs text-emerald-600">+6% vs. Vorwoche</p>
              </div>
              <div className="rounded-xl border bg-slate-100 p-4 dark:bg-slate-900">
                <p className="text-xs text-muted-foreground">Offene Budgets</p>
                <p className="mt-2 text-3xl font-semibold">EUR 620k</p>
                <p className="text-xs text-muted-foreground">in 4 Projekten</p>
              </div>
              <div className="rounded-xl border bg-slate-100 p-4 dark:bg-slate-900">
                <p className="text-xs text-muted-foreground">Vertragsstatus</p>
                <p className="mt-2 text-xl font-semibold">3 Angebote warten auf Freigabe</p>
              </div>
              <div className="rounded-xl border bg-slate-100 p-4 dark:bg-slate-900">
                <p className="text-xs text-muted-foreground">Team Auslastung</p>
                <p className="mt-2 text-xl font-semibold">72% im Durchschnitt</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="mt-6 w-full"
              onClick={() => handleFeatureClick('/analytics')}
            >
              <LineChart className="mr-2 h-4 w-4" /> Detailanalyse ansehen
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-6 shadow">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Ressourcen fuer einen starken Start</h2>
            <Link to="/docs/getting-started" className="text-sm font-medium text-blue-600 hover:underline">
              Alle Guides ansehen
            </Link>
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <article className="rounded-xl border bg-slate-50 p-5 dark:bg-slate-900">
              <h3 className="text-lg font-semibold">Best Practice Playbook</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Schritt fuer Schritt Anleitungen fuer Ausschreibungen, Planungsmeetings und Abnahmen.
              </p>
              <Link to="/docs/playbook" className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:underline">
                Jetzt lesen
              </Link>
            </article>
            <article className="rounded-xl border bg-slate-50 p-5 dark:bg-slate-900">
              <h3 className="text-lg font-semibold">Workflow Automationen</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Automatisieren Sie Freigaben, Checklisten und Dokumentversand mit wenigen Klicks.
              </p>
              <Link to="/docs/automation" className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:underline">
                Automationen erkunden
              </Link>
            </article>
            <article className="rounded-xl border bg-slate-50 p-5 dark:bg-slate-900">
              <h3 className="text-lg font-semibold">Community Insights</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Erfahren Sie, wie andere Bauunternehmen Bauplan Buddy in ihren Alltag integrieren.
              </p>
              <Link to="/community" className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:underline">
                Erfahrungen ansehen
              </Link>
            </article>
          </div>
        </section>
      </div>
    </LayoutWithSidebar>
  );
};

export default Index;
