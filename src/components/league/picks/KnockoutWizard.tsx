import { useState } from 'react';
import { Loader2, Lock } from 'lucide-react';
import type { Match } from '@/data/sources/types';
import type { StageKey } from '@/data/league/types';
import { stageDef, stageDeadlineUTC } from '@/logic/leagueStages';
import { formatLocalDateLabel, formatLocalKickoff } from '@/logic/time';
import { TeamChipGrid } from '../TeamChipGrid';
import type { SaveStatus } from './useAutoSavePicks';

/** Single-step knockout pick (pick N advancers) + lock — same auto-save model. */
export function KnockoutWizard({
  stage,
  matches,
  pool,
  selected,
  onToggle,
  onLock,
  locking,
  saveStatus,
  lastSavedAt,
}: {
  stage: StageKey;
  matches: Match[];
  pool: string[];
  selected: string[];
  onToggle: (team: string) => void;
  onLock: () => void;
  locking: boolean;
  saveStatus: SaveStatus;
  lastSavedAt: number | null;
}) {
  const def = stageDef(stage);
  const cap = def.pick;
  const deadline = stageDeadlineUTC(stage, matches);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-slate-50 leading-none">
          {def.label}
        </h2>
        <span className="text-[11px] text-slate-500">
          {saveStatus === 'saving' ? 'Saving…' : lastSavedAt ? 'Saved' : ''}
        </span>
      </div>
      <p className="text-sm text-slate-400">
        Pick the {cap} teams you think advance. {selected.length}/{cap} chosen.
        {deadline && ` Locks ${formatLocalDateLabel(deadline)} · ${formatLocalKickoff(deadline)}.`}
      </p>

      <TeamChipGrid
        teams={pool}
        selected={new Set(selected)}
        onToggle={onToggle}
        tone="positive"
        isDisabledTeam={() => selected.length >= cap}
      />

      {confirming ? (
        <div className="rounded-2xl border border-gold/40 bg-gold/10 p-4">
          <p className="mb-3 text-sm text-slate-200">Once locked, this round's picks can't be changed. Lock now?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onLock}
              disabled={locking}
              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-gold px-5 py-3 font-display text-sm font-bold uppercase tracking-wider text-slate-950 hover:bg-gold/90 active:scale-[0.98] disabled:opacity-60"
            >
              {locking ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Lock className="h-4 w-4" aria-hidden />}
              Lock now
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="cursor-pointer rounded-full border border-slate-700 bg-slate-900 px-5 py-3 font-display text-sm font-semibold uppercase tracking-wide text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="inline-flex cursor-pointer items-center justify-center gap-2 self-start rounded-full border border-slate-700 bg-slate-900 px-4 py-2.5 font-display text-sm font-semibold uppercase tracking-wide text-slate-200 hover:bg-slate-800 active:scale-95"
        >
          <Lock className="h-4 w-4" aria-hidden /> Lock {def.label.toLowerCase()}
        </button>
      )}
    </div>
  );
}
