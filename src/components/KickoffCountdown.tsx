import { useMemo } from 'react';
import { Rocket } from 'lucide-react';
import type { Match } from '@/data/sources/types';
import { deviceTimeZone, formatWeekday } from '@/logic/time';

function firstKickoff(matches: Match[]): string | null {
  let best: string | null = null;
  for (const m of matches) if (best === null || m.kickoffUTC < best) best = m.kickoffUTC;
  return best;
}

function untilLabel(fromMs: number, toMs: number): string {
  const diff = toMs - fromMs;
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'}`;
  const days = Math.ceil(hours / 24);
  return `${days} day${days === 1 ? '' : 's'}`;
}

/** "World Cup kicks off Thursday · 4 days". Disappears once the first match starts. */
export function KickoffCountdown({ matches, now }: { matches: Match[]; now: Date }) {
  const tz = useMemo(() => deviceTimeZone(), []);
  const first = useMemo(() => firstKickoff(matches), [matches]);
  if (!first) return null;
  const firstMs = new Date(first).getTime();
  if (now.getTime() >= firstMs) return null;

  return (
    <div className="mb-4 flex items-center gap-3 rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/10 to-transparent px-4 py-3">
      <Rocket className="h-5 w-5 shrink-0 text-gold" aria-hidden />
      <p className="font-display text-sm font-bold uppercase tracking-wide text-slate-50">
        World Cup kicks off {formatWeekday(first, tz)}
        <span className="text-gold"> · {untilLabel(now.getTime(), firstMs)}</span>
      </p>
    </div>
  );
}
