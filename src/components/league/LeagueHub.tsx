import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { leagueEnabled } from '@/data/supabase';
import { useMyLeagues } from '@/state/leagueIdentity';
import { LeagueShell } from './LeagueShell';
import { CreateLeague } from './CreateLeague';
import { JoinByCode } from './JoinByCode';
import { NotConfigured } from './NotConfigured';

export function LeagueHub() {
  if (!leagueEnabled) return <NotConfigured />;
  const leagues = useMyLeagues();
  return (
    <LeagueShell title="Leagues" subtitle="Predict with friends">
      <div className="flex flex-col gap-4">
        {leagues.length > 0 && (
          <section>
            <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-widest text-slate-400">
              Your leagues
            </h2>
            <ul className="flex flex-col gap-2">
              {leagues.map((l) => (
                <li key={l.code}>
                  <Link
                    to={`/l/${l.code}`}
                    className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 transition-colors hover:bg-slate-900"
                  >
                    <div>
                      <span className="font-display text-lg font-bold uppercase tracking-wide text-slate-50">
                        {l.code}
                      </span>
                      <p className="text-xs text-slate-400">Playing as {l.displayName}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-500" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        <CreateLeague />
        <JoinByCode />
      </div>
    </LeagueShell>
  );
}
