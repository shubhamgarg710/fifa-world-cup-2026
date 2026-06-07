import { leagueEnabled } from '@/data/supabase';
import { LeagueShell } from './LeagueShell';
import { JoinByCode } from './JoinByCode';
import { NotConfigured } from './NotConfigured';

/** Standalone /join route. */
export function JoinLeague() {
  if (!leagueEnabled) return <NotConfigured />;
  return (
    <LeagueShell title="Join a league" subtitle="Enter the code a friend shared">
      <JoinByCode />
    </LeagueShell>
  );
}
