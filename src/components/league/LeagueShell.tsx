import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/** Shared phone-first frame for league screens: back-to-Watch header + body. */
export function LeagueShell({
  title,
  subtitle,
  right,
  onBack,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onBack?: () => void;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <main className="min-h-dvh safe-bottom">
      <div className="mx-auto max-w-2xl px-4 pb-12">
        <header className="safe-top sticky top-0 z-10 -mx-4 mb-4 flex items-center justify-between gap-3 border-b border-slate-900 bg-slate-950/85 px-4 py-3 backdrop-blur">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => (onBack ? onBack() : navigate('/'))}
              className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-300 transition-colors hover:bg-slate-800 active:scale-95"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden />
            </button>
            <div className="min-w-0">
              <h1 className="truncate font-display text-2xl font-bold uppercase tracking-wider text-slate-50 leading-none">
                {title}
              </h1>
              {subtitle && <p className="truncate text-[11px] text-slate-400">{subtitle}</p>}
            </div>
          </div>
          {right}
        </header>
        {children}
      </div>
    </main>
  );
}
