import { useEffect, useRef, useState } from 'react';
import type { Picks } from '@/data/league/types';
import { useSavePicks } from '@/data/league/queries';

export type SaveStatus = 'idle' | 'saving' | 'saved';

/**
 * Debounced auto-save. Pass the picks to persist (already lock-aware via the
 * caller's buildPicks) and the saved baseline; whenever `picks` differs from
 * `saved`, write ~1s after the last change. No save button anywhere.
 */
export function useAutoSavePicks(code: string, memberId: string, picks: Picks, saved: Picks) {
  const save = useSavePicks(code);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serialized = JSON.stringify(picks);
  const savedSerialized = JSON.stringify(saved);

  useEffect(() => {
    if (serialized === savedSerialized) return; // nothing to persist
    setStatus('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      save.mutate(
        { memberId, picks },
        {
          onSuccess: () => {
            setStatus('saved');
            setLastSavedAt(Date.now());
          },
          onError: () => setStatus('idle'),
        },
      );
    }, 1000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized, savedSerialized, memberId]);

  return { status, lastSavedAt, isError: save.isError };
}
