import { requireSupabase } from '@/data/supabase';
import { setIdentity } from '@/state/leagueIdentity';
import { generateCode, normalizeCode, validateDisplayName } from './codes';
import { EMPTY_PICKS, normalizePicks, type League, type Member, type Picks } from './types';

const PG_UNIQUE_VIOLATION = '23505';

export { DisplayNameError } from './codes';

export class NameTakenError extends Error {
  constructor() {
    super(
      "That name's already in this league — if that's you on another device, add a variant. Cross-device sync isn't supported yet.",
    );
    this.name = 'NameTakenError';
  }
}
export class LeagueNotFoundError extends Error {
  constructor() {
    super('League not found — check the code with whoever shared it.');
    this.name = 'LeagueNotFoundError';
  }
}

/**
 * Create a league AND join the creator as its first member, atomically enough
 * for a casual app: insert league (retrying on code collision), then insert
 * the creator row, then persist identity to localStorage. Returns the code so
 * the UI can route straight to /l/{code}.
 */
export async function createLeague(name: string, displayName: string): Promise<string> {
  const sb = requireSupabase();
  const cleanName = name.trim();
  const cleanDisplay = validateDisplayName(displayName);

  let code = '';
  for (let attempt = 0; attempt < 6; attempt++) {
    code = generateCode();
    const { error } = await sb.from('leagues').insert({ code, name: cleanName });
    if (!error) break;
    if (error.code === PG_UNIQUE_VIOLATION) continue; // code collision → retry
    throw error;
  }
  if (!code) throw new Error('Could not generate a unique league code. Try again.');

  const { data, error: memberErr } = await sb
    .from('members')
    .insert({ league_code: code, display_name: cleanDisplay, picks: EMPTY_PICKS })
    .select()
    .single();
  if (memberErr) throw memberErr;

  setIdentity(code, { memberId: data.id, displayName: cleanDisplay });
  return code;
}

export async function getLeague(code: string): Promise<League> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('leagues')
    .select('code,name,created_at')
    .eq('code', normalizeCode(code))
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new LeagueNotFoundError();
  return data as League;
}

export async function listMembers(code: string): Promise<Member[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from('members')
    .select('id,league_code,display_name,picks,created_at')
    .eq('league_code', normalizeCode(code))
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((m) => ({ ...m, picks: normalizePicks(m.picks) }) as Member);
}

/** Member count for a league — count only, never fetches the rows. */
export async function countMembers(code: string): Promise<number> {
  const sb = requireSupabase();
  const { count, error } = await sb
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('league_code', normalizeCode(code));
  if (error) throw error;
  return count ?? 0;
}

/** Join an existing league. Throws LeagueNotFoundError / NameTakenError. */
export async function joinLeague(code: string, displayName: string): Promise<Member> {
  const sb = requireSupabase();
  const norm = normalizeCode(code);
  const cleanDisplay = validateDisplayName(displayName);

  // Confirm the league exists first → distinct, clear error for a bad code.
  await getLeague(norm);

  const { data, error } = await sb
    .from('members')
    .insert({ league_code: norm, display_name: cleanDisplay, picks: EMPTY_PICKS })
    .select()
    .single();
  if (error) {
    if (error.code === PG_UNIQUE_VIOLATION) throw new NameTakenError();
    throw error;
  }
  const member = { ...data, picks: normalizePicks(data.picks) } as Member;
  setIdentity(norm, { memberId: member.id, displayName: cleanDisplay });
  return member;
}

/** Save the current device's own picks (only `picks` is anon-writable). */
export async function upsertMyPicks(memberId: string, picks: Picks): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from('members').update({ picks }).eq('id', memberId);
  if (error) throw error;
}
