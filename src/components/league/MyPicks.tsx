import { useEffect, useMemo, useState } from 'react';
import { Clock, Lock } from 'lucide-react';
import { track } from '@vercel/analytics';
import type { Match } from '@/data/sources/types';
import { EMPTY_PICKS, type Member, type Picks, type StageKey } from '@/data/league/types';
import { useSavePicks } from '@/data/league/queries';
import { filterCandidatesToPool, goldenBallCandidates, goldenBootCandidates } from '@/data/static/awards';
import { teamFlag } from '@/data/static';
import { deriveGroups } from '@/logic/groups';
import { leaguePool, stageDeadlineUTC, stageDef, stageStatus } from '@/logic/leagueStages';
import { pickStatus, type PickStatus } from '@/logic/leagueScore';
import {
  ELIMINATE_TARGET,
  eliminatedFromSaved,
  groupAtMax,
  survivorsToReachR32,
} from '@/logic/survivors';
import { PreTournamentWizard } from './picks/PreTournamentWizard';
import { KnockoutWizard } from './picks/KnockoutWizard';
import { LockedSummary } from './picks/LockedSummary';
import { useAutoSavePicks } from './picks/useAutoSavePicks';
import { cn } from '../cn';

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
  const groups = useMemo(() => deriveGroups(matches), [matches]);
  const bootCandidates = useMemo(() => filterCandidatesToPool(goldenBootCandidates, pool), [pool]);
  const ballCandidates = useMemo(() => filterCandidatesToPool(goldenBallCandidates, pool), [pool]);

  // Live clock so the screen flips to read-only the moment a deadline passes.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const preStatus = stageStatus('reachR32', matches, now);
  const preDeadline = stageDeadlineUTC('reachR32', matches);
  const preManualLocked = saved.lockedStages.includes('reachR32');
  const preDeadlinePassed = preStatus === 'locked';
  const preLocked = preDeadlinePassed || preManualLocked;
  const save = useSavePicks(code);

  // Draft state, hydrated from saved.
  const [eliminated, setEliminated] = useState<Set<string>>(() => eliminatedFromSaved(saved.reachR32, pool));
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

  // Re-hydrate from saved when it changes and we haven't started editing.
  useEffect(() => {
    if (dirty) return;
    setEliminated(eliminatedFromSaved(saved.reachR32, pool));
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
  }, [me?.id, pool.length, JSON.stringify(saved)]);

  const survivors = survivorsToReachR32(eliminated, pool);

  // Lock-aware assembled picks: frozen stages (deadline passed / manually
  // locked) always keep their saved value; never overwrite a locked stage.
  const buildPicks = (lockStage?: StageKey): Picks => {
    const t = new Date();
    const frozen = (s: StageKey) =>
      stageStatus(s, matches, t) === 'locked' || saved.lockedStages.includes(s);
    return {
      ...saved,
      reachR32: frozen('reachR32') ? saved.reachR32 : survivors,
      reachR16: frozen('reachR16') ? saved.reachR16 : ko.reachR16,
      reachQF: frozen('reachQF') ? saved.reachQF : ko.reachQF,
      reachSF: frozen('reachSF') ? saved.reachSF : ko.reachSF,
      reachFinal: frozen('reachFinal') ? saved.reachFinal : ko.reachFinal,
      winner: frozen('reachR32') ? saved.winner : winner,
      goldenBoot: frozen('reachR32') ? saved.goldenBoot : boot,
      goldenBall: frozen('reachR32') ? saved.goldenBall : ball,
      lockedStages: [...new Set([...saved.lockedStages, ...(lockStage ? [lockStage] : [])])],
    };
  };

  // Auto-save the (lock-aware) draft, debounced.
  const autoPicks = buildPicks();
  const { status: saveStatus, lastSavedAt } = useAutoSavePicks(code, memberId, autoPicks, saved);

  const lockStage = (stage: StageKey) =>
    save.mutate(
      { memberId, picks: buildPicks(stage) },
      {
        onSuccess: () => {
          setDirty(false);
          track('picks_locked', { stage });
        },
      },
    );

  // reachR32 edit: 1–2 per group, ≤16 total. Toggling off always allowed.
  const toggleEliminate = (team: string) => {
    setDirty(true);
    setEliminated((prev) => {
      const next = new Set(prev);
      if (next.has(team)) {
        next.delete(team);
        return next;
      }
      const group = groups.find((g) => g.teams.includes(team));
      if (!group) return next;
      if (next.size >= ELIMINATE_TARGET) return next; // global cap
      if (groupAtMax(next, group)) return next; // per-group cap
      next.add(team);
      return next;
    });
  };

  // Matchwise pick: choose `team` to advance over its tie's `sibling`. Drop both
  // sides of the tie first, then (re)add `team` unless it was already picked
  // (tap-again clears the tie). One winner per tie.
  const pickKo = (stage: StageKey, team: string, sibling: string) => {
    setDirty(true);
    setKo((prev) => {
      const cur = prev[stage];
      const wasPicked = cur.includes(team);
      const without = cur.filter((t) => t !== team && t !== sibling);
      return { ...prev, [stage]: wasPicked ? without : [...without, team] };
    });
  };

  if (pool.length === 0) return <p className="text-sm text-slate-400">Schedule not loaded yet.</p>;

  const draftPicks: Picks = {
    ...saved,
    reachR32: survivors,
    reachR16: ko.reachR16,
    reachQF: ko.reachQF,
    reachSF: ko.reachSF,
    reachFinal: ko.reachFinal,
    winner,
    goldenBoot: boot,
    goldenBall: ball,
  };

  // --- Pre-tournament still open → the wizard is the whole screen ---
  if (!preLocked) {
    return (
      <PreTournamentWizard
        groups={groups}
        matches={matches}
        draftPicks={draftPicks}
        saved={saved}
        eliminated={eliminated}
        onToggleEliminate={toggleEliminate}
        winner={winner}
        setWinner={(t) => { setDirty(true); setWinner((w) => (w === t ? null : t)); }}
        boot={boot}
        setBoot={(v) => { setDirty(true); setBoot(v); }}
        bootCandidates={bootCandidates}
        ball={ball}
        setBall={(v) => { setDirty(true); setBall(v); }}
        ballCandidates={ballCandidates}
        onLock={() => lockStage('reachR32')}
        locking={save.isPending}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
      />
    );
  }

  // --- Pre-tournament locked → read-only recap + the knockout rounds ---
  return (
    <div className="flex flex-col gap-8">
      <LockedSummary
        picks={saved}
        groups={groups}
        matches={matches}
        manuallyLocked={preManualLocked}
        joinedAfter={!!me && !!preDeadline && me.created_at > preDeadline}
        deadlinePassed={preDeadlinePassed}
      />

      {KNOCKOUT_STAGES.map((stage) => {
        const status = saved.lockedStages.includes(stage) ? 'locked' : stageStatus(stage, matches, now);
        if (status === 'pending') return <PendingCard key={stage} stage={stage} />;
        if (status === 'locked') {
          const d = stageDeadlineUTC(stage, matches);
          return (
            <KnockoutSummary
              key={stage}
              stage={stage}
              matches={matches}
              savedPicks={saved[stage]}
              manuallyLocked={saved.lockedStages.includes(stage)}
              joinedAfter={!!me && !!d && me.created_at > d}
            />
          );
        }
        return (
          <KnockoutWizard
            key={stage}
            stage={stage}
            matches={matches}
            selected={ko[stage]}
            onPick={(t, sib) => pickKo(stage, t, sib)}
            onLock={() => lockStage(stage)}
            locking={save.isPending}
            saveStatus={saveStatus}
            lastSavedAt={lastSavedAt}
          />
        );
      })}
    </div>
  );
}

// --- read-only / pending knockout sections ---------------------------------

const STATUS_STYLE: Record<PickStatus, string> = {
  correct: 'text-verdict-worth',
  busted: 'text-verdict-must line-through',
  alive: 'text-slate-200',
};

function KnockoutSummary({
  stage,
  matches,
  savedPicks,
  manuallyLocked,
  joinedAfter,
}: {
  stage: StageKey;
  matches: Match[];
  savedPicks: string[];
  manuallyLocked: boolean;
  joinedAfter: boolean;
}) {
  const def = stageDef(stage);
  return (
    <section>
      <h3 className="mb-1 flex items-center gap-2 font-display text-lg font-bold uppercase tracking-wide text-slate-50">
        <Lock className="h-3.5 w-3.5 text-slate-400" aria-hidden /> {def.label}
      </h3>
      {manuallyLocked && <p className="mb-2 text-xs text-slate-400">You locked this round — final.</p>}
      {joinedAfter ? (
        <p className="text-sm text-slate-500">This closed before you joined — it scores 0 for you.</p>
      ) : savedPicks.length === 0 ? (
        <p className="text-sm text-slate-500">No picks made for this round.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {savedPicks.map((t) => (
            <li key={t} className={cn('flex items-center gap-2 text-sm', STATUS_STYLE[pickStatus(t, stage, matches)])}>
              <span aria-hidden>{teamFlag(t)}</span>
              <span className="truncate font-display font-semibold uppercase tracking-wide">{t}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PendingCard({ stage }: { stage: StageKey }) {
  const def = stageDef(stage);
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
