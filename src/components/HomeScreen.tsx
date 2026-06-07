import { useMemo, useState } from 'react';
import { Trophy, Users } from 'lucide-react';
import type { Match } from '@/data/sources/types';
import { selectBoard, splitMatchesForToday, useAllMatches } from '@/data/queries';
import {
  deviceTimeZone,
  formatLocalDateLabel,
  formatWeekday,
  instantLocalDayKey,
  localDayKey,
} from '@/logic/time';
import { useMyTeams } from '@/state/preferences';
import { DataErrorState } from './DataErrorState';
import { RecentSection } from './RecentSection';
import { TodaySection } from './TodaySection';
import { GroupsSection } from './GroupsSection';
import { KickoffCountdown } from './KickoffCountdown';
import { PublicLeagueCTA } from './league/PublicLeagueCTA';

export function HomeScreen({
  onOpenMatch,
  onOpenTeams,
  onOpenLeague,
}: {
  onOpenMatch: (m: Match) => void;
  onOpenTeams: () => void;
  onOpenLeague: () => void;
}) {
  const myTeams = useMyTeams();
  const { data, isLoading, error, refetch, isRefetching } = useAllMatches();
  const tz = useMemo(() => deviceTimeZone(), []);
  const [now] = useState(() => new Date());

  if (error) {
    return (
      <div className="px-4">
        <DataErrorState error={error as Error} onRetry={() => refetch()} />
      </div>
    );
  }

  const todayKey = localDayKey(now, tz);
  const matches = data?.matches ?? [];
  const offline = data?.offline ?? false;
  const toDayKey = useMemo(() => (iso: string) => instantLocalDayKey(iso, tz), [tz]);
  const { recent, future } = useMemo(
    () => splitMatchesForToday(matches, todayKey, toDayKey, now),
    [matches, todayKey, toDayKey, now],
  );
  const board = useMemo(
    () => selectBoard(matches, todayKey, toDayKey, now),
    [matches, todayKey, toDayKey, now],
  );
  const nextKickoffUTC = future[0]?.kickoffUTC;
  const todayTitle = board.isToday ? 'Today' : 'Up next';
  const todaySubtitle = isLoading
    ? 'Loading…'
    : board.labelDateISO
      ? board.isToday
        ? formatLocalDateLabel(board.labelDateISO, tz)
        : `${formatWeekday(board.labelDateISO, tz)}, ${formatLocalDateLabel(board.labelDateISO, tz)}`
      : undefined;

  const demo = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('demo') === '1';
  const showBanner = demo || offline;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-12">
      {demo && (
        <div className="safe-top -mx-4 mb-0 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-widest text-amber-300">
          Demo mode · WC 2022 data shifted to today
        </div>
      )}
      {!demo && offline && (
        <div className="safe-top -mx-4 mb-0 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-widest text-amber-300">
          Showing offline schedule · pull to refresh
        </div>
      )}
      <header className={`sticky z-10 -mx-4 mb-4 flex items-center justify-between border-b border-slate-900 bg-slate-950/85 px-4 py-3 backdrop-blur ${showBanner ? 'top-0' : 'safe-top top-0'}`}>
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-slate-50 leading-none">
            WC&nbsp;2026
          </h1>
          <p className="text-[11px] text-slate-400">
            {formatLocalDateLabel(now.toISOString(), tz)} · {tz}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenLeague}
            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-300 transition-colors hover:bg-slate-800 active:scale-95"
            aria-label="Prediction leagues"
          >
            <Trophy className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onOpenTeams}
            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-300 transition-colors hover:bg-slate-800 active:scale-95"
            aria-label="Edit my teams"
          >
            <Users className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </header>

      {!isLoading && <KickoffCountdown matches={matches} now={now} />}

      <section className="mb-6">
        <SectionHeading title={todayTitle} subtitle={todaySubtitle} />
        {isLoading ? (
          <SkeletonList />
        ) : (
          <TodaySection
            today={board.matches}
            myTeams={myTeams}
            nextKickoffUTC={nextKickoffUTC}
            onOpenMatch={onOpenMatch}
          />
        )}
      </section>

      <section className="mb-6">
        <PublicLeagueCTA />
      </section>

      <section className="mb-6">
        <SectionHeading title="Groups" subtitle="Tap a team to follow · tap a group for fixtures" />
        {isLoading ? <SkeletonList /> : <GroupsSection matches={matches} myTeams={myTeams} />}
      </section>

      <section className="mb-6">
        <SectionHeading
          title="Recent"
          subtitle="Worth chasing highlights?"
          right={
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-400 transition-colors hover:text-slate-200 disabled:opacity-50"
            >
              {isRefetching ? 'Refreshing…' : 'Refresh'}
            </button>
          }
        />
        {isLoading ? (
          <SkeletonList />
        ) : (
          <RecentSection recent={recent} myTeams={myTeams} onOpen={onOpenMatch} />
        )}
      </section>
    </div>
  );
}

function SectionHeading({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-2 flex items-baseline justify-between">
      <div>
        <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-slate-50 leading-none">
          {title}
        </h2>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/40" />
      ))}
    </div>
  );
}
