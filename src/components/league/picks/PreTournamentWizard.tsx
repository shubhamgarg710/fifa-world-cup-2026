import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { Match } from '@/data/sources/types';
import type { Picks } from '@/data/league/types';
import type { AwardCandidate } from '@/data/static/awards';
import type { Group } from '@/logic/groups';
import { eliminationValidity, firstIncompleteStep } from '@/logic/survivors';
import { StepProgress } from './StepProgress';
import { SurvivorsStep } from './SurvivorsStep';
import { WinnerStep } from './WinnerStep';
import { AwardStep } from './AwardStep';
import { PicksReview } from './PicksReview';
import type { SaveStatus } from './useAutoSavePicks';
import { cn } from '../../cn';

type Step = 0 | 1 | 2 | 3 | 4; // 4 = review

export function PreTournamentWizard({
  groups,
  matches,
  draftPicks,
  saved,
  eliminated,
  onToggleEliminate,
  winner,
  setWinner,
  boot,
  setBoot,
  bootCandidates,
  ball,
  setBall,
  ballCandidates,
  onLock,
  locking,
  saveStatus,
  lastSavedAt,
}: {
  groups: Group[];
  matches: Match[];
  draftPicks: Picks;
  saved: Picks;
  eliminated: Set<string>;
  onToggleEliminate: (team: string) => void;
  winner: string | null;
  setWinner: (team: string) => void;
  boot: string | null;
  setBoot: (v: string | null) => void;
  bootCandidates: AwardCandidate[];
  ball: string | null;
  setBall: (v: string | null) => void;
  ballCandidates: AwardCandidate[];
  onLock: () => void;
  locking: boolean;
  saveStatus: SaveStatus;
  lastSavedAt: number | null;
}) {
  const resume = firstIncompleteStep(saved);
  const [step, setStep] = useState<Step>(resume === 'review' ? 4 : resume);
  const [reminderDismissed, setReminderDismissed] = useState(false);

  const survivorsValid = eliminationValidity(eliminated, groups).valid;
  const complete = [survivorsValid, !!winner, !!boot, !!ball];
  const stepComplete = step < 4 ? complete[step] : true;
  const completedCount = complete.filter(Boolean).length;

  const steps = [
    { label: 'Survivors', complete: complete[0] },
    { label: 'Winner', complete: complete[1] },
    { label: 'Boot', complete: complete[2] },
    { label: 'Ball', complete: complete[3] },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <StepProgress steps={steps} current={step} onJump={(i) => setStep(i as Step)} />
        <SaveLine status={saveStatus} lastSavedAt={lastSavedAt} />
      </div>

      {step === 0 && <SurvivorsStep groups={groups} eliminated={eliminated} onToggle={onToggleEliminate} />}
      {step === 1 && <WinnerStep groups={groups} winner={winner} onSelect={setWinner} />}
      {step === 2 && (
        <AwardStep title="Golden Boot" blurb="Top scorer of the tournament (50 pts)." candidates={bootCandidates} selected={boot} onChange={setBoot} />
      )}
      {step === 3 && (
        <AwardStep title="Golden Ball" blurb="Best player of the tournament (50 pts)." candidates={ballCandidates} selected={ball} onChange={setBall} />
      )}
      {step === 4 && (
        <PicksReview
          picks={draftPicks}
          groups={groups}
          matches={matches}
          onEdit={(s) => setStep(s)}
          onLock={onLock}
          locking={locking}
        />
      )}

      {step < 4 && (
        <div className="sticky bottom-3 z-10 flex gap-2">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, (s as number) - 1) as Step)}
            disabled={step === 0}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-3 font-display text-sm font-semibold uppercase tracking-wide text-slate-300 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Back
          </button>
          <button
            type="button"
            onClick={() => setStep((s) => ((s as number) + 1) as Step)}
            disabled={!stepComplete}
            className={cn(
              'inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full px-5 py-3 font-display text-sm font-bold uppercase tracking-wider text-white shadow-lg transition-colors active:scale-[0.98]',
              'bg-verdict-must hover:bg-verdict-must/90 disabled:cursor-not-allowed disabled:opacity-40',
            )}
          >
            {step === 3 ? 'Review' : 'Next'} <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      )}

      {completedCount < 4 && !reminderDismissed && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <p className="text-xs text-slate-400">
            You've completed {completedCount} of 4 picks. Your progress is saved automatically —
            incomplete picks score 0.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setReminderDismissed(true)}
              className="cursor-pointer rounded-full bg-slate-800 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-200 hover:bg-slate-700"
            >
              Keep going
            </button>
            <button
              type="button"
              onClick={() => setReminderDismissed(true)}
              className="cursor-pointer rounded-full border border-slate-700 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 hover:bg-slate-800"
            >
              Finish later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SaveLine({ status, lastSavedAt }: { status: SaveStatus; lastSavedAt: number | null }) {
  let text = '';
  if (status === 'saving') text = 'Saving…';
  else if (status === 'saved' || lastSavedAt) text = relativeSaved(lastSavedAt);
  return <p className="text-right text-[11px] text-slate-500">{text}</p>;
}

function relativeSaved(ts: number | null): string {
  if (!ts) return '';
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'Saved just now';
  if (mins === 1) return 'Saved 1 min ago';
  if (mins < 60) return `Saved ${mins} min ago`;
  return 'Saved';
}
