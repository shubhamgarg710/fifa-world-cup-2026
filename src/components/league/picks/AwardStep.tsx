import type { AwardCandidate } from '@/data/static/awards';
import { PlayerChipList } from '../PlayerChipList';

/** Steps 3 & 4: single-select Golden Boot / Ball with the "Other…" free-text. */
export function AwardStep({
  title,
  blurb,
  candidates,
  selected,
  onChange,
}: {
  title: string;
  blurb: string;
  candidates: AwardCandidate[];
  selected: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-slate-50 leading-none">{title}</h2>
        <p className="mt-1 text-sm text-slate-400">{blurb} Not listed? Use “Other…”.</p>
      </div>
      <PlayerChipList candidates={candidates} selected={selected} onChange={onChange} />
    </div>
  );
}
