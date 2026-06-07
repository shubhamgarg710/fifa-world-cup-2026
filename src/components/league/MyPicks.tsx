import { useEffect, useMemo, useState } from 'react';
import { Loader2, Lock, Save } from 'lucide-react';
import type { Match } from '@/data/sources/types';
import { EMPTY_PICKS, type Member, type Picks } from '@/data/league/types';
import { useSavePicks } from '@/data/league/queries';
import { goldenBallCandidates, goldenBootCandidates } from '@/data/static/awards';
import { teamFlag } from '@/data/static';
import { leaguePool, stageDeadlineUTC, stageLocked } from '@/logic/leagueStages';
import { pickStatus, type PickStatus } from '@/logic/leagueScore';
import { formatLocalDateLabel, formatLocalKickoff } from '@/logic/time';
import { TeamChipGrid } from './TeamChipGrid';
import { PlayerChipList } from './PlayerChipList';
import { cn } from '../cn';

const ELIMINATE_TARGET = 16; // 48 teams → mark 16 to go home → 32 survivors

export function MyPicks({
  code,
  memberId,
  members,
  matches,
}: {
  code: string;
  memberId: string;
  members: Member[];
  matches: Match[];
}) {
  const me = members.find((m) => m.id === memberId);
  const saved: Picks = me?.picks ?? EMPTY_PICKS;
  const pool = useMemo(() => leaguePool(matches), [matches]);
  const now = new Date();
  const deadline = stageDeadlineUTC('reachR32', matches);
  const locked = stageLocked('reachR32', matches, now);

  const save = useSavePicks(code);

  // Local draft. `eliminated` = teams marked to go home; survivors = pool − eliminated.
  const initialEliminated = () =>
    saved.reachR32.length > 0 ? new Set(pool.filter((t) => !saved.reachR32.includes(t))) : new Set<string>();
  const [eliminated, setEliminated] = useState<Set<string>>(initialEliminated);
  const [winner, setWinner] = useState<string | null>(saved.winner);
  const [boot, setBoot] = useState<string | null>(saved.goldenBoot);
  const [ball, setBall] = useState<string | null>(saved.goldenBall);
  const [dirty, setDirty] = useState(false);

  // Re-sync the draft if the saved picks arrive/refresh and we haven't edited.
  useEffect(() => {
    if (dirty) return;
    setEliminated(initialEliminated());
    setWinner(saved.winner);
    setBoot(saved.goldenBoot);
    setBall(saved.goldenBall);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id, saved.winner, saved.goldenBoot, saved.goldenBall, pool.length]);

  if (pool.length === 0) {
    return <p className="text-sm text-slate-400">Schedule not loaded yet.</p>;
  }

  const survivors = pool.filter((t) => !eliminated.has(t));

  if (locked) {
    return <LockedView saved={saved} matches={matches} deadline={deadline} />;
  }

  const toggleEliminate = (team: string) => {
    setDirty(true);
    setEliminated((prev) => {
      const next = new Set(prev);
      if (next.has(team)) next.delete(team);
      else if (next.size < ELIMINATE_TARGET) next.add(team);
      return next;
    });
  };

  const onSave = () => {
    const picks: Picks = {
      ...saved,
      reachR32: survivors,
      winner,
      goldenBoot: boot,
      goldenBall: ball,
    };
    save.mutate(
      { memberId, picks },
      { onSuccess: () => setDirty(false) },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {deadline && (
        <p className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs text-slate-400">
          Picks lock at {formatLocalDateLabel(deadline)} · {formatLocalKickoff(deadline)} (first kickoff)
        </p>
      )}

      <Section
        title="Group survivors"
        hint={`Tap the teams you think go home. ${eliminated.size}/${ELIMINATE_TARGET} marked → ${survivors.length} survivors.`}
      >
        <TeamChipGrid
          teams={pool}
          selected={eliminated}
          onToggle={toggleEliminate}
          tone="negative"
          isDisabledTeam={() => eliminated.size >= ELIMINATE_TARGET}
        />
      </Section>

      <Section title="World Cup winner" hint="Pick one — worth the most points.">
        <TeamChipGrid
          teams={pool}
          selected={new Set(winner ? [winner] : [])}
          onToggle={(t) => {
            setDirty(true);
            setWinner((w) => (w === t ? null : t));
          }}
          tone="positive"
        />
      </Section>

      <Section title="Golden Boot" hint="Top scorer of the tournament.">
        <PlayerChipList
          candidates={goldenBootCandidates}
          selected={boot}
          onSelect={(n) => {
            setDirty(true);
            setBoot((b) => (b === n ? null : n));
          }}
        />
      </Section>

      <Section title="Golden Ball" hint="Best player of the tournament.">
        <PlayerChipList
          candidates={goldenBallCandidates}
          selected={ball}
          onSelect={(n) => {
            setDirty(true);
            setBall((b) => (b === n ? null : n));
          }}
        />
      </Section>

      <div className="sticky bottom-3 z-10">
        <button
          type="button"
          onClick={onSave}
          disabled={save.isPending || !dirty}
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-verdict-must px-5 py-3 font-display text-sm font-bold uppercase tracking-wider text-white shadow-lg transition-colors hover:bg-verdict-must/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {save.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Save className="h-4 w-4" aria-hidden />
          )}
          {dirty ? 'Save picks' : 'Saved'}
        </button>
        {save.isError && <p className="mt-1 text-center text-xs text-verdict-must">Couldn't save — try again.</p>}
      </div>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="font-display text-xl font-bold uppercase tracking-wide text-slate-50">{title}</h3>
      {hint && <p className="mb-3 text-xs text-slate-400">{hint}</p>}
      {children}
    </section>
  );
}

const STATUS_STYLE: Record<PickStatus, string> = {
  correct: 'text-verdict-worth',
  busted: 'text-verdict-must line-through',
  alive: 'text-slate-200',
};

function LockedView({ saved, matches, deadline }: { saved: Picks; matches: Match[]; deadline: string | null }) {
  return (
    <div className="flex flex-col gap-6">
      <p className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs text-slate-400">
        <Lock className="h-3.5 w-3.5" aria-hidden />
        Picks locked{deadline ? ` since ${formatLocalDateLabel(deadline)}` : ''}.
      </p>

      <section>
        <h3 className="mb-2 font-display text-xl font-bold uppercase tracking-wide text-slate-50">
          Group survivors
        </h3>
        {saved.reachR32.length === 0 ? (
          <p className="text-sm text-slate-500">No survivors picked.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {saved.reachR32.map((t) => {
              const status = pickStatus(t, 'reachR32', matches);
              return (
                <li key={t} className={cn('flex items-center gap-2 text-sm', STATUS_STYLE[status])}>
                  <span aria-hidden>{teamFlag(t)}</span>
                  <span className="truncate font-display font-semibold uppercase tracking-wide">{t}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <LockedLine label="Winner" value={saved.winner} flag />
      <LockedLine label="Golden Boot" value={saved.goldenBoot} />
      <LockedLine label="Golden Ball" value={saved.goldenBall} />
    </div>
  );
}

function LockedLine({ label, value, flag }: { label: string; value: string | null; flag?: boolean }) {
  return (
    <section>
      <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-slate-400">{label}</h3>
      <p className="mt-0.5 font-display text-lg font-semibold uppercase tracking-wide text-slate-100">
        {value ? (
          <>
            {flag && <span className="mr-2" aria-hidden>{teamFlag(value)}</span>}
            {value}
          </>
        ) : (
          <span className="text-slate-600">—</span>
        )}
      </p>
    </section>
  );
}
