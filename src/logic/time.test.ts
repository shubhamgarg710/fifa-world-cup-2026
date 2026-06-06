import { describe, expect, it } from 'vitest';
import {
  parseKickoff,
  formatLocalKickoff,
  localDayKey,
  relativeCountdown,
} from './time';

describe('parseKickoff (the sanity check the plan demands)', () => {
  it('opener: Mexico vs South Africa, 2026-06-11 13:00 UTC-6 → 19:00 UTC', () => {
    expect(parseKickoff('2026-06-11', '13:00 UTC-6')).toBe('2026-06-11T19:00:00.000Z');
  });

  it('handles UTC-4 (US eastern venues)', () => {
    expect(parseKickoff('2026-06-12', '21:00 UTC-4')).toBe('2026-06-13T01:00:00.000Z');
  });

  it('handles fractional offsets like UTC+5:30', () => {
    expect(parseKickoff('2026-06-11', '13:00 UTC+5:30')).toBe('2026-06-11T07:30:00.000Z');
  });

  it('throws on garbage input', () => {
    expect(() => parseKickoff('2026-06-11', 'noon')).toThrow();
  });
});

describe('formatLocalKickoff', () => {
  it('renders 19:00 UTC in IST as 12:30 AM', () => {
    const utc = '2026-06-11T19:00:00.000Z';
    // en-IN gives unambiguous 12-hour formatting we can assert on
    const formatted = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(utc));
    expect(formatted).toMatch(/12:30/);
    // smoke-test that the production helper returns something non-empty
    expect(formatLocalKickoff(utc, 'Asia/Kolkata')).toMatch(/12:30/);
  });
});

describe('localDayKey', () => {
  it('UTC midnight maps to the next day in IST', () => {
    // 2026-06-11 23:00 UTC → 2026-06-12 04:30 IST → "2026-06-12"
    expect(localDayKey(new Date('2026-06-11T23:00:00Z'), 'Asia/Kolkata')).toBe('2026-06-12');
  });

  it('US eastern (UTC-4 in June) keeps a 22:00 UTC moment on 2026-06-11', () => {
    expect(localDayKey(new Date('2026-06-12T02:00:00Z'), 'America/New_York')).toBe('2026-06-11');
  });
});

describe('relativeCountdown', () => {
  const now = new Date('2026-06-11T10:00:00Z');
  it('minutes', () => {
    expect(relativeCountdown('2026-06-11T10:25:00Z', now)).toBe('in 25m');
  });
  it('hours', () => {
    expect(relativeCountdown('2026-06-11T13:00:00Z', now)).toBe('in 3h');
  });
  it('days', () => {
    expect(relativeCountdown('2026-06-13T10:00:00Z', now)).toBe('in 2d');
  });
  it('past returns null', () => {
    expect(relativeCountdown('2026-06-11T09:00:00Z', now)).toBeNull();
  });
});
