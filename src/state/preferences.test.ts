import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getMyTeams, setMyTeams, toggleTeam } from './preferences';

describe('preferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it('returns an empty state by default', () => {
    expect(getMyTeams()).toEqual({ support: [], follow: [] });
  });

  it('round-trips through localStorage', () => {
    setMyTeams({ support: ['Brazil'], follow: ['France', 'Mexico'] });
    expect(getMyTeams()).toEqual({ support: ['Brazil'], follow: ['France', 'Mexico'] });
  });

  it('survives corrupt blobs by returning empty', () => {
    localStorage.setItem('wc26.myTeams.v1', '{ not json');
    expect(getMyTeams()).toEqual({ support: [], follow: [] });
  });

  it('survives partial blobs (missing fields default to [])', () => {
    localStorage.setItem('wc26.myTeams.v1', JSON.stringify({ support: ['Brazil'] }));
    expect(getMyTeams()).toEqual({ support: ['Brazil'], follow: [] });
  });

  it('toggleTeam adds and removes from the named list', () => {
    toggleTeam('Brazil', 'support');
    expect(getMyTeams().support).toContain('Brazil');
    toggleTeam('Brazil', 'support');
    expect(getMyTeams().support).not.toContain('Brazil');
  });
});
