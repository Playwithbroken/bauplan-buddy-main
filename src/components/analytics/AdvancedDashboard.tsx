import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, TrendingDown, Minus, RefreshCw, Download, Settings,
  Calendar, Filter, Eye, EyeOff, Maximize2, Edit3, Plus, MoreVertical, Activity,
  GripVertical, X, RotateCcw, Expand, Shrink
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AnalyticsService, AnalyticsMetric, ChartData, Dashboard, DashboardWidget } from '@/services/analyticsService';
import { useToast } from '@/hooks/use-toast';

interface AdvancedDashboardProps {
  dashboardId?: string;
  editable?: boolean;
  onDashboardChange?: (dashboard: Dashboard) => void;
}

type MetricDirection = 'above' | 'below';
type ImpactMetricStatus = 'good' | 'watch' | 'off-track' | 'missing';

interface ImpactMetricDefinition {
  id: string;
  label: string;
  format: AnalyticsMetric['format'];
  target: number;
  direction?: MetricDirection;
  unit?: string;
  targetLabel?: string;
}

interface ImpactFlowDefinition {
  id: string;
  flow: string;
  description: string;
  owner: string;
  instrumentation: string;
  metrics: ImpactMetricDefinition[];
}

interface ImpactCanvasRow extends ImpactFlowDefinition {
  metrics: Array<ImpactMetricDefinition & {
    current: string;
    targetDisplay: string;
    status: ImpactMetricStatus;
  }>;
  alerts: string[];
  watchList: string[];
  overallStatus: ImpactMetricStatus;
}

const impactCanvasConfig: ImpactFlowDefinition[] = [
  {
    id: 'platform-reliability',
    flow: 'Platform Reliability',
    description: 'Keep Bauplan Buddy responsive on every site and device.',
    owner: 'SRE / Platform',
    instrumentation: 'Prometheus + Alertmanager + Sentry',
    metrics: [
      { id: 'uptime', label: 'Uptime', format: 'percentage', target: 99.9, direction: 'above' },
      { id: 'error-rate', label: 'Error Rate', format: 'percentage', target: 0.1, direction: 'below', targetLabel: '≤ 0,1%' },
      { id: 'api-latency', label: 'API-Latenz (p95)', format: 'number', target: 200, direction: 'below', unit: 'ms', targetLabel: '≤ 200 ms' },
    ],
  },
  {
    id: 'experience-performance',
    flow: 'Experience Performance',
    description: 'Deliver lightning-fast UI for planners and site crews.',
    owner: 'Frontend Lead',
    instrumentation: 'Lighthouse CI + axe + Theme/Density Tests',
    metrics: [
      { id: 'page-load-time', label: 'Page Load', format: 'number', target: 3, direction: 'below', unit: 's', targetLabel: '≤ 3 s' },
      { id: 'lighthouse-score', label: 'Lighthouse', format: 'number', target: 90, direction: 'above' },
      { id: 'wcag-aa-compliance', label: 'WCAG 2.1 AA', format: 'percentage', target: 100, direction: 'above', targetLabel: 'AA' },
    ],
  },
  {
    id: 'landing-growth',
    flow: 'Landing → Registration Growth',
    description: 'Optimize marketing funnel from visit to signup.',
    owner: 'Growth PM',
    instrumentation: 'Landing Analytics + GA4',
    metrics: [
      { id: 'landing-to-register', label: 'Landing → Register', format: 'percentage', target: 5, direction: 'above', targetLabel: '≥ 5%' },
      { id: 'scroll-depth', label: 'Scrolltiefe', format: 'percentage', target: 75, direction: 'above', targetLabel: '≥ 75%' },
      { id: 'cta-click-rate', label: 'CTA Click Rate', format: 'percentage', target: 5, direction: 'above', targetLabel: '≥ 5%' },
    ],
  },
  {
    id: 'onboarding-flow',
    flow: 'Registration → Onboarding',
    description: 'Ensure new users activate key product flows.',
    owner: 'Product Lead',
    instrumentation: 'Onboarding Analytics + Playwright Smoke Tests',
    metrics: [
      { id: 'register-to-onboarding', label: 'Onboarding Completion', format: 'percentage', target: 80, direction: 'above', targetLabel: '≥ 80%' },
      { id: 'empty-state-action-rate', label: 'Empty State → Action', format: 'percentage', target: 60, direction: 'above', targetLabel: '≥ 60%' },
      { id: 'test-coverage', label: 'Test Coverage', format: 'percentage', target: 80, direction: 'above', targetLabel: '≥ 80%' },
    ],
  },
  {
    id: 'in-app-productivity',
    flow: 'In-App Productivity',
    description: 'Increase navigation speed via breadcrumbs, Quick Actions & Suche.',
    owner: 'Design Systems Lead',
    instrumentation: 'In-App Telemetrie (Breadcrumbs, Ctrl+K, Suche)',
    metrics: [
      { id: 'breadcrumb-usage', label: 'Breadcrumb Nutzung', format: 'percentage', target: 60, direction: 'above', targetLabel: '≥ 60%' },
      { id: 'quick-actions-usage', label: 'Quick Actions Nutzung', format: 'percentage', target: 40, direction: 'above', targetLabel: '≥ 40%' },
      { id: 'search-success-rate', label: 'Search Success', format: 'percentage', target: 85, direction: 'above', targetLabel: '≥ 85%' },
    ],
  },
  {
    id: 'ai-support',
    flow: 'AI Support & Help Deflection',
    description: 'Reduce ticket load with explainable AI and clear UI hints.',
    owner: 'AI Experience Lead + Support',
    instrumentation: 'AI Support Logs + Supabase Feedback + Support Desk',
    metrics: [
      { id: 'tooltip-hover-rate', label: 'Tooltip Nutzung', format: 'percentage', target: 35, direction: 'above', targetLabel: '≥ 35%' },
      { id: 'knowledge-base-hit-rate', label: 'KB Hit Rate', format: 'percentage', target: 70, direction: 'above', targetLabel: '≥ 70%' },
      { id: 'sla-compliance', label: 'SLA Erfüllung', format: 'percentage', target: 95, direction: 'above', targetLabel: '≥ 95%' },
      { id: 'support-ticket-reduction', label: 'Ticket Reduktion', format: 'percentage', target: 25, direction: 'above', targetLabel: '≥ 25%' },
    ],
  },
  {
    id: 'revenue-retention',
    flow: 'Revenue & Retention',
    description: 'Track monetization, cost-to-serve, and churn in one view.',
    owner: 'GTM Lead + Finance',
    instrumentation: 'GTM + Finance + BI Dashboards',
    metrics: [
      { id: 'monthly-active-users', label: 'MAU', format: 'number', target: 1200, direction: 'above' },
      { id: 'user-retention-30d', label: 'Retention (30d)', format: 'percentage', target: 70, direction: 'above', targetLabel: '≥ 70%' },
      { id: 'revenue-per-user', label: 'Revenue per User', format: 'currency', target: 50, direction: 'above', targetLabel: '≥ 50 €' },
      { id: 'churn-rate', label: 'Churn Rate', format: 'percentage', target: 5, direction: 'below', targetLabel: '≤ 5%' },
    ],
  },
];

const impactStatusBadges: Record<ImpactMetricStatus, { label: string; className: string }> = {
  good: { label: 'On Track', className: 'bg-emerald-100 text-emerald-800' },
  watch: { label: 'Beobachten', className: 'bg-amber-100 text-amber-800' },
  'off-track': { label: 'Achtung', className: 'bg-red-100 text-red-700' },
  missing: { label: 'Keine Daten', className: 'bg-slate-100 text-slate-600' },
};

const impactStatusDots: Record<ImpactMetricStatus, string> = {
  good: 'bg-emerald-500',
  watch: 'bg-amber-500',
  'off-track': 'bg-red-500',
  missing: 'bg-slate-400',
};

const formatValueByFormat = (value: number, format: AnalyticsMetric['format'], unit?: string) => {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 2,
      }).format(value);
    case 'percentage': {
      const decimals = Math.abs(value) < 1 ? 2 : 1;
      return `${new Intl.NumberFormat('de-DE', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value)}%`;
    }
    case 'duration':
      return `${value.toLocaleString('de-DE')} Tage`;
    default: {
      const formatter = new Intl.NumberFormat('de-DE', {
        minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
        maximumFractionDigits: Number.isInteger(value) ? 0 : 1,
      });
      const base = formatter.format(value);
      return unit ? `${base} ${unit}` : base;
    }
  }
};

const evaluateMetricStatus = (
  value: number | undefined,
  target: number,
  direction: MetricDirection,
): ImpactMetricStatus => {
  if (value === undefined || Number.isNaN(value)) {
    return 'missing';
  }

  if (direction === 'above') {
    if (value >= target) return 'good';
    if (value >= target * 0.95) return 'watch';
    return 'off-track';
  }

  if (value <= target) return 'good';
  if (value <= target * 1.05) return 'watch';
  return 'off-track';
};

export function AdvancedDashboard({ dashboardId = 'executive-dashboard', editable = false, onDashboardChange }: AdvancedDashboardProps) {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [kpis, setKpis] = useState<AnalyticsMetric[]>([]);
  const [chartData, setChartData] = useState<Record<string, ChartData>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('last-30-days');
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [draggingWidget, setDraggingWidget] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<keyof typeof presets | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [editingKPI, setEditingKPI] = useState<string | null>(null);
  const [kpiEditForm, setKpiEditForm] = useState<{
    title: string;
    value: number;
    format: string;
    trend: 'up' | 'down' | 'stable';
    changePercent: number;
    category: string;
  } | null>(null);
  const [customization, setCustomization] = useState({
    theme: 'default' as 'default' | 'minimal' | 'colorful' | 'dark',
    cardStyle: 'modern' as 'modern' | 'classic' | 'rounded' | 'flat',
    showTrends: true,
    showIcons: true,
    compactView: false,
    animationsEnabled: true
  });

  const kpiLookup = useMemo(() => {
    const map = new Map<string, AnalyticsMetric>();
    kpis.forEach(metric => map.set(metric.id, metric));
    return map;
  }, [kpis]);

  const impactCanvas = useMemo<ImpactCanvasRow[]>(() => {
    return impactCanvasConfig.map((flow) => {
      const metrics = flow.metrics.map((metricDef) => {
        const metricData = kpiLookup.get(metricDef.id);
        const metricFormat = metricData?.format ?? metricDef.format;
        const current = metricData
          ? formatValueByFormat(metricData.value, metricFormat, metricDef.unit)
          : '—';
        const targetDisplay = metricDef.targetLabel
          ? metricDef.targetLabel
          : formatValueByFormat(metricDef.target, metricDef.format, metricDef.unit);
        const status = evaluateMetricStatus(
          metricData?.value,
          metricDef.target,
          metricDef.direction ?? 'above'
        );

        return {
          ...metricDef,
          current,
          targetDisplay,
          status,
        };
      });

      const alerts = metrics
        .filter((metric) => metric.status === 'off-track')
        .map((metric) => `${metric.label}: ${metric.current} (Ziel ${metric.targetDisplay})`);

      const watchList = metrics
        .filter((metric) => metric.status === 'watch')
        .map((metric) => `${metric.label}: ${metric.current} (Ziel ${metric.targetDisplay})`);

      let overallStatus: ImpactMetricStatus = 'good';
      if (alerts.length > 0) {
        overallStatus = 'off-track';
      } else if (watchList.length > 0) {
        overallStatus = 'watch';
      } else if (metrics.every((metric) => metric.status === 'missing')) {
        overallStatus = 'missing';
      }

      return {
        ...flow,
        metrics,
        alerts,
        watchList,
        overallStatus,
      };
    });
  }, [kpiLookup]);
  
  // Predefined customization presets with widget configurations
  const presets = {
    executive: {
      theme: 'default' as const,
      cardStyle: 'modern' as const,
      showTrends: true,
      showIcons: true,
      compactView: false,
      animationsEnabled: true,
      widgets: [
        { id: 'metric-revenue', title: 'Gesamtumsatz', type: 'metric', position: { x: 0, y: 0, w: 3, h: 2 }, dataSource: 'total-revenue' },
        { id: 'metric-profit', title: 'Gewinn', type: 'metric', position: { x: 3, y: 0, w: 3, h: 2 }, dataSource: 'total-profit' },
        { id: 'metric-projects', title: 'Aktive Projekte', type: 'metric', position: { x: 6, y: 0, w: 3, h: 2 }, dataSource: 'active-projects' },
        { id: 'metric-roi', title: 'ROI', type: 'metric', position: { x: 9, y: 0, w: 3, h: 2 }, dataSource: 'avg-roi' },
        { id: 'chart-revenue-trend', title: 'Umsatzentwicklung', type: 'chart', position: { x: 0, y: 2, w: 4, h: 4 }, dataSource: 'revenue-trend' },
        { id: 'chart-cost-distribution', title: 'Kostenverteilung', type: 'chart', position: { x: 8, y: 2, w: 4, h: 4 }, dataSource: 'cost-distribution' }
      ]
    },
    minimal: {
      theme: 'minimal' as const,
      cardStyle: 'flat' as const,
      showTrends: false,
      showIcons: false,
      compactView: true,
      animationsEnabled: false,
      widgets: [
        { id: 'metric-revenue', title: 'Umsatz', type: 'metric', position: { x: 0, y: 0, w: 2, h: 2 }, dataSource: 'total-revenue' },
        { id: 'metric-profit', title: 'Gewinn', type: 'metric', position: { x: 2, y: 0, w: 2, h: 2 }, dataSource: 'total-profit' },
        { id: 'metric-projects', title: 'Projekte', type: 'metric', position: { x: 4, y: 0, w: 2, h: 2 }, dataSource: 'active-projects' },
        { id: 'chart-revenue-trend', title: 'Trend', type: 'chart', position: { x: 0, y: 2, w: 3, h: 3 }, dataSource: 'revenue-trend' }
      ]
    },
    colorful: {
      theme: 'colorful' as const,
      cardStyle: 'rounded' as const,
      showTrends: true,
      showIcons: true,
      compactView: false,
      animationsEnabled: true,
      widgets: [
        { id: 'metric-revenue', title: 'Gesamtumsatz', type: 'metric', position: { x: 0, y: 0, w: 3, h: 2 }, dataSource: 'total-revenue' },
        { id: 'metric-profit', title: 'Gewinn', type: 'metric', position: { x: 3, y: 0, w: 3, h: 2 }, dataSource: 'total-profit' },
        { id: 'metric-projects', title: 'Aktive Projekte', type: 'metric', position: { x: 6, y: 0, w: 3, h: 2 }, dataSource: 'active-projects' },
        { id: 'metric-roi', title: 'ROI', type: 'metric', position: { x: 9, y: 0, w: 3, h: 2 }, dataSource: 'avg-roi' },
        { id: 'chart-revenue-trend', title: 'Umsatzentwicklung', type: 'chart', position: { x: 0, y: 2, w: 4, h: 4 }, dataSource: 'revenue-trend' },
        { id: 'chart-cost-distribution', title: 'Kostenverteilung', type: 'chart', position: { x: 4, y: 2, w: 3, h: 4 }, dataSource: 'cost-distribution' },
        { id: 'table-projects', title: 'Projekt-Übersicht', type: 'table', position: { x: 7, y: 2, w: 4, h: 5 }, dataSource: 'table-projects' },
        { id: 'progress-widget', title: 'Fortschritt', type: 'progress', position: { x: 0, y: 6, w: 2, h: 2 }, dataSource: 'progress-widget' },
        { id: 'alert-widget', title: 'Benachrichtigungen', type: 'alert', position: { x: 2, y: 6, w: 2, h: 3 }, dataSource: 'alert-widget' }
      ]
    },
    professional: {
      theme: 'dark' as const,
      cardStyle: 'classic' as const,
      showTrends: true,
      showIcons: false,
      compactView: false,
      animationsEnabled: false,
      widgets: [
        { id: 'metric-revenue', title: 'Gesamtumsatz', type: 'metric', position: { x: 0, y: 0, w: 3, h: 2 }, dataSource: 'total-revenue' },
        { id: 'metric-profit', title: 'Gewinn', type: 'metric', position: { x: 3, y: 0, w: 3, h: 2 }, dataSource: 'total-profit' },
        { id: 'metric-projects', title: 'Aktive Projekte', type: 'metric', position: { x: 6, y: 0, w: 3, h: 2 }, dataSource: 'active-projects' },
        { id: 'metric-roi', title: 'ROI', type: 'metric', position: { x: 9, y: 0, w: 3, h: 2 }, dataSource: 'avg-roi' },
        { id: 'chart-revenue-trend', title: 'Umsatzentwicklung', type: 'chart', position: { x: 0, y: 2, w: 4, h: 4 }, dataSource: 'revenue-trend' },
        { id: 'chart-cost-distribution', title: 'Kostenverteilung', type: 'chart', position: { x: 4, y: 2, w: 3, h: 4 }, dataSource: 'cost-distribution' },
        { id: 'table-projects', title: 'Projekt-Performance', type: 'table', position: { x: 7, y: 2, w: 4, h: 5 }, dataSource: 'table-projects' },
        { id: 'table-team', title: 'Team-Performance', type: 'table', position: { x: 0, y: 6, w: 3, h: 4 }, dataSource: 'table-team' },
        { id: 'table-costs', title: 'Kosten-Analyse', type: 'table', position: { x: 3, y: 6, w: 3, h: 4 }, dataSource: 'table-costs' }
      ]
    },
    comprehensive: {
      theme: 'default' as const,
      cardStyle: 'modern' as const,
      showTrends: true,
      showIcons: true,
      compactView: false,
      animationsEnabled: true,
      widgets: [
        { id: 'metric-revenue', title: 'Gesamtumsatz', type: 'metric', position: { x: 0, y: 0, w: 2, h: 2 }, dataSource: 'total-revenue' },
        { id: 'metric-profit', title: 'Gewinn', type: 'metric', position: { x: 2, y: 0, w: 2, h: 2 }, dataSource: 'total-profit' },
        { id: 'metric-projects', title: 'Aktive Projekte', type: 'metric', position: { x: 4, y: 0, w: 2, h: 2 }, dataSource: 'active-projects' },
        { id: 'metric-roi', title: 'ROI', type: 'metric', position: { x: 6, y: 0, w: 2, h: 2 }, dataSource: 'avg-roi' },
        { id: 'chart-revenue-trend', title: 'Umsatzentwicklung', type: 'chart', position: { x: 0, y: 2, w: 4, h: 4 }, dataSource: 'revenue-trend' },
        { id: 'chart-cost-distribution', title: 'Kostenverteilung', type: 'chart', position: { x: 4, y: 2, w: 4, h: 4 }, dataSource: 'cost-distribution' },
        { id: 'table-projects', title: 'Projekt-Tabelle', type: 'table', position: { x: 0, y: 6, w: 4, h: 5 }, dataSource: 'table-projects' },
        { id: 'table-costs', title: 'Kosten-Tabelle', type: 'table', position: { x: 4, y: 6, w: 3, h: 4 }, dataSource: 'table-costs' },
        { id: 'table-team', title: 'Team-Performance', type: 'table', position: { x: 7, y: 6, w: 3, h: 4 }, dataSource: 'table-team' },
        { id: 'progress-widget', title: 'Fortschrittsbalken', type: 'progress', position: { x: 0, y: 11, w: 2, h: 2 }, dataSource: 'progress-widget' },
        { id: 'alert-widget', title: 'Benachrichtigungen', type: 'alert', position: { x: 2, y: 11, w: 2, h: 3 }, dataSource: 'alert-widget' }
      ]
    },
    analytics: {
      theme: 'colorful' as const,
      cardStyle: 'rounded' as const,
      showTrends: true,
      showIcons: true,
      compactView: false,
      animationsEnabled: true,
      widgets: [
        { id: 'chart-revenue-trend', title: 'Umsatzentwicklung', type: 'chart', position: { x: 0, y: 0, w: 4, h: 4 }, dataSource: 'revenue-trend' },
        { id: 'chart-cost-distribution', title: 'Kostenverteilung', type: 'chart', position: { x: 4, y: 0, w: 4, h: 4 }, dataSource: 'cost-distribution' },
        { id: 'metric-revenue', title: 'Umsatz', type: 'metric', position: { x: 8, y: 0, w: 2, h: 2 }, dataSource: 'total-revenue' },
        { id: 'metric-profit', title: 'Gewinn', type: 'metric', position: { x: 10, y: 0, w: 2, h: 2 }, dataSource: 'total-profit' },
        { id: 'metric-projects', title: 'Projekte', type: 'metric', position: { x: 8, y: 2, w: 2, h: 2 }, dataSource: 'active-projects' },
        { id: 'metric-roi', title: 'ROI', type: 'metric', position: { x: 10, y: 2, w: 2, h: 2 }, dataSource: 'avg-roi' },
        { id: 'table-projects', title: 'Projekt-Analytics', type: 'table', position: { x: 0, y: 4, w: 4, h: 5 }, dataSource: 'table-projects' },
        { id: 'table-team', title: 'Team-Analytics', type: 'table', position: { x: 4, y: 4, w: 4, h: 5 }, dataSource: 'table-team' },
        { id: 'table-costs', title: 'Kosten-Analytics', type: 'table', position: { x: 8, y: 4, w: 4, h: 5 }, dataSource: 'table-costs' }
      ]
    },
    overview: {
      theme: 'default' as const,
      cardStyle: 'modern' as const,
      showTrends: true,
      showIcons: true,
      compactView: false,
      animationsEnabled: true,
      widgets: [
        { id: 'metric-revenue', title: 'Gesamtumsatz', type: 'metric', position: { x: 0, y: 0, w: 3, h: 2 }, dataSource: 'total-revenue' },
        { id: 'metric-profit', title: 'Gewinn', type: 'metric', position: { x: 3, y: 0, w: 3, h: 2 }, dataSource: 'total-profit' },
        { id: 'metric-projects', title: 'Aktive Projekte', type: 'metric', position: { x: 6, y: 0, w: 3, h: 2 }, dataSource: 'active-projects' },
        { id: 'metric-roi', title: 'ROI', type: 'metric', position: { x: 9, y: 0, w: 3, h: 2 }, dataSource: 'avg-roi' },
        { id: 'chart-revenue-trend', title: 'Umsatzentwicklung', type: 'chart', position: { x: 0, y: 2, w: 4, h: 4 }, dataSource: 'revenue-trend' },
        { id: 'progress-widget', title: 'Projektfortschritt', type: 'progress', position: { x: 4, y: 2, w: 2, h: 2 }, dataSource: 'progress-widget' },
        { id: 'alert-widget', title: 'Wichtige Benachrichtigungen', type: 'alert', position: { x: 6, y: 2, w: 2, h: 3 }, dataSource: 'alert-widget' },
        { id: 'table-projects', title: 'Projekt-Übersicht', type: 'table', position: { x: 8, y: 2, w: 4, h: 5 }, dataSource: 'table-projects' }
      ]
    }
  };
  
  const applyPreset = (presetName: keyof typeof presets) => {
    const preset = presets[presetName];
    
    // Apply customization settings
    setCustomization({
      theme: preset.theme,
      cardStyle: preset.cardStyle,
      showTrends: preset.showTrends,
      showIcons: preset.showIcons,
      compactView: preset.compactView,
      animationsEnabled: preset.animationsEnabled
    });
    
    // Apply widget configuration if dashboard exists
    if (dashboard && preset.widgets) {
      // Keep existing widgets but reflow positions from preset where possible
      const existing = dashboard.widgets;
      const positioned = preset.widgets.map((widgetConfig) => {
        const match = existing.find(
          (w) =>
            w.dataSource === widgetConfig.dataSource ||
            w.title === widgetConfig.title ||
            w.id.startsWith(widgetConfig.id)
        );

        if (match) {
          return {
            ...match,
            position: widgetConfig.position,
          };
        }

        return {
          id: `${widgetConfig.id}-${Date.now()}`,
          title: widgetConfig.title,
          type: widgetConfig.type as 'metric' | 'chart' | 'table' | 'progress' | 'alert',
          position: widgetConfig.position,
          dataSource: widgetConfig.dataSource,
          config: { showHeader: true },
        };
      });

      // Include remaining existing widgets that were not in the preset to avoid losing content
      const remaining = existing.filter(
        (w) =>
          !preset.widgets?.some(
            (pw) =>
              w.dataSource === pw.dataSource ||
              w.title === pw.title ||
              w.id.startsWith(pw.id)
          )
      );

      const updatedDashboard = {
        ...dashboard,
        widgets: [...positioned, ...remaining],
        updatedAt: new Date().toISOString(),
      };

      setDashboard(updatedDashboard);
    }
    
    // Track active preset
    setActivePreset(presetName);
    
    toast({
      title: "Preset angewendet",
      description: `Dashboard-Design und Layout wurde auf "${presetName}" gesetzt.`,
    });
  };
  
  // Available widget templates
  const widgetLibrary = [
    {
      id: 'metric-revenue',
      name: 'Umsatz-Metrik',
      type: 'metric' as const,
      icon: '💰',
      defaultSize: { w: 3, h: 2 },
      category: 'financial'
    },
    {
      id: 'metric-profit',
      name: 'Gewinn-Metrik', 
      type: 'metric' as const,
      icon: '📈',
      defaultSize: { w: 3, h: 2 },
      category: 'financial'
    },
    {
      id: 'chart-revenue-trend',
      name: 'Umsatzentwicklung',
      type: 'chart' as const,
      icon: '📊',
      defaultSize: { w: 4, h: 4 },
      category: 'analytics'
    },
    {
      id: 'chart-cost-distribution',
      name: 'Kostenverteilung',
      type: 'chart' as const,
      icon: '🥧',
      defaultSize: { w: 3, h: 4 },
      category: 'analytics'
    },
    {
      id: 'table-projects',
      name: 'Projekt-Tabelle',
      type: 'table' as const,
      icon: '📋',
      defaultSize: { w: 4, h: 5 },
      category: 'project'
    },
    {
      id: 'table-costs',
      name: 'Kosten-Tabelle',
      type: 'table' as const,
      icon: '📧',
      defaultSize: { w: 3, h: 4 },
      category: 'financial'
    },
    {
      id: 'table-team',
      name: 'Team-Performance',
      type: 'table' as const,
      icon: '👥',
      defaultSize: { w: 3, h: 4 },
      category: 'team'
    },
    {
      id: 'progress-widget',
      name: 'Fortschrittsbalken',
      type: 'progress' as const,
      icon: '📉',
      defaultSize: { w: 2, h: 2 },
      category: 'project'
    },
    {
      id: 'alert-widget',
      name: 'Benachrichtigungen',
      type: 'alert' as const,
      icon: '🔔',
      defaultSize: { w: 2, h: 3 },
      category: 'system'
    }
  ];
  
  const addWidget = (widgetTemplate: typeof widgetLibrary[0]) => {
    if (!dashboard) return;
    
    const newWidget: DashboardWidget = {
      id: `widget-${Date.now()}`,
      title: widgetTemplate.name,
      type: widgetTemplate.type,
      position: {
        x: 0,
        y: Math.max(...dashboard.widgets.map(w => w.position.y + w.position.h), 0),
        w: widgetTemplate.defaultSize.w,
        h: widgetTemplate.defaultSize.h
      },
      dataSource: widgetTemplate.id,
      config: { showHeader: true }
    };
    
    const updatedDashboard = {
      ...dashboard,
      widgets: [...dashboard.widgets, newWidget],
      updatedAt: new Date().toISOString()
    };
    
    setDashboard(updatedDashboard);
    setShowWidgetLibrary(false);
    
    toast({
      title: "Widget hinzugefügt",
      description: `${widgetTemplate.name} wurde erfolgreich hinzugefügt.`,
    });
  };
  
  const resizeWidget = (widgetId: string, newSize: { w: number; h: number }) => {
    if (!dashboard) return;
    
    const updatedWidgets = dashboard.widgets.map(widget => 
      widget.id === widgetId 
        ? { ...widget, position: { ...widget.position, ...newSize } }
        : widget
    );
    
    const updatedDashboard = {
      ...dashboard,
      widgets: updatedWidgets,
      updatedAt: new Date().toISOString()
    };
    
    setDashboard(updatedDashboard);
  };
  
  const removeWidget = (widgetId: string) => {
    if (!dashboard) return;
    
    const updatedWidgets = dashboard.widgets.filter(widget => widget.id !== widgetId);
    const updatedDashboard = {
      ...dashboard,
      widgets: updatedWidgets,
      updatedAt: new Date().toISOString()
    };
    
    setDashboard(updatedDashboard);
    
    toast({
      title: "Widget entfernt",
      description: "Das Widget wurde erfolgreich entfernt.",
    });
  };
  
  const startEditingKPI = (widgetId: string, metric: AnalyticsMetric) => {
    setEditingKPI(widgetId);
    setKpiEditForm({
      title: metric.name,
      value: metric.value,
      format: metric.format,
      trend: metric.trend,
      changePercent: metric.changePercent || 0,
      category: metric.category
    });
  };
  
  const saveKPIChanges = () => {
    if (!editingKPI || !kpiEditForm) return;
    
    // Update the KPI in the kpis array
    const updatedKpis = kpis.map(kpi => {
      if (kpis.findIndex(k => k.id === editingKPI) === kpis.indexOf(kpi)) {
        return {
          ...kpi,
          name: kpiEditForm.title,
          value: kpiEditForm.value,
          format: kpiEditForm.format as 'currency' | 'percentage' | 'number' | 'duration',
          trend: kpiEditForm.trend,
          changePercent: kpiEditForm.changePercent,
          category: kpiEditForm.category as 'financial' | 'project' | 'team' | 'customer' | 'efficiency',
          lastUpdated: new Date().toISOString()
        };
      }
      return kpi;
    });
    
    setKpis(updatedKpis);
    setEditingKPI(null);
    setKpiEditForm(null);
    
    toast({
      title: "KPI aktualisiert",
      description: "Die KPI-Einstellungen wurden erfolgreich gespeichert.",
    });
  };
  
  const cancelKPIEdit = () => {
    setEditingKPI(null);
    setKpiEditForm(null);
  };
  const { toast } = useToast();

  // Define callbacks before effects that use them to avoid temporal dead zone
  const loadDashboard = React.useCallback(async () => {
    try {
      setLoading(true);
      const dashboardData = AnalyticsService.getDashboard(dashboardId);
      
      if (dashboardData) {
        setDashboard(dashboardData);
      } else {
        toast({
          title: "Dashboard nicht gefunden",
          description: "Das angeforderte Dashboard konnte nicht geladen werden.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Fehler beim Laden",
        description: "Dashboard konnte nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [dashboardId, toast]);

  const loadDashboardData = React.useCallback(async () => {
    try {
      if (!dashboard) return;

      // Load KPIs
      const kpiData = await AnalyticsService.getKPIs();
      setKpis(kpiData);

      // Load chart data for all chart widgets
      const chartPromises = dashboard.widgets
        .filter(widget => widget.type === 'chart')
        .map(async (widget) => {
          const data = await AnalyticsService.getChartData(widget.dataSource);
          return { id: widget.dataSource, data };
        });

      const chartResults = await Promise.all(chartPromises);
      const chartDataMap = chartResults.reduce((acc, result) => {
        if (result.data) {
          acc[result.id] = result.data;
        }
        return acc;
      }, {} as Record<string, ChartData>);

      setChartData(chartDataMap);
      
      // If no real data is available, create mock data for demonstration
      if (kpiData.length === 0) {
        const mockKpis: AnalyticsMetric[] = [
          {
            id: 'total-revenue',
            name: 'Gesamtumsatz',
            value: 3850000,
            format: 'currency',
            trend: 'up',
            changePercent: 12.5,
            period: 'monthly',
            category: 'financial',
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'total-profit',
            name: 'Gewinn',
            value: 1155000,
            format: 'currency',
            trend: 'up',
            changePercent: 15.2,
            period: 'monthly',
            category: 'financial',
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'active-projects',
            name: 'Aktive Projekte',
            value: 8,
            format: 'number',
            trend: 'stable',
            changePercent: 0,
            period: 'monthly',
            category: 'project',
            lastUpdated: new Date().toISOString()
          },
          {
            id: 'avg-roi',
            name: 'ROI',
            value: 35.8,
            format: 'percentage',
            trend: 'up',
            changePercent: 5.3,
            period: 'monthly',
            category: 'financial',
            lastUpdated: new Date().toISOString()
          }
        ];
        setKpis(mockKpis);
      }
      
      // Mock chart data if none exists
      if (Object.keys(chartDataMap).length === 0) {
        const mockChartData: Record<string, ChartData> = {
          'revenue-trend': {
            id: 'revenue-trend',
            name: 'Umsatzentwicklung',
            type: 'line',
            data: [
              { label: 'Jan', value: 450000 },
              { label: 'Feb', value: 520000 },
              { label: 'Mär', value: 380000 },
              { label: 'Apr', value: 680000 },
              { label: 'Mai', value: 750000 },
              { label: 'Jun', value: 620000 }
            ],
            xAxis: 'Monat',
            yAxis: 'Umsatz'
          },
          'cost-distribution': {
            id: 'cost-distribution',
            name: 'Kostenverteilung',
            type: 'pie',
            data: [
              { label: 'Material', value: 850000, color: '#3b82f6' },
              { label: 'Personal', value: 650000, color: '#10b981' },
              { label: 'Maschinen', value: 230000, color: '#f59e0b' },
              { label: 'Sonstiges', value: 120000, color: '#8b5cf6' }
            ],
            xAxis: 'Kategorie',
            yAxis: 'Kosten'
          }
        };
        setChartData(mockChartData);
      }
    } catch (error) {
      toast({
        title: "Daten konnten nicht geladen werden",
        description: "Bitte versuchen Sie es später erneut.",
        variant: "destructive"
      });
    }
  }, [dashboard, toast]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (dashboard) {
      loadDashboardData();
    }
  }, [dashboard, timeRange, loadDashboardData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    
    toast({
      title: "Dashboard aktualisiert",
      description: "Alle Daten wurden erfolgreich aktualisiert.",
    });
  };

  const handleExport = () => {
    // Mock export functionality
    toast({
      title: "Export gestartet",
      description: "Dashboard wird als PDF exportiert...",
    });
  };

  const renderMetricWidget = (widget: DashboardWidget) => {
    const metric = kpis.find(kpi => kpi.id === widget.dataSource);
    if (!metric) return null;

    const formattedValue = formatValueByFormat(metric.value, metric.format);

    const TrendIcon = metric.trend === 'up' ? TrendingUp : 
                     metric.trend === 'down' ? TrendingDown : Minus;
    
    const trendColor = metric.trend === 'up' ? 'text-green-600' : 
                       metric.trend === 'down' ? 'text-red-600' : 'text-gray-600';

    // Theme-based styling
    const getCardStyle = () => {
      const baseClasses = "hover:shadow-md transition-all duration-300";
      
      switch (customization.theme) {
        case 'minimal':
          return `${baseClasses} bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700`;
        case 'colorful': {
          const colorMap = {
            'total-revenue': 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200',
            'total-profit': 'bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200',
            'active-projects': 'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200',
            'avg-roi': 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200'
          };
          return `${baseClasses} ${colorMap[metric.id as keyof typeof colorMap] || 'bg-gray-50 border-gray-200'}`;
        }
        case 'dark':
          return `${baseClasses} bg-gray-900 border-gray-700 text-white`;
        default:
          return `${baseClasses} bg-card border border-border`;
      }
    };

    const getCardRadius = () => {
      switch (customization.cardStyle) {
        case 'classic': return 'rounded-none';
        case 'rounded': return 'rounded-xl';
        case 'flat': return 'rounded-sm';
        default: return 'rounded-lg';
      }
    };

    const getWidgetGridClass = (widget: DashboardWidget) => {
      // Convert widget position to CSS Grid classes
      const colSpan = Math.min(widget.position.w, 4); // Max 4 columns in our grid
      const rowSpan = widget.position.h;
      
      if (colSpan >= 4) return 'col-span-full';
      if (colSpan === 3) return 'col-span-3';
      if (colSpan === 2) return 'col-span-2';
      return 'col-span-1';
    };

    return (
      <Card 
        key={widget.id} 
        className={`${getCardStyle()} ${getCardRadius()} ${customization.animationsEnabled ? 'transform hover:scale-105' : ''} ${getWidgetGridClass(widget)} relative group`}
        style={{
          minHeight: `${widget.position.h * 120}px` // Dynamic height based on widget height
        }}
      >
        {editMode && (
          <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-black/70 text-white text-xs px-2 py-1 rounded">
              {widget.position.w}x{widget.position.h}
            </div>
          </div>
        )}
        {editMode && (
          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex gap-1">
              {/* Resize Controls */}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 bg-white/90 shadow-sm hover:bg-white"
                onClick={() => resizeWidget(widget.id, { w: Math.max(1, widget.position.w - 1), h: widget.position.h })}
                disabled={widget.position.w <= 1}
                title="Schmaler machen"
              >
                <Shrink className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 bg-white/90 shadow-sm hover:bg-white"
                onClick={() => resizeWidget(widget.id, { w: Math.min(4, widget.position.w + 1), h: widget.position.h })}
                disabled={widget.position.w >= 4}
                title="Breiter machen"
              >
                <Expand className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 bg-white/90 shadow-sm hover:bg-red-50"
                onClick={() => removeWidget(widget.id)}
                title="Widget entfernen"
              >
                <X className="h-3 w-3 text-red-500" />
              </Button>
            </div>
          </div>
        )}
        <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${customization.compactView ? 'pb-1' : 'pb-2'}`}>
          <CardTitle className={`${customization.compactView ? 'text-xs' : 'text-sm'} font-medium`}>{widget.title}</CardTitle>
          <div className="flex items-center gap-2">
            {customization.showIcons && (
              <div className={`h-4 w-4 ${customization.theme === 'colorful' ? 'text-current' : 'text-muted-foreground'}`}>
                {metric.category === 'financial' && <TrendIcon className="h-4 w-4" />}
                {metric.category === 'project' && <Activity className="h-4 w-4" />}
              </div>
            )}
            {editable && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => startEditingKPI(widget.id, metric)}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    KPI bearbeiten
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Eye className="h-4 w-4 mr-2" />
                    Ausblenden
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent className={customization.compactView ? 'pt-0' : ''}>
          <div className={`${customization.compactView ? 'text-xl' : 'text-2xl'} font-bold ${
            customization.theme === 'colorful' ? 'text-gray-800' : ''
          }`}>
            {formattedValue}
          </div>
          {customization.showTrends && (
            <p className={`${customization.compactView ? 'text-xs' : 'text-xs'} text-muted-foreground flex items-center gap-1 mt-1`}>
              <TrendIcon className={`h-3 w-3 ${trendColor}`} />
              {metric.changePercent !== undefined 
                ? `${Math.abs(metric.changePercent).toFixed(1)}% vs. vorherige Periode`
                : metric.period === 'monthly' ? 'Monatswert' : metric.period}
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderChartWidget = (widget: DashboardWidget) => {
    const data = chartData[widget.dataSource];
    if (!data) return null;

    const renderChart = () => {
      const commonProps = {
        data: data.data,
        margin: { top: 5, right: 30, left: 20, bottom: 5 }
      };

      switch (data.type) {
        case 'line':
          return (
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(value: number) => [value.toLocaleString('de-DE'), data.yAxis]} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          );

        case 'bar':
          return (
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          );

        case 'pie':
          return (
            <PieChart width={400} height={300}>
              <Pie
                data={data.data}
                cx={200}
                cy={150}
                labelLine={false}
                label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || `hsl(${index * 45}, 70%, 50%)`} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          );

        case 'area':
          return (
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.3}
              />
            </AreaChart>
          );

        default:
          return <div className="text-center text-muted-foreground">Nicht unterstützter Chart-Typ</div>;
      }
    };

    // Theme-based styling (same as metric widgets)
    const getCardStyle = () => {
      const baseClasses = "hover:shadow-md transition-all duration-300";
      
      switch (customization.theme) {
        case 'minimal':
          return `${baseClasses} bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700`;
        case 'colorful': {
          const colorMap = {
            'revenue-trend': 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200',
            'cost-distribution': 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
          };
          return `${baseClasses} ${colorMap[widget.dataSource as keyof typeof colorMap] || 'bg-gray-50 border-gray-200'}`;
        }
        case 'dark':
          return `${baseClasses} bg-gray-900 border-gray-700 text-white`;
        default:
          return `${baseClasses} bg-card border border-border`;
      }
    };

    const getCardRadius = () => {
      switch (customization.cardStyle) {
        case 'classic': return 'rounded-none';
        case 'rounded': return 'rounded-xl';
        case 'flat': return 'rounded-sm';
        default: return 'rounded-lg';
      }
    };

    const getWidgetGridClass = (widget: DashboardWidget) => {
      // Convert widget position to CSS Grid classes
      const colSpan = Math.min(widget.position.w, 4); // Max 4 columns in our grid
      
      if (colSpan >= 4) return 'col-span-full';
      if (colSpan === 3) return 'col-span-3';
      if (colSpan === 2) return 'col-span-2';
      return 'col-span-1';
    };

    return (
      <Card 
        key={widget.id} 
        className={`${getCardStyle()} ${getCardRadius()} ${customization.animationsEnabled ? 'transform hover:scale-105' : ''} ${getWidgetGridClass(widget)} relative group`}
        style={{
          minHeight: `${widget.position.h * 120}px` // Dynamic height based on widget height
        }}
      >
        {editMode && (
          <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-black/70 text-white text-xs px-2 py-1 rounded">
              {widget.position.w}x{widget.position.h}
            </div>
          </div>
        )}
        {editMode && (
          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex gap-1">
              {/* Resize Controls */}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 bg-white/90 shadow-sm hover:bg-white"
                onClick={() => resizeWidget(widget.id, { w: Math.max(1, widget.position.w - 1), h: widget.position.h })}
                disabled={widget.position.w <= 1}
                title="Schmaler machen"
              >
                <Shrink className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 bg-white/90 shadow-sm hover:bg-white"
                onClick={() => resizeWidget(widget.id, { w: Math.min(4, widget.position.w + 1), h: widget.position.h })}
                disabled={widget.position.w >= 4}
                title="Breiter machen"
              >
                <Expand className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 bg-white/90 shadow-sm hover:bg-red-50"
                onClick={() => removeWidget(widget.id)}
                title="Widget entfernen"
              >
                <X className="h-3 w-3 text-red-500" />
              </Button>
            </div>
          </div>
        )}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Maximize2 className="h-4 w-4" />
            </Button>
            {editable && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Bearbeiten
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Eye className="h-4 w-4 mr-2" />
                    Ausblenden
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: widget.position.h >= 4 ? 400 : 300 }}>
            <ResponsiveContainer>
              {renderChart()}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderTableWidget = (widget: DashboardWidget) => {
    // Mock table data based on widget data source
    const getTableData = () => {
      switch (widget.dataSource) {
        case 'table-projects':
          return {
            headers: ['Projekt', 'Kunde', 'Status', 'Umsatz', 'ROI'],
            rows: [
              ['Wohnhaus Familie Müller', 'Familie Müller', 'Aktiv', '€450.000', '42.9%'],
              ['Bürogebäude TechCorp', 'TechCorp GmbH', 'Aktiv', '€1.200.000', '33.3%'],
              ['Dachsanierung Hamburg', 'Hausverwaltung Nord', 'Abgeschlossen', '€180.000', '42.9%'],
              ['Neubau Einfamilienhaus', 'Schmidt & Partner', 'In Planung', '€320.000', '35.2%'],
              ['Büroumbau Downtown', 'Modern Offices Ltd', 'Aktiv', '€75.000', '28.5%']
            ]
          };
        case 'table-costs':
          return {
            headers: ['Kategorie', 'Betrag', 'Anteil', 'Trend'],
            rows: [
              ['Material', '€850.000', '45%', '↗'],
              ['Personal', '€650.000', '34%', '→'],
              ['Maschinen & Geräte', '€230.000', '12%', '↘'],
              ['Subunternehmer', '€120.000', '6%', '↗'],
              ['Verwaltung', '€58.000', '3%', '→']
            ]
          };
        case 'table-team':
          return {
            headers: ['Team', 'Projekte', 'Umsatz', 'Gewinn'],
            rows: [
              ['Team Alpha', '8', '€850.000', '€255.000'],
              ['Team Beta', '6', '€620.000', '€186.000'],
              ['Team Gamma', '5', '€480.000', '€144.000'],
              ['Team Delta', '4', '€320.000', '€96.000']
            ]
          };
        default:
          return {
            headers: ['Spalte 1', 'Spalte 2', 'Spalte 3'],
            rows: [
              ['Beispiel 1', 'Wert A', '100'],
              ['Beispiel 2', 'Wert B', '200'],
              ['Beispiel 3', 'Wert C', '300']
            ]
          };
      }
    };

    const tableData = getTableData();

    // Theme-based styling (consistent with other widgets)
    const getCardStyle = () => {
      const baseClasses = "hover:shadow-md transition-all duration-300";
      
      switch (customization.theme) {
        case 'minimal':
          return `${baseClasses} bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700`;
        case 'colorful': {
          const colorMap = {
            'table-projects': 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200',
            'table-costs': 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200',
            'table-team': 'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200'
          };
          return `${baseClasses} ${colorMap[widget.dataSource as keyof typeof colorMap] || 'bg-gray-50 border-gray-200'}`;
        }
        case 'dark':
          return `${baseClasses} bg-gray-900 border-gray-700 text-white`;
        default:
          return `${baseClasses} bg-card border border-border`;
      }
    };

    const getCardRadius = () => {
      switch (customization.cardStyle) {
        case 'classic': return 'rounded-none';
        case 'rounded': return 'rounded-xl';
        case 'flat': return 'rounded-sm';
        default: return 'rounded-lg';
      }
    };

    const getWidgetGridClass = (widget: DashboardWidget) => {
      const colSpan = Math.min(widget.position.w, 4);
      
      if (colSpan >= 4) return 'col-span-full';
      if (colSpan === 3) return 'col-span-3';
      if (colSpan === 2) return 'col-span-2';
      return 'col-span-1';
    };

    return (
      <Card 
        key={widget.id} 
        className={`${getCardStyle()} ${getCardRadius()} ${customization.animationsEnabled ? 'transform hover:scale-105' : ''} ${getWidgetGridClass(widget)} relative group`}
        style={{
          minHeight: `${widget.position.h * 120}px`
        }}
      >
        {editMode && (
          <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-black/70 text-white text-xs px-2 py-1 rounded">
              {widget.position.w}x{widget.position.h}
            </div>
          </div>
        )}
        {editMode && (
          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 bg-white/90 shadow-sm hover:bg-white"
                onClick={() => resizeWidget(widget.id, { w: Math.max(1, widget.position.w - 1), h: widget.position.h })}
                disabled={widget.position.w <= 1}
                title="Schmaler machen"
              >
                <Shrink className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 bg-white/90 shadow-sm hover:bg-white"
                onClick={() => resizeWidget(widget.id, { w: Math.min(4, widget.position.w + 1), h: widget.position.h })}
                disabled={widget.position.w >= 4}
                title="Breiter machen"
              >
                <Expand className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 bg-white/90 shadow-sm hover:bg-red-50"
                onClick={() => removeWidget(widget.id)}
                title="Widget entfernen"
              >
                <X className="h-3 w-3 text-red-500" />
              </Button>
            </div>
          </div>
        )}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
          <div className="flex gap-2">
            {editable && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Bearbeiten
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Eye className="h-4 w-4 mr-2" />
                    Ausblenden
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent className="overflow-auto">
          <div className="w-full">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {tableData.headers.map((header, index) => (
                    <th key={index} className="text-left p-2 font-medium text-muted-foreground">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b hover:bg-muted/30 transition-colors">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="p-2">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderProgressWidget = (widget: DashboardWidget) => {
    // Mock progress data
    const progressValue = 75; // percentage
    const progressLabel = "Projektfortschritt";
    
    return (
      <Card key={widget.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{progressLabel}</span>
              <span className="font-medium">{progressValue}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progressValue}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderAlertWidget = (widget: DashboardWidget) => {
    // Mock alert data
    const alerts = [
      { type: 'warning', message: 'Projekt über Budget', time: '2 Std.' },
      { type: 'info', message: 'Neue Nachricht erhalten', time: '1 Tag' }
    ];
    
    return (
      <Card key={widget.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div key={index} className={`p-2 rounded text-sm ${
                alert.type === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
              }`}>
                <div className="font-medium">{alert.message}</div>
                <div className="text-xs opacity-70">vor {alert.time}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderWidget = (widget: DashboardWidget) => {
    switch (widget.type) {
      case 'metric':
      case 'kpi':
        return renderMetricWidget(widget);
      case 'chart':
        return renderChartWidget(widget);
      case 'table':
        return renderTableWidget(widget);
      case 'progress':
        return renderProgressWidget(widget);
      case 'alert':
        return renderAlertWidget(widget);
      default:
        return (
          <Card key={widget.id} className="border-dashed border-2 border-yellow-300 bg-yellow-50">
            <CardContent className="p-6">
              <div className="text-center text-yellow-700">
                <div className="text-sm font-medium mb-2">Widget-Typ '{widget.type}' noch nicht implementiert</div>
                <div className="text-xs text-yellow-600">
                  Verfügbare Typen: metric, kpi, chart, table, progress, alert
                </div>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <div className="text-lg font-medium mb-2">Dashboard nicht gefunden</div>
        <div className="text-muted-foreground">
          Das angeforderte Dashboard konnte nicht geladen werden.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header with Integrated Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{dashboard.name}</h1>
            <p className="text-muted-foreground">{dashboard.description}</p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Time Range Filter */}
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-7-days">Letzte 7 Tage</SelectItem>
                <SelectItem value="last-30-days">Letzte 30 Tage</SelectItem>
                <SelectItem value="last-90-days">Letzte 90 Tage</SelectItem>
                <SelectItem value="last-year">Letztes Jahr</SelectItem>
                <SelectItem value="custom">Benutzerdefiniert</SelectItem>
              </SelectContent>
            </Select>

            {/* Theme Selector */}
            <Select value={customization.theme} onValueChange={(value) => setCustomization(prev => ({ ...prev, theme: value as typeof prev.theme }))}>
              <SelectTrigger className="w-32">
                <Settings className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Standard</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
                <SelectItem value="colorful">Farbig</SelectItem>
                <SelectItem value="dark">Dunkel</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Preset Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Presets {activePreset && <span className="ml-1 text-xs bg-primary text-primary-foreground px-1 rounded">{activePreset}</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem onClick={() => applyPreset('executive')}>
                  💼 Executive
                  <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                    6 Widgets {activePreset === 'executive' && '✓'}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyPreset('minimal')}>
                  ⚪ Minimal
                  <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                    4 Widgets {activePreset === 'minimal' && '✓'}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyPreset('colorful')}>
                  🌈 Farbig
                  <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                    9 Widgets {activePreset === 'colorful' && '✓'}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyPreset('professional')}>
                  🕸️ Professionell
                  <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                    9 Widgets {activePreset === 'professional' && '✓'}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyPreset('comprehensive')}>
                  📊 Umfassend
                  <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                    11 Widgets {activePreset === 'comprehensive' && '✓'}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyPreset('analytics')}>
                  📈 Analytics-Fokus
                  <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                    9 Widgets {activePreset === 'analytics' && '✓'}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyPreset('overview')}>
                  👁️ Übersicht
                  <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                    8 Widgets {activePreset === 'overview' && '✓'}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    if (dashboard) {
                      const emptyDashboard = {
                        ...dashboard,
                        widgets: [],
                        updatedAt: new Date().toISOString()
                      };
                      setDashboard(emptyDashboard);
                      setActivePreset(null);
                      toast({
                        title: "Dashboard geleert",
                        description: "Alle Widgets wurden entfernt. Fügen Sie neue Widgets hinzu oder wählen Sie ein Preset.",
                      });
                    }
                  }}
                  className="text-red-600"
                >
                  🗑️ Dashboard leeren
                  <span className="ml-auto text-xs text-muted-foreground">Alle Widgets entfernen</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Actions */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Aktualisieren
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportieren
            </Button>

            {editable && (
              <Button
                variant={editMode ? "default" : "outline"}
                size="sm"
                onClick={() => setEditMode(!editMode)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                {editMode ? 'Fertig' : 'Bearbeiten'}
              </Button>
            )}
            
            {/* Help Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTutorial(true)}
            >
              <span className="h-4 w-4 mr-2">❓</span>
              Hilfe
            </Button>
          </div>
        </div>

        {/* Inline Dashboard Filters */}
        {(dashboard.filters && dashboard.filters.length > 0) || editMode && (
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Filter & Anpassungen</span>
              </div>
              
              {/* Quick Customization Toggles */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs">
                  <input 
                    type="checkbox" 
                    checked={customization.showTrends}
                    onChange={(e) => setCustomization(prev => ({ ...prev, showTrends: e.target.checked }))}
                    className="rounded"
                  />
                  <span>Trends</span>
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input 
                    type="checkbox" 
                    checked={customization.showIcons}
                    onChange={(e) => setCustomization(prev => ({ ...prev, showIcons: e.target.checked }))}
                    className="rounded"
                  />
                  <span>Icons</span>
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input 
                    type="checkbox" 
                    checked={customization.compactView}
                    onChange={(e) => setCustomization(prev => ({ ...prev, compactView: e.target.checked }))}
                    className="rounded"
                  />
                  <span>Kompakt</span>
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input 
                    type="checkbox" 
                    checked={customization.animationsEnabled}
                    onChange={(e) => setCustomization(prev => ({ ...prev, animationsEnabled: e.target.checked }))}
                    className="rounded"
                  />
                  <span>Animationen</span>
                </label>
              </div>
            </div>
            
            {dashboard.filters && dashboard.filters.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {dashboard.filters.map((filter) => (
                  <div key={filter.id} className="space-y-1">
                    <Label htmlFor={filter.id} className="text-xs text-muted-foreground">{filter.name}</Label>
                    {filter.type === 'select' && (
                      <Select>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder={`${filter.name} auswählen`} />
                        </SelectTrigger>
                        <SelectContent>
                          {filter.options?.map((option) => (
                            <SelectItem key={String(option.value)} value={String(option.value)}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {filter.type === 'text' && (
                      <Input 
                        id={filter.id}
                        placeholder={`${filter.name} eingeben`}
                        className="h-8"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-min">
        {dashboard.widgets.map(renderWidget)}
        
        {editMode && (
          <Card 
            className="border-dashed border-2 hover:border-primary transition-colors cursor-pointer col-span-1"
            onClick={() => setShowWidgetLibrary(true)}
          >
            <CardContent className="flex items-center justify-center h-full min-h-[200px]">
              <div className="text-center">
                <Plus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <div className="text-sm text-muted-foreground">
                  Widget hinzufügen
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Impact Canvas */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Impact Canvas & KPI Ownership</CardTitle>
          <CardDescription>
            Flow &gt; Metric &gt; Owner mapping synced with the new Impact Canvas so each team can monitor targets and alerts.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Flow</TableHead>
                <TableHead>Metrics & Targets</TableHead>
                <TableHead>Owner & Instrumentation</TableHead>
                <TableHead>Status & Alerts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {impactCanvas.map((flow) => (
                <TableRow key={flow.id}>
                  <TableCell className="align-top">
                    <div className="font-semibold">{flow.flow}</div>
                    <p className="text-sm text-muted-foreground mt-1">{flow.description}</p>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="space-y-2">
                      {flow.metrics.map((metric) => (
                        <div key={`${flow.id}-${metric.id}`} className="flex items-center justify-between gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${impactStatusDots[metric.status]}`} />
                            <span>{metric.label}</span>
                          </div>
                          <div className="text-xs text-muted-foreground text-right">
                            <div>{metric.current}</div>
                            <div>Ziel {metric.targetDisplay}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="font-medium">{flow.owner}</div>
                    <p className="text-xs text-muted-foreground mt-1">{flow.instrumentation}</p>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex flex-col gap-2">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${impactStatusBadges[flow.overallStatus].className}`}>
                        {impactStatusBadges[flow.overallStatus].label}
                      </span>
                      {flow.alerts.length > 0 ? (
                        <ul className="text-xs text-red-600 space-y-1 list-disc list-inside">
                          {flow.alerts.map((alert) => (
                            <li key={`${flow.id}-alert-${alert}`}>{alert}</li>
                          ))}
                        </ul>
                      ) : flow.watchList.length > 0 ? (
                        <ul className="text-xs text-amber-600 space-y-1 list-disc list-inside">
                          {flow.watchList.map((item) => (
                            <li key={`${flow.id}-watch-${item}`}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-muted-foreground">Alle Kennzahlen im Zielbereich.</p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Widget Library Dialog */}
      {showWidgetLibrary && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Widget-Bibliothek</CardTitle>
                <CardDescription>Wählen Sie ein Widget aus, um es zu Ihrem Dashboard hinzuzufügen</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowWidgetLibrary(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {widgetLibrary.map((widget) => (
                  <Card 
                    key={widget.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary"
                    onClick={() => addWidget(widget)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl mb-2">{widget.icon}</div>
                      <h3 className="font-medium mb-1">{widget.name}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{widget.category}</p>
                      <div className="text-xs bg-muted rounded px-2 py-1">
                        Größe: {widget.defaultSize.w}x{widget.defaultSize.h}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium mb-2">💡 Tipps & Verfügbare Widget-Typen:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                  <div>
                    <div className="font-medium text-blue-600 mb-1">Tabellen:</div>
                    <ul className="space-y-1">
                      <li>• Projekt-Tabelle (Projektdetails)</li>
                      <li>• Kosten-Tabelle (Kostenkategorien)</li>
                      <li>• Team-Performance (Team-Statistiken)</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium text-green-600 mb-1">Weitere Widgets:</div>
                    <ul className="space-y-1">
                      <li>• Fortschrittsbalken (Projekt-Status)</li>
                      <li>• Benachrichtigungen (Alerts)</li>
                      <li>• Diagramme (Trends & Verteilungen)</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  • Alle Widgets können in der Größe angepasst werden (1-4 Breite)
                  <br />• Tabellen funktionieren am besten mit Breite 3-4
                  <br />• Verwenden Sie den Bearbeitungsmodus für Resize-Kontrollen
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dashboard Stats - Consistent Layout */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dashboard-Statistiken</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4">
              <div className="text-2xl font-bold">{dashboard.widgets.length}</div>
              <div className="text-sm text-muted-foreground">Widgets</div>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl font-bold">{kpis.length}</div>
              <div className="text-sm text-muted-foreground">KPIs</div>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl font-bold">
                {new Date(dashboard.updatedAt).toLocaleDateString('de-DE')}
              </div>
              <div className="text-sm text-muted-foreground">Letzte Aktualisierung</div>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl font-bold">
                {dashboard.isDefault ? 'Standard' : 'Benutzerdefiniert'}
              </div>
              <div className="text-sm text-muted-foreground">Dashboard-Typ</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tutorial Dialog */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>🎓 Dashboard Tutorial</CardTitle>
                <CardDescription>Lernen Sie, wie Sie Ihr Dashboard anpassen können</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowTutorial(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <h4 className="font-medium">Bearbeitungsmodus aktivieren</h4>
                    <p className="text-sm text-muted-foreground">Klicken Sie auf "Bearbeiten" um Widgets hinzuzufügen und zu bearbeiten.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 text-green-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <h4 className="font-medium">Widgets hinzufügen</h4>
                    <p className="text-sm text-muted-foreground">Klicken Sie auf das "Widget hinzufügen" Feld und wählen Sie aus der Widget-Bibliothek.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 text-purple-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <h4 className="font-medium">Widgets anpassen</h4>
                    <p className="text-sm text-muted-foreground">Hover über Widgets im Bearbeitungsmodus um Resize-Kontrollen zu sehen.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-orange-100 text-orange-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
                  <div>
                    <h4 className="font-medium">Design anpassen</h4>
                    <p className="text-sm text-muted-foreground">Verwenden Sie Themes, Presets und die Anpassungsoptionen um das Aussehen zu verändern.</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">💡 Pro-Tipps:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Diagramme wie "Umsatzentwicklung" funktionieren am besten mit voller Breite</li>
                  <li>• Metriken sind optimal in kleineren Größen</li>
                  <li>• Tabellen benötigen mehr Platz für gute Lesbarkeit</li>
                  <li>• Ihre Änderungen werden automatisch gespeichert</li>
                </ul>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">📋 Verfügbare Presets:</h4>
                <div className="grid grid-cols-1 gap-2 text-sm text-green-800">
                  <div><span className="font-medium">💼 Executive:</span> Standard-Dashboard mit 6 wichtigen Widgets</div>
                  <div><span className="font-medium">⚪ Minimal:</span> Reduzierte Ansicht mit 4 Kern-Widgets</div>
                  <div><span className="font-medium">🌈 Farbig:</span> Vollständiges Dashboard mit 9 bunten Widgets</div>
                  <div><span className="font-medium">🕸️ Professionell:</span> Dunkles Theme mit 9 Business-Widgets</div>
                  <div><span className="font-medium">📊 Umfassend:</span> Alle 11 Widget-Typen für komplette Übersicht</div>
                  <div><span className="font-medium">📈 Analytics-Fokus:</span> 9 Widgets speziell für Datenanalyse</div>
                  <div><span className="font-medium">👁️ Übersicht:</span> Ausgewogenes 8-Widget Layout für allgemeine Nutzung</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* KPI Edit Dialog */}
      {editingKPI && kpiEditForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>📈 KPI bearbeiten</CardTitle>
                <CardDescription>Passen Sie die KPI-Einstellungen an</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={cancelKPIEdit}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="kpi-title">Titel</Label>
                <Input
                  id="kpi-title"
                  value={kpiEditForm.title}
                  onChange={(e) => setKpiEditForm(prev => prev ? { ...prev, title: e.target.value } : null)}
                  placeholder="KPI-Name eingeben"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="kpi-value">Wert</Label>
                <Input
                  id="kpi-value"
                  type="number"
                  value={kpiEditForm.value}
                  onChange={(e) => setKpiEditForm(prev => prev ? { ...prev, value: Number(e.target.value) } : null)}
                  placeholder="Wert eingeben"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="kpi-format">Format</Label>
                <Select 
                  value={kpiEditForm.format} 
                  onValueChange={(value) => setKpiEditForm(prev => prev ? { ...prev, format: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="currency">Währung (€)</SelectItem>
                    <SelectItem value="percentage">Prozent (%)</SelectItem>
                    <SelectItem value="number">Zahl</SelectItem>
                    <SelectItem value="duration">Dauer (Tage)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="kpi-trend">Trend</Label>
                <Select 
                  value={kpiEditForm.trend} 
                  onValueChange={(value) => setKpiEditForm(prev => prev ? { ...prev, trend: value as 'up' | 'down' | 'stable' } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="up">↗️ Aufwärtstrend</SelectItem>
                    <SelectItem value="down">↘️ Abwärtstrend</SelectItem>
                    <SelectItem value="stable">→️ Stabil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="kpi-change">Veränderung (%)</Label>
                <Input
                  id="kpi-change"
                  type="number"
                  step="0.1"
                  value={kpiEditForm.changePercent}
                  onChange={(e) => setKpiEditForm(prev => prev ? { ...prev, changePercent: Number(e.target.value) } : null)}
                  placeholder="Veränderung in %"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="kpi-category">Kategorie</Label>
                <Select 
                  value={kpiEditForm.category} 
                  onValueChange={(value) => setKpiEditForm(prev => prev ? { ...prev, category: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="financial">Finanziell</SelectItem>
                    <SelectItem value="project">Projekt</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="customer">Kunde</SelectItem>
                    <SelectItem value="efficiency">Effizienz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={saveKPIChanges} className="flex-1">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Speichern
                </Button>
                <Button variant="outline" onClick={cancelKPIEdit} className="flex-1">
                  Abbrechen
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default AdvancedDashboard;



