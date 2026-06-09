import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clearIdentity, getIdentities, getIdentity, setIdentity } from './leagueIdentity';

describe('leagueIdentity', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('returns null for an unknown league', () => {
    expect(getIdentity('WC2ABC')).toBeNull();
  });

  it('round-trips an identity (code normalized to uppercase)', () => {
    setIdentity('wc2abc', { memberId: 'm1', displayName: 'Alice' });
    expect(getIdentity('WC2ABC')).toEqual({ memberId: 'm1', displayName: 'Alice' });
    expect(getIdentity('wc2abc')).toEqual({ memberId: 'm1', displayName: 'Alice' });
  });

  it('tracks multiple leagues independently', () => {
    setIdentity('AAAAAA', { memberId: 'm1', displayName: 'Alice' });
    setIdentity('BBBBBB', { memberId: 'm2', displayName: 'Bob' });
    expect(Object.keys(getIdentities()).sort()).toEqual(['AAAAAA', 'BBBBBB']);
  });

  it('clearIdentity removes only the named league', () => {
    setIdentity('AAAAAA', { memberId: 'm1', displayName: 'Alice' });
    setIdentity('BBBBBB', { memberId: 'm2', displayName: 'Bob' });
    clearIdentity('AAAAAA');
    expect(getIdentity('AAAAAA')).toBeNull();
    expect(getIdentity('BBBBBB')).not.toBeNull();
  });

  it('recovers from a corrupt blob', () => {
    localStorage.setItem('wc26.leagues.v1', '{ not json');
    expect(getIdentities()).toEqual({});
  });

  it('drops malformed entries', () => {
    localStorage.setItem(
      'wc26.leagues.v1',
      JSON.stringify({ AAAAAA: { memberId: 'm1' }, BBBBBB: { memberId: 'm2', displayName: 'Bob' } }),
    );
    expect(getIdentity('AAAAAA')).toBeNull(); // missing displayName
    expect(getIdentity('BBBBBB')).toEqual({ memberId: 'm2', displayName: 'Bob' });
  });

  it('round-trips the optional leagueName', () => {
    setIdentity('AAAAAA', { memberId: 'm1', displayName: 'Alice', leagueName: 'Envil' });
    expect(getIdentity('AAAAAA')).toEqual({ memberId: 'm1', displayName: 'Alice', leagueName: 'Envil' });
  });

  it('loads pre-fix entries without a leagueName (backward compatible)', () => {
    localStorage.setItem('wc26.leagues.v1', JSON.stringify({ AAAAAA: { memberId: 'm1', displayName: 'Alice' } }));
    const id = getIdentity('AAAAAA');
    expect(id).toEqual({ memberId: 'm1', displayName: 'Alice' });
    expect(id?.leagueName).toBeUndefined();
  });
});
