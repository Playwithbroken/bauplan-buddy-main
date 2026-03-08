import type { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

type KpiTone = 'default' | 'positive' | 'warning' | 'negative';

type Direction = 'up' | 'down' | 'flat';

export interface KpiDelta {
  value: string;
  direction?: Direction;
  srLabel?: string;
}

export interface KpiCardProps {
  label: string;
  value: string | number;
  helperText?: string;
  icon?: ReactNode;
  tone?: KpiTone;
  delta?: KpiDelta;
  className?: string;
  children?: ReactNode;
}

const toneClasses: Record<KpiTone, string> = {
  default: 'from-card to-card/70 dark:from-slate-950 dark:to-slate-900',
  positive: 'from-emerald-500/10 to-emerald-500/5 dark:from-emerald-500/15 dark:to-emerald-400/10',
  warning: 'from-amber-500/10 to-amber-500/5 dark:from-amber-500/20 dark:to-amber-400/15',
  negative: 'from-rose-500/10 to-rose-500/5 dark:from-rose-500/20 dark:to-rose-400/15',
};

const deltaColor: Record<Direction, string> = {
  up: 'text-emerald-500 dark:text-emerald-400',
  down: 'text-rose-500 dark:text-rose-400',
  flat: 'text-muted-foreground',
};

export function KpiCard({
  label,
  value,
  helperText,
  icon,
  tone = 'default',
  delta,
  className,
  children,
}: KpiCardProps) {
  const direction: Direction = delta?.direction ?? 'up';
  const Icon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus;

  return (
    <article
      role="group"
      aria-label={label}
      className={cn(
        'flex flex-col justify-between rounded-xl border border-border bg-gradient-to-br p-5 shadow-sm transition-shadow duration-200 hover:shadow-md focus-within:shadow-md',
        toneClasses[tone],
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
        </div>
        {icon ? <div className="text-muted-foreground">{icon}</div> : null}
      </header>
      <div className="mt-6 flex flex-wrap items-center gap-3 text-xs">
        {helperText ? <p className="text-muted-foreground">{helperText}</p> : null}
        {delta ? (
          <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium', deltaColor[direction])}>
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {delta.value}
            {delta.srLabel ? <span className="sr-only">{delta.srLabel}</span> : null}
          </span>
        ) : null}
      </div>
      {children ? <div className="mt-4 text-sm text-muted-foreground">{children}</div> : null}
    </article>
  );
}
