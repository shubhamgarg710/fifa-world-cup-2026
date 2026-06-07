/**
 * openfootball's 2026 file uses placeholder strings for unresolved knockout
 * fixtures — `1A` (winner of Group A), `2B` (runner-up of Group B),
 * `3A/B/C/D/F` (best third-placed from this set of groups), and `W73`/`L101`
 * (bracket references). These flow through the adapter as-is so ids stay
 * stable; this module turns them into readable English at render time.
 */

const GROUP_SLOT = /^([12])([A-L])$/;
const BEST_THIRD = /^3([A-L](?:\/[A-L])+)$/;
const BRACKET = /^([WL])(\d+)$/;

export function isPlaceholderTeam(name: string): boolean {
  return GROUP_SLOT.test(name) || BEST_THIRD.test(name) || BRACKET.test(name);
}

export function displayTeamName(name: string): string {
  const gs = GROUP_SLOT.exec(name);
  if (gs) {
    const [, slot, letter] = gs;
    return slot === '1' ? `Winner of Group ${letter}` : `Runner-up of Group ${letter}`;
  }
  const b3 = BEST_THIRD.exec(name);
  if (b3) {
    return `Best 3rd · ${b3[1]}`;
  }
  const br = BRACKET.exec(name);
  if (br) {
    const [, kind, num] = br;
    return kind === 'W' ? `Winner of M${num}` : `Loser of M${num}`;
  }
  return name;
}
