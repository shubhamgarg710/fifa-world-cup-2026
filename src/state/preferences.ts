import { useEffect, useState } from 'react';
import type { MyTeams } from '@/logic/verdict';

const KEY = 'wc26.myTeams.v1';
const EMPTY: MyTeams = { support: [], follow: [] };

function readFromStorage(): MyTeams {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    return {
      support: Array.isArray(parsed.support) ? parsed.support : [],
      follow: Array.isArray(parsed.follow) ? parsed.follow : [],
    };
  } catch {
    return EMPTY;
  }
}

function writeToStorage(value: MyTeams): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

const subscribers = new Set<() => void>();
function notify() {
  for (const cb of subscribers) cb();
}

export function getMyTeams(): MyTeams {
  return typeof window === 'undefined' ? EMPTY : readFromStorage();
}

export function setMyTeams(next: MyTeams): void {
  writeToStorage(next);
  notify();
}

export function toggleTeam(name: string, list: 'support' | 'follow'): void {
  const current = getMyTeams();
  const has = current[list].includes(name);
  const updated = {
    ...current,
    [list]: has ? current[list].filter((t) => t !== name) : [...current[list], name],
  };
  setMyTeams(updated);
}

/** React hook: re-renders when myTeams change. */
export function useMyTeams(): MyTeams {
  const [value, setValue] = useState<MyTeams>(() => getMyTeams());
  useEffect(() => {
    const cb = () => setValue(getMyTeams());
    subscribers.add(cb);
    const storageHandler = (e: StorageEvent) => {
      if (e.key === KEY) cb();
    };
    window.addEventListener('storage', storageHandler);
    return () => {
      subscribers.delete(cb);
      window.removeEventListener('storage', storageHandler);
    };
  }, []);
  return value;
}
