import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Sticker, Wordmark } from '../landing/primitives';
import { AuthIllustration } from './AuthIllustration';

interface AuthLayoutProps {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Split auth screen: pastel brand panel on the left (desktop only),
 * form column on cream on the right.
 */
export function AuthLayout({ eyebrow, title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-0">
      {/* Brand panel */}
      <aside className="relative m-3 hidden h-[calc(100vh-1.5rem)] flex-col gap-6 self-start overflow-hidden rounded-[2.25rem] bg-pink p-10 text-ink lg:sticky lg:top-3 lg:flex xl:p-12">
        <Link to="/" className="relative z-10 text-[2rem] leading-none" aria-label="QuizMe — trang chủ">
          <Wordmark />
        </Link>

        {/* Study-desk scene: shrinks to whatever height the panel has left. */}
        <div className="relative z-10 flex min-h-[180px] flex-1 items-center justify-center">
          <AuthIllustration className="h-full max-h-[460px] w-full" />
        </div>

        <div className="relative z-10 max-w-lg">
          <Sticker color="var(--butter)" className="-rotate-3">Triết lý QuizMe</Sticker>
          <p className="display mt-5 text-[2.5rem] !leading-[1.04] xl:text-[3rem] [@media(max-height:820px)]:text-[2.25rem]">
            Mỗi lỗi sai là một bài học, <span className="rounded-[0.15em] bg-surface px-[0.12em] [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">nếu bạn quay lại</span> đúng lúc
          </p>
        </div>

        <ul className="relative z-10 grid grid-cols-3 gap-3 [@media(max-height:820px)]:hidden">
          {[
            ['20', 'lỗi trọng tâm mỗi tuần', 'var(--surface)'],
            ['5′', 'thử thách mỗi ngày', 'var(--lime)'],
            ['SM-2', 'lịch ôn thông minh', 'var(--sky)'],
          ].map(([v, l, bg]) => (
            <li key={l} className="rounded-[1.25rem] px-4 py-3" style={{ background: bg }}>
              <p className="display text-3xl">{v}</p>
              <p className="mt-1 text-[0.8rem] font-semibold leading-snug text-ink">{l}</p>
            </li>
          ))}
        </ul>
      </aside>

      {/* Form column */}
      <main className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-[1.75rem] leading-none lg:hidden" aria-label="QuizMe — trang chủ">
            <Wordmark />
          </Link>
          <Link
            to="/"
            className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold text-ink-2 transition-colors hover:bg-ink/5 hover:text-ink active:bg-ink/10"
          >
            <ArrowLeft className="h-4 w-4" /> Trang chủ
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-12">
          <Sticker className="self-start">{eyebrow}</Sticker>
          <h1 className="display mt-5 text-[3rem] sm:text-[3.75rem]">{title}</h1>
          {subtitle && <p className="mt-4 text-ink-2 leading-relaxed">{subtitle}</p>}
          <div className="mt-10">{children}</div>
          {footer && <div className="mt-8 text-sm text-ink-2">{footer}</div>}
        </div>
      </main>
    </div>
  );
}

/** Labelled text field matching the editorial style. */
export function AuthField({
  id,
  label,
  hint,
  ...input
}: { id: string; label: string; hint?: ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-bold text-ink">
          {label}
        </label>
        {hint}
      </div>
      <input
        id={id}
        {...input}
        className="h-[3.25rem] w-full rounded-2xl border-[1.5px] border-line bg-surface px-4 text-base text-ink placeholder:text-ink-3 outline-none transition-[border-color,box-shadow] duration-200 focus:border-ink focus:ring-4 focus:ring-[var(--butter)] disabled:opacity-60"
      />
    </div>
  );
}

export function AuthError({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="rounded-2xl border border-[var(--signal-200)] bg-[var(--signal-50)] px-4 py-3 text-sm font-semibold text-[var(--signal-700)]">
      {children}
    </div>
  );
}
