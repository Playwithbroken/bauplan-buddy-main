import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

type InsightSeverity = 'info' | 'warning' | 'success' | 'critical';

const severityToIcon: Record<InsightSeverity, typeof Info> = {
  info: Info,
  warning: AlertCircle,
  success: CheckCircle2,
  critical: ShieldAlert,
};

const severityTone: Record<InsightSeverity, string> = {
  info: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-slate-900/60 dark:text-sky-300 dark:border-sky-800',
  warning: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800',
  success: 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-800',
  critical: 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/50 dark:text-rose-200 dark:border-rose-800',
};

export interface InsightBannerProps {
  title: string;
  description?: string;
  severity?: InsightSeverity;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function InsightBanner({
  title,
  description,
  severity = 'info',
  icon,
  actions,
  className,
}: InsightBannerProps) {
  const Icon = severityToIcon[severity];

  return (
    <section
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col gap-4 rounded-xl border p-4 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between',
        severityTone[severity],
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/60 text-current dark:bg-white/5">
          {icon ?? <Icon className="h-4 w-4" aria-hidden="true" />}
        </span>
        <div>
          <p className="font-semibold leading-tight">{title}</p>
          {description ? <p className="mt-1 text-sm leading-snug opacity-80">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </section>
  );
}
