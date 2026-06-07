import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client for the prediction-league backend.
 *
 * The Watch app must build and run with NO Supabase env configured — in that
 * case `supabase` is null and `leagueEnabled` is false, and the league UI
 * shows a graceful "not configured" state instead of crashing.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export const leagueEnabled = supabase !== null;

/** Narrowing helper: throws if the league backend isn't configured. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'League backend not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    );
  }
  return supabase;
}
