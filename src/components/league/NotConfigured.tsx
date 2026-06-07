import { CloudOff } from 'lucide-react';
import { LeagueShell } from './LeagueShell';

/** Shown when the Supabase backend isn't configured (no VITE_SUPABASE_* env). */
export function NotConfigured() {
  return (
    <LeagueShell title="Leagues">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center">
        <CloudOff className="mx-auto mb-2 h-7 w-7 text-slate-500" aria-hidden />
        <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-slate-100">
          Leagues not set up
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          This build has no league backend configured. The "what to watch" experience works
          fully without it.
        </p>
      </div>
    </LeagueShell>
  );
}
