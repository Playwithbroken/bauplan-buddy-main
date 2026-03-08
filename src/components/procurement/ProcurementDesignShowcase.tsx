import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronRight,
  Filter,
  LineChart,
  Menu,
  MoonStar,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  TableProperties,
  Users,
} from 'lucide-react';
import clsx from 'clsx';

type ThemeMode = 'light' | 'dark';
type ViewMode = 'dashboard' | 'projects' | 'suppliers';

interface Metric {
  id: string;
  label: string;
  value: string;
  change: string;
  direction: 'up' | 'down' | 'flat';
}

const METRICS: Record<ViewMode, Metric[]> = {
  dashboard: [
    { id: 'budget', label: 'Budget Utilization', value: '68.4%', change: '+5.2%', direction: 'up' },
    { id: 'savings', label: 'Cost Savings (MTD)', value: '€18,450', change: '+€1,240', direction: 'up' },
    { id: 'lead-time', label: 'Avg. Lead Time', value: '6.8 days', change: '-0.4d', direction: 'down' },
    { id: 'compliance', label: 'Compliance Score', value: '92%', change: '+1.5%', direction: 'up' },
  ],
  projects: [
    { id: 'active', label: 'Active Projects', value: '14', change: '+2', direction: 'up' },
    { id: 'at-risk', label: 'At-Risk Budgets', value: '3', change: '+1', direction: 'up' },
    { id: 'forecast', label: 'Forecast Accuracy', value: '96%', change: '+3%', direction: 'up' },
    { id: 'cycle', label: 'Cycle Time', value: '12.5 days', change: '-1.1d', direction: 'down' },
  ],
  suppliers: [
    { id: 'suppliers', label: 'Active Suppliers', value: '28', change: '+3', direction: 'up' },
    { id: 'on-time', label: 'On-Time Delivery', value: '94%', change: '+2%', direction: 'up' },
    { id: 'quality', label: 'Quality Score', value: '4.7 / 5', change: '+0.2', direction: 'up' },
    { id: 'savings-supplier', label: 'Supplier Savings', value: '€28,900', change: '+€4,500', direction: 'up' },
  ],
};

const KPI_COLORS: Record<Metric['direction'], string> = {
  up: 'text-emerald-500',
  down: 'text-red-500',
  flat: 'text-muted-foreground',
};

const TAB_BAR: { id: ViewMode; label: string; description: string }[] = [
  { id: 'dashboard', label: 'Overview', description: 'Executive KPIs and alerts' },
  { id: 'projects', label: 'Projects', description: 'Budget status by cost center' },
  { id: 'suppliers', label: 'Suppliers', description: 'Performance & compliance' },
];

const TRANSACTIONS = [
  { id: 'TRX-2048', type: 'Purchase Order', project: 'HQ Renovation', amount: '€24,800', status: 'Approved', timestamp: '12m ago' },
  { id: 'TRX-2049', type: 'Invoice', project: 'IT Refresh 2025', amount: '€12,640', status: 'Pending Review', timestamp: '32m ago' },
  { id: 'TRX-2050', type: 'Receipt', project: 'Logistics Upgrade', amount: '€6,950', status: 'In Transit', timestamp: '1h ago' },
  { id: 'TRX-2051', type: 'Budget Adjustment', project: 'Sustainability', amount: '€18,000', status: 'Draft', timestamp: '2h ago' },
];

const PROJECTS = [
  { id: 'PRJ-001', name: 'HQ Renovation', owner: 'Sophia Klein', progress: 84, budget: '€280k', status: 'On Track' },
  { id: 'PRJ-002', name: 'IT Refresh 2025', owner: 'David Weber', progress: 56, budget: '€420k', status: 'At Risk' },
  { id: 'PRJ-003', name: 'Logistics Upgrade', owner: 'Helena Vogt', progress: 32, budget: '€190k', status: 'Critical' },
];

const SUPPLIER_ALERTS = [
  { id: 'SUP-001', supplier: 'Nordic Metals', issue: 'Lead time trending up 12%', severity: 'warning' },
  { id: 'SUP-002', supplier: 'EcoBuild GmbH', issue: 'Contract renewal in 14 days', severity: 'info' },
  { id: 'SUP-003', supplier: 'Prime Logistics', issue: 'Quality score dropped to 4.1', severity: 'critical' },
];

const SEVERITY_STYLES: Record<string, string> = {
  info: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  critical: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
};

const SKELETON_ROWS = Array.from({ length: 5 }, (_, index) => index);

/**
 * ProcurementDesignShowcase
 * Demonstrates the proposed procurement experience shell, highlighting navigation,
 * dashboards, responsive layout behavior and core UI primitives requested in the brief.
 */
export function ProcurementDesignShowcase() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [activeView, setActiveView] = useState<ViewMode>('dashboard');
  const [theme, setTheme] = useState<ThemeMode>('light');
  const metrics = useMemo(() => METRICS[activeView], [activeView]);

  return (
    <div className={clsx(theme === 'dark' && 'dark')}>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
        <header className="border-b border-border bg-card/70 backdrop-blur">
          <div className="mx-auto max-w-[1440px] px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen((prev) => !prev)}
                  className="flex h-10 w-10 items-center justify-center rounded-md border border-transparent bg-primary/5 text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
                  aria-label="Toggle navigation"
                >
                  <Menu className="size-5" />
                </button>
                <div>
                  <p className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Bauplan Buddy
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      Procurement Suite
                    </span>
                  </p>
                  <h1 className="text-xl font-semibold leading-tight sm:text-2xl">
                    Spend Intelligence & Budget Control
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
                  className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {theme === 'light' ? (
                    <>
                      <MoonStar className="size-4" /> Dark
                    </>
                  ) : (
                    <>
                      <Sun className="size-4" /> Light
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="relative flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card transition hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Bell className="size-4" aria-hidden="true" />
                  <span className="absolute right-2 top-1 inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="sr-only">Open notifications</span>
                </button>
                <button
                  type="button"
                  className="hidden items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary md:flex"
                >
                  <ShieldCheck className="size-4" />
                  Create Order
                </button>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-4 lg:mt-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-sm transition focus-within:ring-2 focus-within:ring-primary">
                <Search className="size-4 text-muted-foreground" aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Search projects, suppliers, documents..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Filter className="size-3.5" />
                  Filters
                </button>
              </div>
              <div className="grid flex-none grid-cols-2 gap-2 text-xs text-muted-foreground sm:flex sm:items-center sm:gap-4">
                <span>Annual Budget: <strong className="text-foreground">€3.5M</strong></span>
                <span>Current Phase: <strong className="text-foreground">Phase 2</strong></span>
                <span>Compliance: <strong className="text-emerald-500">92%</strong></span>
                <span>Alerts: <strong className="text-amber-500">3 open</strong></span>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-6 px-6 pb-24 pt-6 lg:pt-8 xl:flex-row">
          <aside
            className={clsx(
              'fixed inset-x-0 top-[72px] z-20 border-b border-border bg-card px-6 py-4 shadow-sm transition-all lg:sticky lg:top-24 lg:h-fit lg:w-64 lg:rounded-xl lg:border lg:px-4 lg:py-6 lg:shadow-none',
              isMobileNavOpen ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0 lg:translate-y-0 lg:opacity-100',
            )}
            aria-label="Primary navigation"
          >
            <nav className="space-y-4 text-sm font-medium">
              <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Workspace</div>
              <button
                type="button"
                onClick={() => setActiveView('dashboard')}
                className={clsx(
                  'flex w-full items-center justify-between rounded-lg px-3 py-2 transition hover:bg-muted',
                  activeView === 'dashboard' ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
                )}
              >
                <span className="flex items-center gap-2">
                  <LineChart className="size-4" />
                  Executive Overview
                </span>
                <ChevronRight className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setActiveView('projects')}
                className={clsx(
                  'flex w-full items-center justify-between rounded-lg px-3 py-2 transition hover:bg-muted',
                  activeView === 'projects' ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
                )}
              >
                <span className="flex items-center gap-2">
                  <TableProperties className="size-4" />
                  Project Budgets
                </span>
                <ChevronRight className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setActiveView('suppliers')}
                className={clsx(
                  'flex w-full items-center justify-between rounded-lg px-3 py-2 transition hover:bg-muted',
                  activeView === 'suppliers' ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
                )}
              >
                <span className="flex items-center gap-2">
                  <Users className="size-4" />
                  Supplier Network
                </span>
                <ChevronRight className="size-4" />
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-muted-foreground transition hover:bg-muted"
              >
                <Settings className="size-4" />
                <span>Configuration</span>
              </button>
            </nav>
            <div className="mt-6 rounded-lg border border-dashed border-primary/50 bg-primary/5 p-4 text-xs text-muted-foreground">
              <p className="mb-2 font-semibold text-foreground">Real-time Procurement Health</p>
              <p>Connect ERP sources to unlock live budget feeds, alerts, and scenario planning.</p>
            </div>
          </aside>

          <main className="flex-1 space-y-6">
            <section className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold sm:text-xl">Experience Overview</h2>
                <p className="text-sm text-muted-foreground">
                  Responsive procurement cockpit with at-a-glance KPIs, predictive insights, and actionable workflows.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                >
                  Download Case Study
                  <ArrowUpRight className="size-4" />
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Share with Team
                </button>
                <button
                  type="button"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  View Design Tokens
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Context-Aware Metrics</h3>
                  <p className="text-sm text-muted-foreground">
                    Tailored KPI stack aligns to the current workspace selection to keep decision-making focused.
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <LineChart className="size-3.5" />
                    Predictive Insights
                  </span>
                  <span className="flex items-center gap-1">
                    <BarChart3 className="size-3.5" />
                    Budget Guardrails
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => (
                  <article
                    key={metric.id}
                    className="group flex flex-col justify-between rounded-xl border border-border bg-gradient-to-br from-card to-card/60 p-4 shadow-sm transition hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        {metric.label}
                      </p>
                      <span
                        className={clsx(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                          KPI_COLORS[metric.direction],
                        )}
                      >
                        {metric.change}
                        <ArrowUpRight className={clsx('size-3', metric.direction === 'down' && 'rotate-180')} />
                      </span>
                    </div>
                    <p className="mt-5 text-3xl font-semibold tracking-tight">{metric.value}</p>
                    <div className="mt-4 h-2 rounded-full bg-muted/80">
                      <span className="block h-2 w-3/4 rounded-full bg-primary transition-all duration-500 group-hover:w-[85%]" />
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
                <div className="rounded-xl border border-border bg-muted/30 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h4 className="text-base font-semibold">Adaptive Spend Flow</h4>
                      <p className="text-sm text-muted-foreground">
                        Week-over-week spend split across CAPEX vs OPEX with quick anomaly detection.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      Export
                    </button>
                  </div>
                  <div className="mt-5 h-48 rounded-lg border border-dashed border-border bg-gradient-to-tr from-primary/5 via-transparent to-primary/10">
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      <LineChart className="mr-2 size-4" />
                      Insert Recharts LineChart
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="size-5 text-amber-500" />
                      <div>
                        <p className="font-medium">Budget Guardrail triggered</p>
                        <p className="text-xs text-muted-foreground">Sustainability program at 87% of quarterly allocation.</p>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        className="flex-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                      >
                        Review Budget
                      </button>
                      <button
                        type="button"
                        className="flex-1 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        Snooze
                      </button>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
                    <p className="flex items-center gap-2 font-semibold text-foreground">
                      <CheckCircle2 className="size-4 text-emerald-500" />
                      Interaction Design Notes
                    </p>
                    <ul className="mt-3 space-y-2">
                      <li>• Hover micro-interactions reinforce key metrics without overwhelming animation.</li>
                      <li>• CTA hierarchy uses primary color exclusively for the most important action per surface.</li>
                      <li>• Error, warning, and success states leverage semantic palette tokens for consistency.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Project Portfolio Snapshot</h3>
                  <p className="text-sm text-muted-foreground">Card pattern scales across desktop and mobile, surfacing status, owners, and budget health.</p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Create Project
                </button>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {PROJECTS.map((project) => (
                  <article key={project.id} className="space-y-4 rounded-xl border border-border bg-muted/30 p-5">
                    <header className="flex items-center justify-between">
                      <div>
                        <h4 className="text-base font-semibold">{project.name}</h4>
                        <p className="text-xs text-muted-foreground">Owner: {project.owner}</p>
                      </div>
                      <span
                        className={clsx(
                          'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
                          project.status === 'On Track' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
                          project.status === 'At Risk' && 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
                          project.status === 'Critical' && 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
                        )}
                      >
                        {project.status}
                      </span>
                    </header>
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Budget Use</span>
                        <span className="font-semibold text-foreground">{project.progress}%</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-muted">
                        <span
                          aria-hidden="true"
                          className={clsx(
                            'block h-2 rounded-full transition-all duration-500',
                            project.status === 'On Track' && 'bg-emerald-500',
                            project.status === 'At Risk' && 'bg-amber-500',
                            project.status === 'Critical' && 'bg-rose-500',
                          )}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                    <dl className="flex gap-4 text-xs text-muted-foreground">
                      <div>
                        <dt className="uppercase tracking-[0.2em]">Reference</dt>
                        <dd className="font-semibold text-foreground">{project.id}</dd>
                      </div>
                      <div>
                        <dt className="uppercase tracking-[0.2em]">Budget</dt>
                        <dd className="font-semibold text-foreground">{project.budget}</dd>
                      </div>
                    </dl>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="flex-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                      >
                        Open Dashboard
                      </button>
                      <button
                        type="button"
                        className="flex-1 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        Forecast
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">Latest Transactions</h3>
                    <p className="text-sm text-muted-foreground">Adaptive table supports sorting, filtering, and infinite scroll on mobile.</p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    View All
                  </button>
                </div>
                <div className="mt-4 overflow-x-auto rounded-xl border border-border">
                  <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                    <thead className="bg-muted/60 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Reference</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Project</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3 text-right">Status</th>
                        <th className="px-4 py-3 text-right">Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TRANSACTIONS.map((transaction) => (
                        <tr key={transaction.id} className="border-t border-border text-sm text-muted-foreground transition hover:bg-muted/40">
                          <td className="px-4 py-3 font-semibold text-foreground">{transaction.id}</td>
                          <td className="px-4 py-3">{transaction.type}</td>
                          <td className="px-4 py-3">{transaction.project}</td>
                          <td className="px-4 py-3 text-right font-semibold text-foreground">{transaction.amount}</td>
                          <td className="px-4 py-3 text-right">
                            <span className="inline-flex items-center justify-end gap-2 text-xs uppercase tracking-[0.2em] text-foreground">
                              {transaction.status}
                              <ArrowUpRight className="size-3 text-muted-foreground" />
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-xs">{transaction.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Supplier Alerts</h3>
                      <p className="text-sm text-muted-foreground">Progressive disclosure reveals remediation steps on tap.</p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      Manage
                    </button>
                  </div>
                  <div className="mt-4 space-y-3">
                    {SUPPLIER_ALERTS.map((alert) => (
                      <div key={alert.id} className={clsx('rounded-xl px-4 py-3 text-sm shadow-sm', SEVERITY_STYLES[alert.severity])}>
                        <p className="font-semibold">{alert.supplier}</p>
                        <p className="text-xs opacity-80">{alert.issue}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="text-lg font-semibold">Loading & Empty States</h3>
                  <p className="text-sm text-muted-foreground">Skeleton placeholders preserve layout integrity during data fetches.</p>
                  <div className="mt-4 space-y-3">
                    {SKELETON_ROWS.map((row) => (
                      <div key={row} className="flex animate-pulse items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
                        <div className="h-3 w-32 rounded-full bg-muted" />
                        <div className="h-3 w-20 rounded-full bg-muted" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Form Elements & Validation Language</h3>
              <p className="text-sm text-muted-foreground">Input suite aligns with accessibility targets (WCAG 2.1 AA) and mobile ergonomics.</p>
              <form className="mt-6 grid gap-6 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">
                  <span>Supplier Email</span>
                  <input
                    type="email"
                    defaultValue="contact@ecobuild.de"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-describedby="supplier-email-help"
                  />
                  <p id="supplier-email-help" className="text-xs text-muted-foreground">Used for automated status updates.</p>
                </label>
                <label className="space-y-2 text-sm font-medium">
                  <span>Budget Threshold (%)</span>
                  <input
                    type="number"
                    defaultValue={85}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground">Trigger guardrails when actual spend exceeds threshold.</p>
                </label>
                <label className="md:col-span-2 space-y-2 text-sm font-medium">
                  <span>Project Rationale</span>
                  <textarea
                    rows={4}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Describe investment impact and procurement strategy..."
                  />
                </label>
                <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                  >
                    Submit for Review
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Save Draft
                  </button>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="size-4 text-emerald-500" />
                    Validation ensures audit-ready change logs.
                  </span>
                </div>
              </form>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

export default ProcurementDesignShowcase;
