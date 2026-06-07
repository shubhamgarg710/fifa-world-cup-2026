/**
 * Time utilities for openfootball-format kickoffs.
 *
 * openfootball stores fixture times as `"HH:MM UTC±H[:MM]"`, e.g. `"13:00 UTC-6"`.
 * The opener (Mexico vs South Africa, 2026-06-11 13:00 UTC-6) must parse to
 * `2026-06-11T19:00:00.000Z`. Every downstream display depends on that being right.
 */

/** Parse openfootball's `date + time` into a UTC ISO instant. */
export function parseKickoff(date: string, time: string): string {
  // Accept e.g. "13:00 UTC-6", "21:00 UTC-4", "18:00 UTC+1:30"
  const m = time.match(/^(\d{1,2}):(\d{2})\s+UTC([+-])(\d{1,2})(?::(\d{2}))?$/);
  if (!m) throw new Error(`Unrecognized time format: "${time}"`);
  const [, hh, mm, sign, oh, om] = m;
  const offset = `${sign}${oh.padStart(2, '0')}:${(om ?? '00').padStart(2, '0')}`;
  const localIso = `${date}T${hh.padStart(2, '0')}:${mm}:00${offset}`;
  const d = new Date(localIso);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date/time: "${localIso}"`);
  return d.toISOString();
}

/** IANA tz of the device, falling back to UTC when unavailable (jsdom etc.). */
export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Format a kickoff for display in the user's local time zone.
 * Returns something like "1:30 AM" or "13:00" depending on locale.
 */
export function formatLocalKickoff(kickoffUTC: string, tz: string = deviceTimeZone()): string {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(kickoffUTC));
}

/** Full weekday name (e.g. "Thursday") in the given time zone. */
export function formatWeekday(iso: string, tz: string = deviceTimeZone()): string {
  return new Intl.DateTimeFormat(undefined, { timeZone: tz, weekday: 'long' }).format(new Date(iso));
}

/** "Mon, Jun 12" style local date label. */
export function formatLocalDateLabel(iso: string, tz: string = deviceTimeZone()): string {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: tz,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso));
}

/**
 * Return the user's "today" as a YYYY-MM-DD string in the given tz.
 * Used to pick fixtures whose local-day matches.
 */
export function localDayKey(now: Date, tz: string = deviceTimeZone()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: 'numeric',
  }).formatToParts(now);
  const y = parts.find((p) => p.type === 'year')!.value;
  const m = parts.find((p) => p.type === 'month')!.value;
  const d = parts.find((p) => p.type === 'day')!.value;
  return `${y}-${m}-${d}`;
}

/** Same as `localDayKey` but for the day of an arbitrary instant. */
export function instantLocalDayKey(iso: string, tz: string = deviceTimeZone()): string {
  return localDayKey(new Date(iso), tz);
}

/** Short countdown like "in 25m", "in 3h", or null if already started/past. */
export function relativeCountdown(kickoffUTC: string, now: Date = new Date()): string | null {
  const diffMs = new Date(kickoffUTC).getTime() - now.getTime();
  if (diffMs <= 0) return null;
  const mins = Math.round(diffMs / 60_000);
  if (mins < 60) return `in ${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `in ${hours}h`;
  const days = Math.round(hours / 24);
  return `in ${days}d`;
}
