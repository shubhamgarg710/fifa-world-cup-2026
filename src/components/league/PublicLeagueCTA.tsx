import { Link, useNavigate } from 'react-router-dom';
import { Globe, ChevronRight } from 'lucide-react';
import { leagueEnabled } from '@/data/supabase';
import { PUBLIC_LEAGUE_CODE } from '@/data/league/constants';
import { useMemberCount } from '@/data/league/queries';
import { useLeagueIdentity } from '@/state/leagueIdentity';

/** Pinned, discoverable global league. Hidden when no backend is configured. */
export function PublicLeagueCTA() {
  if (!leagueEnabled) return null;
  const navigate = useNavigate();
  const identity = useLeagueIdentity(PUBLIC_LEAGUE_CODE);
  const count = useMemberCount(PUBLIC_LEAGUE_CODE);

  // Already a member → quiet link.
  if (identity) {
    return (
      <Link
        to={`/l/${PUBLIC_LEAGUE_CODE}`}
        className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 transition-colors hover:text-slate-200"
      >
        <Globe className="h-3.5 w-3.5" aria-hidden />
        Public league · view
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => navigate(`/l/${PUBLIC_LEAGUE_CODE}`)}
      className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/10 to-transparent px-4 py-3 text-left transition-colors hover:from-gold/15 active:scale-[0.99]"
    >
      <Globe className="h-6 w-6 shrink-0 text-gold" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-display text-base font-bold uppercase tracking-wide text-slate-50">
          Just want to play? Join the public league.
        </p>
        {count.data != null && count.data > 0 && (
          <p className="text-xs text-slate-400">
            {count.data} {count.data === 1 ? 'member' : 'members'} and counting
          </p>
        )}
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-slate-500" aria-hidden />
    </button>
  );
}
