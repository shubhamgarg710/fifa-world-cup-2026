import type { Match } from '@/data/sources/types';
import type { Member, Picks, StageKey } from '@/data/league/types';
import { teamFlag } from '@/data/static';
import { stageDef, stageLocked, STAGE_DEFS } from '@/logic/leagueStages';

/**
 * Picks become visible to everyone only after a stage's deadline (P0.6).
 * Before that, this panel shows nothing for the stage — privacy is gated by
 * the same deadline that locks editing.
 */
export function RevealPanel({ members, matches }: { members: Member[]; matches: Match[] }) {
  const now = new Date();
  const revealedStages = STAGE_DEFS.filter((d) => stageLocked(d.key, matches, now));

  if (members.length === 0) {
    return <p className="text-sm text-slate-400">No members yet.</p>;
  }

  if (revealedStages.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-4 text-center text-sm text-slate-400">
        Everyone's picks are hidden until each round's deadline passes. Nothing revealed yet — no
        peeking before the whistle.
      </p>
    );
  }

  const outrightsRevealed = stageLocked('reachR32', matches, now);

  return (
    <div className="flex flex-col gap-6">
      {outrightsRevealed && (
        <section>
          <h3 className="mb-2 font-display text-lg font-bold uppercase tracking-wide text-slate-50">
            Outrights
          </h3>
          <div className="flex flex-col gap-2">
            {members.map((m) => (
              <div key={m.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <p className="mb-1 font-display text-sm font-semibold uppercase tracking-wide text-slate-300">
                  {m.display_name}
                </p>
                <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-200">
                  <span><span className="text-slate-500">Winner:</span> {m.picks.winner ?? '—'}</span>
                  <span><span className="text-slate-500">Boot:</span> {m.picks.goldenBoot ?? '—'}</span>
                  <span><span className="text-slate-500">Ball:</span> {m.picks.goldenBall ?? '—'}</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
      {revealedStages.map((def) => (
        <section key={def.key}>
          <h3 className="mb-2 font-display text-lg font-bold uppercase tracking-wide text-slate-50">
            {def.label}
          </h3>
          <div className="flex flex-col gap-2">
            {members.map((m) => (
              <MemberPicksRow key={m.id} member={m} stage={def.key} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function MemberPicksRow({ member, stage }: { member: Member; stage: StageKey }) {
  const picks = member.picks;
  const value = stageValue(picks, stage);
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
      <p className="mb-1 font-display text-sm font-semibold uppercase tracking-wide text-slate-300">
        {member.display_name}
      </p>
      {value.length === 0 ? (
        <p className="text-xs text-slate-500">No pick.</p>
      ) : (
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-200">
          {value.map((t) => (
            <span key={t} className="inline-flex items-center gap-1">
              <span aria-hidden>{teamFlag(t)}</span>
              {t}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

function stageValue(picks: Picks, stage: StageKey): string[] {
  void stageDef(stage); // validates the key
  return picks[stage] ?? [];
}
