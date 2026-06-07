import { useEffect, useState } from 'react';
import { teamFlag } from '@/data/static';
import type { AwardCandidate } from '@/data/static/awards';
import { cn } from '../cn';

/**
 * Single-select list of award candidate players, plus an "Other…" free-text
 * option for a player not in the curated list (e.g. a breakout scorer). The
 * value persists as a raw string to picks.goldenBoot / picks.goldenBall.
 *
 * Boot scoring does an EXACT string match against openfootball's scorer names,
 * so a free-text pick must match that spelling to score — we trust the user to
 * type it as it appears in results (only trim + non-empty is enforced here).
 */
export function PlayerChipList({
  candidates,
  selected,
  onChange,
  disabled,
}: {
  candidates: AwardCandidate[];
  selected: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}) {
  const isCustom = selected != null && !candidates.some((c) => c.name === selected);
  const [showOther, setShowOther] = useState(isCustom);
  const [otherText, setOtherText] = useState(isCustom ? (selected as string) : '');

  // Re-sync if the saved value changes underneath us (e.g. fresh load).
  useEffect(() => {
    if (isCustom) {
      setShowOther(true);
      setOtherText(selected as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const pickCandidate = (name: string) => {
    setShowOther(false);
    onChange(selected === name ? null : name);
  };

  const commitOther = (raw: string) => {
    setOtherText(raw);
    const trimmed = raw.trim();
    onChange(trimmed.length > 0 ? trimmed : null);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {candidates.map((c) => {
          const on = selected === c.name;
          return (
            <button
              key={c.name}
              type="button"
              disabled={disabled}
              onClick={() => pickCandidate(c.name)}
              aria-pressed={on}
              className={cn(
                'flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors',
                on ? 'border-gold/50 bg-gold/10' : 'border-slate-800 bg-slate-900/50 hover:bg-slate-900',
                disabled && 'cursor-not-allowed opacity-60',
              )}
            >
              <span className="text-lg leading-none" aria-hidden>
                {teamFlag(c.team)}
              </span>
              <span className="min-w-0">
                <span className={cn('block truncate font-display text-sm font-semibold', on && 'text-gold')}>
                  {c.name}
                </span>
                <span className="block truncate text-[11px] text-slate-500">{c.team}</span>
              </span>
            </button>
          );
        })}

        {/* Other… chip */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setShowOther((s) => !s)}
          aria-pressed={isCustom}
          className={cn(
            'flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-dashed px-3 py-2 text-left transition-colors',
            isCustom ? 'border-gold/50 bg-gold/10' : 'border-slate-700 bg-slate-900/50 hover:bg-slate-900',
            disabled && 'cursor-not-allowed opacity-60',
          )}
        >
          <span className={cn('font-display text-sm font-semibold', isCustom && 'text-gold')}>
            Other…
          </span>
        </button>
      </div>

      {showOther && (
        <input
          value={otherText}
          onChange={(e) => commitOther(e.target.value)}
          disabled={disabled}
          placeholder="Type the player's name exactly as it'll appear in results"
          aria-label="Other player name"
          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-base text-slate-100 outline-none focus:border-gold disabled:opacity-60"
        />
      )}
    </div>
  );
}
