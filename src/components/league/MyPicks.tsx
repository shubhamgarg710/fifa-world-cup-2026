import { useEffect, useMemo, useState } from 'react';
import { Loader2, Lock, Save, Clock } from 'lucide-react';
import type { Match } from '@/data/sources/types';
import { EMPTY_PICKS, type Member, type Picks, type StageKey } from '@/data/league/types';
import { useSavePicks } from '@/data/league/queries';
import { goldenBallCandidates, goldenBootCandidates } from '@/data/static/awards';
import { teamFlag } from '@/data/static';
import {
  leaguePool,
  stageDeadlineUTC,
  stageDef,
  stagePool,
  stageStatus,
} from '@/logic/leagueStages';
import { pickStatus, type PickStatus } from '@/logic/leagueScore';
import { formatLocalDateLabel, formatLocalKickoff } from '@/logic/time';
import { TeamChipGrid } from './TeamChipGrid';
import { PlayerChipList } from './PlayerChipList';
import { cn } from '../cn';

const ELIMINATE_TARGET = 16; // 48 teams → mark 16 to go home → 32 survivors
const KNOCKOUT_STAGES: StageKey[] = ['reachR16', 'reachQF', 'reachSF', 'reachFinal'];

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
  const preStatus = stageStatus('reachR32', matches, now);
  const save = useSavePicks(code);

  // Draft state. reachR32 is edited via an "eliminated" set (tap who goes home).
  const initialEliminated = () =>
    saved.reachR32.length > 0 ? new Set(pool.filter((t) => !saved.reachR32.includes(t))) : new Set<string>();
  const [eliminated, setEliminated] = useState<Set<string>>(initialEliminated);
  const [winner, setWinner] = useState<string | null>(saved.winner);
  const [boot, setBoot] = useState<string | null>(saved.goldenBoot);
  const [ball, setBall] = useState<string | null>(saved.goldenBall);
  const [ko, setKo] = useState<Record<StageKey, string[]>>({
    reachR32: saved.reachR32,
    reachR16: saved.reachR16,
    reachQF: saved.reachQF,
    reachSF: saved.reachSF,
    reachFinal: saved.reachFinal,
  });
  const [dirty, setDirty] = useState(false);

  // Re-sync draft from saved when it changes and we haven't edited.
  useEffect(() => {
    if (dirty) return;
    setEliminated(initialEliminated());
    setWinner(saved.winner);
    setBoot(saved.goldenBoot);
    setBall(saved.goldenBall);
    setKo({
      reachR32: saved.reachR32,
      reachR16: saved.reachR16,
      reachQF: saved.reachQF,
      reachSF: saved.reachSF,
      reachFinal: saved.reachFinal,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id, saved.winner, saved.goldenBoot, saved.goldenBall, pool.length, JSON.stringify(saved)]);

  if (pool.length === 0) return <p className="text-sm text-slate-400">Schedule not loaded yet.</p>;

  const survivors = pool.filter((t) => !eliminated.has(t));

  const assemble = (): Picks => ({
    ...saved,
    reachR32: preStatus === 'editable' ? survivors : saved.reachR32,
    reachR16: ko.reachR16,
    reachQF: ko.reachQF,
    reachSF: ko.reachSF,
    reachFinal: ko.reachFinal,
    winner: preStatus === 'editable' ? winner : saved.winner,
    goldenBoot: preStatus === 'editable' ? boot : saved.goldenBoot,
    goldenBall: preStatus === 'editable' ? ball : saved.goldenBall,
  });

  const onSave = () => save.mutate({ memberId, picks: assemble() }, { onSuccess: () => setDirty(false) });

  const toggleEliminate = (team: string) => {
    setDirty(true);
    setEliminated((prev) => {
      const next = new Set(prev);
      if (next.has(team)) next.delete(team);
      else if (next.size < ELIMINATE_TARGET) next.add(team);
      return next;
    });
  };

  const toggleKo = (stage: StageKey, team: string) => {
    const cap = stageDef(stage).pick;
    setDirty(true);
    setKo((prev) => {
      const cur = prev[stage];
      const has = cur.includes(team);
      const next = has ? cur.filter((t) => t !== team) : cur.length < cap ? [...cur, team] : cur;
      return { ...prev, [stage]: next };
    });
  };

  return (
    <div className="flex flex-col gap-8">
      {/* ---- Pre-tournament group ---- */}
      {preStatus === 'locked' ? (
        <PreTournamentLocked saved={saved} matches={matches} />
      ) : (
        <PreTournamentEditor
          pool={pool}
          eliminated={eliminated}
          survivors={survivors}
          toggleEliminate={toggleEliminate}
          winner={winner}
          setWinner={(t) => { setDirty(true); setWinner((w) => (w === t ? null : t)); }}
          boot={boot}
          setBoot={(n) => { setDirty(true); setBoot((b) => (b === n ? null : n)); }}
          ball={ball}
          setBall={(n) => { setDirty(true); setBall((b) => (b === n ? null : n)); }}
          deadline={stageDeadlineUTC('reachR32', matches)}
        />
      )}

      {/* ---- Sequential knockout stages ---- */}
      {KNOCKOUT_STAGES.map((stage) => (
        <KnockoutStage
          key={stage}
          stage={stage}
          matches={matches}
          status={stageStatus(stage, matches, now)}
          pool={stagePool(stage, matches)}
          selected={ko[stage]}
          savedPicks={saved[stage]}
          onToggle={(t) => toggleKo(stage, t)}
        />
      ))}

      {/* ---- Sticky save ---- */}
      <div className="sticky bottom-3 z-10">
        <button
          type="button"
          onClick={onSave}
          disabled={save.isPending || !dirty}
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-verdict-must px-5 py-3 font-display text-sm font-bold uppercase tracking-wider text-white shadow-lg transition-colors hover:bg-verdict-must/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
          {dirty ? 'Save picks' : 'Saved'}
        </button>
        {save.isError && <p className="mt-1 text-center text-xs text-verdict-must">Couldn't save — try again.</p>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function PreTournamentEditor(props: {
  pool: string[];
  eliminated: Set<string>;
  survivors: string[];
  toggleEliminate: (t: string) => void;
  winner: string | null;
  setWinner: (t: string) => void;
  boot: string | null;
  setBoot: (n: string) => void;
  ball: string | null;
  setBall: (n: string) => void;
  deadline: string | null;
}) {
  const { pool, eliminated, survivors, toggleEliminate, winner, setWinner, boot, setBoot, ball, setBall, deadline } = props;
  return (
    <div className="flex flex-col gap-6">
      {deadline && (
        <p className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs text-slate-400">
          Pre-tournament picks lock at {formatLocalDateLabel(deadline)} · {formatLocalKickoff(deadline)} (first kickoff)
        </p>
      )}
      <Section title="Group survivors" hint={`Tap the teams you think go home. ${eliminated.size}/${ELIMINATE_TARGET} marked → ${survivors.length} survivors.`}>
        <TeamChipGrid teams={pool} selected={eliminated} onToggle={toggleEliminate} tone="negative" isDisabledTeam={() => eliminated.size >= ELIMINATE_TARGET} />
      </Section>
      <Section title="World Cup winner" hint="Pick one — worth the most points.">
        <TeamChipGrid teams={pool} selected={new Set(winner ? [winner] : [])} onToggle={setWinner} tone="positive" />
      </Section>
      <Section title="Golden Boot" hint="Top scorer of the tournament.">
        <PlayerChipList candidates={goldenBootCandidates} selected={boot} onSelect={setBoot} />
      </Section>
      <Section title="Golden Ball" hint="Best player of the tournament.">
        <PlayerChipList candidates={goldenBallCandidates} selected={ball} onSelect={setBall} />
      </Section>
    </div>
  );
}

function KnockoutStage({
  stage,
  matches,
  status,
  pool,
  selected,
  savedPicks,
  onToggle,
}: {
  stage: StageKey;
  matches: Match[];
  status: 'editable' | 'locked' | 'pending';
  pool: string[];
  selected: string[];
  savedPicks: string[];
  onToggle: (t: string) => void;
}) {
  const def = stageDef(stage);
  const deadline = stageDeadlineUTC(stage, matches);

  if (status === 'pending') {
    return (
      <section className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-4">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold uppercase tracking-wide text-slate-500">
          <Clock className="h-4 w-4" aria-hidden /> {def.label}
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Opens once the {def.poolRound} line-up is confirmed (pick {def.pick} to advance).
        </p>
      </section>
    );
  }

  if (status === 'locked') {
    return (
      <section>
        <h3 className="mb-1 flex items-center gap-2 font-display text-lg font-bold uppercase tracking-wide text-slate-50">
          <Lock className="h-3.5 w-3.5 text-slate-400" aria-hidden /> {def.label}
        </h3>
        {savedPicks.length === 0 ? (
          <p className="text-sm text-slate-500">No picks made for this round.</p>
        ) : (
          <StatusList teams={savedPicks} stage={stage} matches={matches} />
        )}
      </section>
    );
  }

  // editable
  const cap = def.pick;
  return (
    <Section
      title={def.label}
      hint={`Pick the ${cap} teams you think advance. ${selected.length}/${cap} chosen.${deadline ? ` Locks ${formatLocalDateLabel(deadline)} · ${formatLocalKickoff(deadline)}.` : ''}`}
    >
      <TeamChipGrid
        teams={pool}
        selected={new Set(selected)}
        onToggle={onToggle}
        tone="positive"
        isDisabledTeam={() => selected.length >= cap}
      />
    </Section>
  );
}

// ---------------------------------------------------------------------------

const STATUS_STYLE: Record<PickStatus, string> = {
  correct: 'text-verdict-worth',
  busted: 'text-verdict-must line-through',
  alive: 'text-slate-200',
};

function StatusList({ teams, stage, matches }: { teams: string[]; stage: StageKey; matches: Match[] }) {
  return (
    <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
      {teams.map((t) => {
        const status = pickStatus(t, stage, matches);
        return (
          <li key={t} className={cn('flex items-center gap-2 text-sm', STATUS_STYLE[status])}>
            <span aria-hidden>{teamFlag(t)}</span>
            <span className="truncate font-display font-semibold uppercase tracking-wide">{t}</span>
          </li>
        );
      })}
    </ul>
  );
}

function PreTournamentLocked({ saved, matches }: { saved: Picks; matches: Match[] }) {
  return (
    <div className="flex flex-col gap-6">
      <p className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs text-slate-400">
        <Lock className="h-3.5 w-3.5" aria-hidden /> Pre-tournament picks locked.
      </p>
      <section>
        <h3 className="mb-2 font-display text-xl font-bold uppercase tracking-wide text-slate-50">Group survivors</h3>
        {saved.reachR32.length === 0 ? (
          <p className="text-sm text-slate-500">No survivors picked.</p>
        ) : (
          <StatusList teams={saved.reachR32} stage="reachR32" matches={matches} />
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

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="font-display text-xl font-bold uppercase tracking-wide text-slate-50">{title}</h3>
      {hint && <p className="mb-3 text-xs text-slate-400">{hint}</p>}
      {children}
    </section>
  );
}
