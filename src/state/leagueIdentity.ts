import { useEffect, useState } from 'react';
import { normalizeCode } from '@/data/league/codes';

/**
 * Per-device league membership. Maps a league code → who this device is in
 * that league. Mirrors the pub/sub + hook pattern in `preferences.ts`.
 */

const KEY = 'wc26.leagues.v1';

export type Identity = { memberId: string; displayName: string; leagueName?: string };
type IdentityMap = Record<string, Identity>;

function readAll(): IdentityMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const out: IdentityMap = {};
    for (const [code, val] of Object.entries(parsed as Record<string, unknown>)) {
      const v = val as Partial<Identity>;
      if (v && typeof v.memberId === 'string' && typeof v.displayName === 'string') {
        out[code] = {
          memberId: v.memberId,
          displayName: v.displayName,
          ...(typeof v.leagueName === 'string' ? { leagueName: v.leagueName } : {}),
        };
      }
    }
    return out;
  } catch {
    return {};
  }
}

function writeAll(map: IdentityMap): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

const subscribers = new Set<() => void>();
function notify() {
  for (const cb of subscribers) cb();
}

export function getIdentities(): IdentityMap {
  return readAll();
}

export function getIdentity(code: string): Identity | null {
  return readAll()[normalizeCode(code)] ?? null;
}

export function setIdentity(code: string, identity: Identity): void {
  const map = readAll();
  map[normalizeCode(code)] = identity;
  writeAll(map);
  notify();
}

export function clearIdentity(code: string): void {
  const map = readAll();
  delete map[normalizeCode(code)];
  writeAll(map);
  notify();
}

/** React hook: identity for one league, re-renders on change. */
export function useLeagueIdentity(code: string): Identity | null {
  const norm = normalizeCode(code);
  const [value, setValue] = useState<Identity | null>(() => getIdentity(norm));
  useEffect(() => {
    const cb = () => setValue(getIdentity(norm));
    subscribers.add(cb);
    const storageHandler = (e: StorageEvent) => {
      if (e.key === KEY) cb();
    };
    window.addEventListener('storage', storageHandler);
    cb();
    return () => {
      subscribers.delete(cb);
      window.removeEventListener('storage', storageHandler);
    };
  }, [norm]);
  return value;
}

export type MyLeague = { code: string; displayName: string; leagueName?: string };

/** React hook: all leagues this device belongs to (for the hub). */
export function useMyLeagues(): MyLeague[] {
  const [value, setValue] = useState(() => toList(getIdentities()));
  useEffect(() => {
    const cb = () => setValue(toList(getIdentities()));
    subscribers.add(cb);
    const storageHandler = (e: StorageEvent) => {
      if (e.key === KEY) cb();
    };
    window.addEventListener('storage', storageHandler);
    cb();
    return () => {
      subscribers.delete(cb);
      window.removeEventListener('storage', storageHandler);
    };
  }, []);
  return value;
}

function toList(map: IdentityMap): MyLeague[] {
  return Object.entries(map).map(([code, v]) => ({
    code,
    displayName: v.displayName,
    leagueName: v.leagueName,
  }));
}
