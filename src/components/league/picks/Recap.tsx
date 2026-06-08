import type { Match } from '@/data/sources/types';
import type { Picks } from '@/data/league/types';
import { teamFlag } from '@/data/static';
import type { Group } from '@/logic/groups';
import { pickStatus } from '@/logic/leagueScore';
import { cn } from '../../cn';

const NOT_PICKED = <span className="text-xs text-slate-500">Not picked — 0 points</span>;

/** "Going home" grouped by group; 2-elim groups flagged. Optional live status. */
export function SurvivorsRecap({
  picks,
  groups,
  matches,
  showStatus,
}: {
  picks: Picks;
  groups: Group[];
  matches: Match[];
  showStatus?: boolean;
}) {
  if (picks.reachR32.length === 0) return <div>{NOT_PICKED}</div>;
  const survivors = new Set(picks.reachR32);
  const rows = groups
    .map((g) => ({ name: g.name, out: g.teams.filter((t) => !survivors.has(t)) }))
    .filter((r) => r.out.length > 0);

  return (
    <ul className="flex flex-col gap-1.5">
      {rows.map((r) => (
        <li key={r.name} className="flex items-baseline justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{r.name}</span>
          <span className="flex flex-1 flex-wrap justify-end gap-x-3 gap-y-0.5 text-sm">
            {r.out.map((t) => {
              const cls = showStatus
                ? pickStatus(t, 'reachR32', matches) === 'busted'
                  ? 'text-verdict-worth' // correctly sent home
                  : 'text-verdict-must line-through'
                : 'text-verdict-must line-through';
              return (
                <span key={t} className={cls}>
                  <span className="mr-1" aria-hidden>{teamFlag(t)}</span>{t}
                </span>
              );
            })}
            {r.out.length === 2 && (
              <span className="rounded bg-slate-800 px-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">2 out</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ValueLine({ value, flag }: { value: string | null; flag?: boolean }) {
  if (!value) return <>{NOT_PICKED}</>;
  return (
    <span className="font-display text-base font-semibold uppercase tracking-wide text-slate-100">
      {flag && <span className="mr-2" aria-hidden>{teamFlag(value)}</span>}
      {value}
    </span>
  );
}

/** A labelled recap section with an optional edit pencil. */
export function RecapSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-slate-400">{title}</h3>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className={cn(
              'cursor-pointer text-[11px] font-semibold uppercase tracking-wide text-verdict-worth transition-colors hover:text-verdict-worth/80',
            )}
          >
            Edit
          </button>
        )}
      </div>
      {children}
    </section>
  );
}
