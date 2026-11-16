/**
 * Shared building blocks for the signed-in app, in the "Bakery" design language.
 */

import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Loader2 } from 'lucide-react';

export function PageHeader({ eyebrow, title, subtitle, actions }: { eyebrow?: string; title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 max-w-3xl">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="display mt-2 text-[2.6rem] sm:text-[3.4rem]">{title}</h1>
        {subtitle && <p className="mt-3 text-ink-2 leading-relaxed">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Card({ children, className = '', tone }: { children: ReactNode; className?: string; tone?: 'pink' | 'lime' | 'butter' | 'lavender' | 'sky' | 'peach' | 'ink' }) {
  const toneClass = tone ? (tone === 'ink' ? 'bg-ink text-paper border-transparent' : `bg-${tone} border-transparent`) : '';
  return <section className={`paper-card p-5 sm:p-6 ${toneClass} ${className}`}>{children}</section>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="display text-2xl sm:text-[1.9rem]">{children}</h2>
      {action}
    </div>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: 'pink' | 'lime' | 'butter' | 'lavender' | 'sky' | 'peach' }) {
  return (
    <div className={`rounded-[1.25rem] p-4 ${tone ? `bg-${tone}` : 'bg-surface border border-line'}`}>
      <p className="eyebrow !text-ink-2">{label}</p>
      <p className="display mt-1 text-[2.1rem] normal-case tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-sm text-ink-2">{hint}</p>}
    </div>
  );
}

export function Bar({ value, max = 100, tone = 'brand', className = '', label }: { value: number; max?: number; tone?: string; className?: string; label?: string }) {
  const pct = Math.max(0, Math.min(100, max ? (value / max) * 100 : 0));
  return (
    <div className={`h-2.5 overflow-hidden rounded-full bg-paper-2 ${className}`} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={`h-full rounded-full bg-${tone} transition-[width] duration-700 [transition-timing-function:var(--ease-fluid)]`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Loading({ label = 'Đang tải…' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-3 text-ink-2" role="status">
      <Loader2 className="h-5 w-5 animate-spin" /> {label}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--quiz-red-border)] bg-[#FFF3F1] px-4 py-3 text-sm font-semibold text-[var(--quiz-red-button)]">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="rounded-full bg-surface px-3 py-1 text-ink hover:bg-paper-2">
          Thử lại
        </button>
      )}
    </div>
  );
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-line-strong bg-surface/60 px-6 py-12 text-center">
      <p className="display text-2xl">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-ink-2">{children}</div>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Pill({ children, tone = 'paper', className = '' }: { children: ReactNode; tone?: string; className?: string }) {
  return <span className={`inline-flex items-center gap-1 rounded-full bg-${tone} px-2.5 py-1 text-xs font-bold text-ink ${className}`}>{children}</span>;
}

/** Internal link or button styled as a primary action. */
export function ActionLink({ to, children, variant = 'ink', className = '' }: { to: string; children: ReactNode; variant?: 'ink' | 'ghost' | 'lime' | 'cream'; className?: string }) {
  return (
    <Link to={to} className={`btn-${variant} ${className}`}>
      {children}
    </Link>
  );
}

/** Coloured percentage for accuracy-type numbers. */
export function scoreTone(pct: number | null | undefined) {
  if (pct === null || pct === undefined) return 'paper-2';
  if (pct >= 80) return 'lime';
  if (pct >= 50) return 'butter';
  return 'pink';
}

