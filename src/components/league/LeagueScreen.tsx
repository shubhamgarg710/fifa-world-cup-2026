import { useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import * as Tabs from '@radix-ui/react-tabs';
import { Loader2 } from 'lucide-react';
import { leagueEnabled } from '@/data/supabase';
import { normalizeCode } from '@/data/league/codes';
import { useLeague, useMembers } from '@/data/league/queries';
import { useAllMatches } from '@/data/queries';
import { useLeagueIdentity } from '@/state/leagueIdentity';
import { LeagueNotFoundError } from '@/data/league/api';
import { LeagueShell } from './LeagueShell';
import { NotConfigured } from './NotConfigured';
import { JoinCard } from './JoinCard';
import { ShareCode } from './ShareCode';
import { Leaderboard } from './Leaderboard';
import { MyPicks } from './MyPicks';
import { RevealPanel } from './RevealPanel';
import { DeadlineBanner } from './DeadlineBanner';
import { BootLeader } from './BootLeader';
import { WhatChanged } from './WhatChanged';
import { cn } from '../cn';

export function LeagueScreen() {
  const params = useParams<{ code: string }>();
  const code = normalizeCode(params.code ?? '');
  // All hooks must run unconditionally (rules of hooks) — guard comes after.
  const qc = useQueryClient();
  const league = useLeague(code);
  const identity = useLeagueIdentity(code);
  const members = useMembers(code);
  const matchesQ = useAllMatches();

  if (!leagueEnabled) return <NotConfigured />;

  if (league.isLoading) {
    return (
      <LeagueShell title={code}>
        <Centered>
          <Loader2 className="h-6 w-6 animate-spin text-slate-500" aria-hidden />
        </Centered>
      </LeagueShell>
    );
  }

  if (league.error) {
    const notFound = league.error instanceof LeagueNotFoundError;
    return (
      <LeagueShell title="League">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center">
          <p className="text-slate-300">
            {notFound
              ? 'League not found — check the code with whoever shared it.'
              : 'Could not load this league. Try again in a moment.'}
          </p>
        </div>
      </LeagueShell>
    );
  }

  const leagueName = league.data!.name;

  if (!identity) {
    return (
      <LeagueShell title={leagueName} subtitle={`Code ${code}`}>
        <JoinCard
          code={code}
          leagueName={leagueName}
          onJoined={() => qc.invalidateQueries({ queryKey: ['league-members', code] })}
        />
      </LeagueShell>
    );
  }

  const matches = matchesQ.data?.matches ?? [];

  return (
    <LeagueShell title={leagueName} subtitle={`Playing as ${identity.displayName}`}>
      <div className="mb-4 flex flex-col gap-3">
        <ShareCode code={code} />
        <WhatChanged code={code} meId={identity.memberId} members={members.data ?? []} matches={matches} />
        <DeadlineBanner matches={matches} />
        <BootLeader matches={matches} />
        {matches.some((m) => m.status === 'result_pending') && (
          <p className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs text-slate-400">
            Results updating… some finished matches haven't been scored by the data source yet.
          </p>
        )}
      </div>
      <Tabs.Root defaultValue="standings">
        <Tabs.List className="mb-4 flex gap-1 border-b border-slate-900">
          <TabTrigger value="standings" label="Standings" />
          <TabTrigger value="mypicks" label="My picks" />
          <TabTrigger value="reveal" label="Reveal" />
        </Tabs.List>
        <Tabs.Content value="standings">
          <Leaderboard
            members={members.data ?? []}
            matches={matches}
            meId={identity.memberId}
            loading={members.isLoading}
          />
        </Tabs.Content>
        <Tabs.Content value="mypicks">
          <MyPicks code={code} memberId={identity.memberId} members={members.data ?? []} matches={matches} />
        </Tabs.Content>
        <Tabs.Content value="reveal">
          <RevealPanel members={members.data ?? []} matches={matches} />
        </Tabs.Content>
      </Tabs.Root>
    </LeagueShell>
  );
}

function TabTrigger({ value, label }: { value: string; label: string }) {
  return (
    <Tabs.Trigger
      value={value}
      className={cn(
        'cursor-pointer border-b-2 border-transparent px-4 py-2.5 font-display text-sm font-semibold uppercase tracking-wide text-slate-400 transition-colors',
        'data-[state=active]:border-verdict-must data-[state=active]:text-slate-50 hover:text-slate-200',
      )}
    >
      {label}
    </Tabs.Trigger>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-center py-16">{children}</div>;
}
