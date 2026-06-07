import { useEffect, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { Match } from '@/data/sources/types';
import type { Member } from '@/data/league/types';
import { AWARDS } from '@/data/static/awards';
import { rankMembers } from '@/logic/leagueScore';
import { teamStillAlive } from '@/logic/leagueStages';
import { diffSnapshot, type LeagueSnapshot } from '@/logic/whatChanged';

function readSnapshot(key: string): LeagueSnapshot | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as LeagueSnapshot) : null;
  } catch {
    return null;
  }
}

/** "What changed since last visit" banner (P1.1). */
export function WhatChanged({
  code,
  meId,
  members,
  matches,
}: {
  code: string;
  meId: string;
  members: Member[];
  matches: Match[];
}) {
  const key = `wc26.snapshot.${code}.${meId}`;

  const current = useMemo<LeagueSnapshot | null>(() => {
    const ranked = rankMembers(members, matches, AWARDS);
    const idx = ranked.findIndex((r) => r.member.id === meId);
    if (idx === -1) return null;
    const me = ranked[idx];
    const winnerAlive = me.member.picks.winner ? teamStillAlive(me.member.picks.winner, matches) : true;
    return { rank: idx + 1, total: me.total, winnerAlive };
  }, [members, matches, meId]);

  // Snapshot read once on mount so we diff against the *previous* visit.
  const [prev] = useState<LeagueSnapshot | null>(() => readSnapshot(key));

  // Persist the new snapshot after we've computed the diff.
  useEffect(() => {
    if (current) {
      try {
        localStorage.setItem(key, JSON.stringify(current));
      } catch {
        /* ignore */
      }
    }
  }, [key, current]);

  if (!current) return null;
  const changes = diffSnapshot(prev, current);
  if (changes.length === 0) return null;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/10 to-transparent px-4 py-3">
      <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden />
      <div className="text-sm">
        <p className="font-display font-semibold uppercase tracking-wide text-gold">Since last visit</p>
        <ul className="mt-0.5 space-y-0.5 text-slate-200">
          {changes.map((c, i) => (
            <li key={i}>{c.text}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
