import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { LEAGUE_SCORING } from '@/logic/leagueConfig';
import { cn } from '../cn';

/** Transparent breakdown of how points are earned — sourced from LEAGUE_SCORING. */
const ROWS: { label: string; detail: string }[] = [
  { label: 'Group survivors', detail: `${LEAGUE_SCORING.reachR32} pts each — only if you pick a full set of 32` },
  { label: 'Reach Round of 16', detail: `${LEAGUE_SCORING.reachR16} pts each` },
  { label: 'Reach Quarter-finals', detail: `${LEAGUE_SCORING.reachQF} pts each` },
  { label: 'Reach Semi-finals', detail: `${LEAGUE_SCORING.reachSF} pts each` },
  { label: 'Reach Final', detail: `${LEAGUE_SCORING.reachFinal} pts each` },
  { label: 'World Cup winner', detail: `${LEAGUE_SCORING.winner} pts` },
  { label: 'Golden Boot', detail: `${LEAGUE_SCORING.goldenBoot} pts` },
  { label: 'Golden Ball', detail: `${LEAGUE_SCORING.goldenBall} pts` },
];

export function ScoringInfo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 transition-colors hover:bg-slate-900"
      >
        <span className="inline-flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-slate-200">
          <HelpCircle className="h-4 w-4 text-slate-400" aria-hidden />
          How scoring works
        </span>
        <ChevronDown className={cn('h-4 w-4 text-slate-500 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div className="border-t border-slate-800 px-4 py-3">
          <ul className="flex flex-col gap-1.5">
            {ROWS.map((r) => (
              <li key={r.label} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-slate-300">{r.label}</span>
                <span className="shrink-0 text-right text-xs text-slate-400">{r.detail}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            Deeper rounds are worth more, so a great knockout run can outscore a strong group stage.
            Ties break by who has more deep-round hits, then who joined the league first.
          </p>
        </div>
      )}
    </div>
  );
}
