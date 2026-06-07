import { formatLocalKickoff, relativeCountdown } from '@/logic/time';
import { prematchWatchability, type MyTeams, myTeamsList } from '@/logic/verdict';
import { teamRank } from '@/data/static';
import { isPlaceholderTeam } from '@/data/static/placeholders';
import type { Match } from '@/data/sources/types';
import { TeamRow } from './TeamRow';
import { WatchabilityBadge } from './WatchabilityBadge';
import { cn } from './cn';

export function FixtureCard({ match, myTeams }: { match: Match; myTeams: MyTeams }) {
  const watch = prematchWatchability(match, myTeams, teamRank);
  const countdown = relativeCountdown(match.kickoffUTC);
  const kickoff = formatLocalKickoff(match.kickoffUTC);
  const hasPlaceholder = isPlaceholderTeam(match.team1) || isPlaceholderTeam(match.team2);
  const mineSet = new Set(myTeamsList(myTeams));
  const t1Mine = !hasPlaceholder && mineSet.has(match.team1);
  const t2Mine = !hasPlaceholder && mineSet.has(match.team2);
  const isMine = t1Mine || t2Mine;
  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-slate-900/60 p-4 transition-colors',
        isMine ? 'border-gold/40 bg-gradient-to-br from-gold/5 to-transparent' : 'border-slate-800',
      )}
      aria-label={
        hasPlaceholder
          ? `${match.round}: teams to be determined after group stage`
          : undefined
      }
    >
      {isMine && (
        <span
          aria-hidden
          className="absolute left-0 top-0 h-full w-1 bg-gold"
        />
      )}
      <header className="mb-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-display font-semibold uppercase tracking-wider text-slate-400">
            {match.round}
            {match.group && ` · ${match.group}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {countdown && (
            <span className="text-slate-400">{countdown}</span>
          )}
          <span className="nums font-display font-bold text-slate-100">{kickoff}</span>
        </div>
      </header>
      <div>
        <TeamRow name={match.team1} highlight={t1Mine} />
        <TeamRow name={match.team2} highlight={t2Mine} />
      </div>
      <footer className="mt-2 flex items-center justify-between gap-2">
        <WatchabilityBadge tier={watch.tier} reasons={watch.reasons} />
        <span className="text-[11px] text-slate-500">{match.ground}</span>
      </footer>
    </article>
  );
}
