import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { leagueEnabled } from '@/data/supabase';
import { countMembers, getLeague, listMembers, upsertMyPicks } from './api';
import type { Picks } from './types';

export function useLeague(code: string | undefined) {
  return useQuery({
    queryKey: ['league', code],
    queryFn: () => getLeague(code!),
    enabled: !!code && leagueEnabled,
    retry: false, // a bad code shouldn't retry 3×
  });
}

export function useMembers(code: string | undefined) {
  return useQuery({
    queryKey: ['league-members', code],
    queryFn: () => listMembers(code!),
    enabled: !!code && leagueEnabled,
  });
}

export function useMemberCount(code: string) {
  return useQuery({
    queryKey: ['league-member-count', code],
    queryFn: () => countMembers(code),
    enabled: leagueEnabled,
    staleTime: 60_000,
  });
}

export function useSavePicks(code: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, picks }: { memberId: string; picks: Picks }) =>
      upsertMyPicks(memberId, picks),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['league-members', code] });
    },
  });
}
