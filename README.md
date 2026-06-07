# WC 2026 Companion

A personal, mobile-first web app for the FIFA World Cup 2026 (June 11 – July 19, 2026).
Answers two questions every morning:

1. **What's on today** (in your local time zone) and worth planning around?
2. **Which finished games are worth chasing highlights for?**

The "what to watch" core is a static front-end — no backend, no accounts, no paid APIs.
An optional **prediction-league** layer (predict with friends) adds a Supabase backend; the
Watch experience works fully without it.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 148 tests, all pure-function/logic — no UI snapshots
npm run typecheck
npm run build      # → dist/
```

## Prediction league (optional)

A light fantasy layer: create a league, share a 6-char code, friends join with one tap (no
auth), make a few big picks (group survivors, winner, Golden Boot, Golden Ball), and watch a
live leaderboard scored automatically from results. Reached via the trophy icon in the header.

As the tournament progresses, each knockout round unlocks its own pick (predict the 16 → 8 →
4 → 2 who advance) once the previous round's teams are known, locking at that round's first
kickoff. Everyone's picks stay private until a round's deadline, then reveal for banter. The
league screen also shows a countdown to the next lock, the live Golden Boot leader, and a
"what changed since your last visit" summary (rank moves, points gained, winner knocked out).

**Setup (one-time):**
1. Create a free [Supabase](https://supabase.com) project.
2. In the SQL editor, run [`supabase/schema.sql`](supabase/schema.sql) (tables + open RLS policies).
3. Copy `.env.example` → `.env.local` and fill `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
   (Settings → API → Project URL + anon public key). Set the same two vars in Vercel.

Without those env vars, the league screens show a graceful "not set up" state and everything
else works normally.

**Notes & trust model:**
- Leagues are **public** — anyone with the code can join. No passwords by design.
- Scoring is 100% client-side (pure functions over results + a bundled FIFA snapshot). Supabase
  only stores league/member rows.
- RLS allows anonymous read/insert; the only anon-writable column is `members.picks`, so identity
  and the leaderboard tiebreaker (`created_at`) can't be tampered with. A determined person could
  still overwrite another member's *picks* or read picks early — acceptable for casual friends-play.
- **Golden Boot** is auto-derived from goal data. **Golden Ball** (not in match data) is set once
  in `src/data/static/awards.json` and redeployed at tournament end.
- Supabase free tier **pauses after 7 days idle** — fine during the tournament's daily activity.

## What it does

- Pulls fixtures + results from [openfootball/worldcup.json](https://github.com/openfootball/worldcup.json) (community-maintained, no API key).
- Converts kickoff times to your device's time zone automatically.
- Scores each match against the bundled FIFA ranking snapshot and assigns a verdict:
  - **Must-watch** — your team, big upset, knockout drama, late winner, goal fest, ET/penalties.
  - **Worth a look** — top-nation clash, mid-range upset, knockout match.
  - **Skip** — none of the above triggered.
- Each finished match opens a detail dialog with a goal timeline (own-goals attributed to the side that benefited) and a one-tap YouTube highlights search.
- Pick teams you **support** (always Must-watch) and teams you **follow** (surfaced first). Persisted to localStorage; no account needed.

## Architecture

Everything that touches data goes through one interface: `src/data/sources/types.ts → MatchDataSource`.
The single implementation is `OpenFootballAdapter` in `src/data/sources/openFootball.ts`. To swap or supplement the data source later, write another adapter — no UI changes required.

Scoring is pure functions in `src/logic/verdict.ts`. Thresholds live in `src/logic/config.ts`.

```
src/
  data/
    sources/         # MatchDataSource + OpenFootballAdapter
    static/          # bundled rankings.json + teams.json
    queries.ts       # TanStack Query hooks
  logic/
    time.ts          # kickoff parser, local-day window, countdown
    verdict.ts       # detectors + label rule (pure)
    config.ts        # tunable thresholds
    youtube.ts       # highlights search URL builder
  state/
    preferences.ts   # localStorage-backed myTeams
  components/        # HomeScreen, FixtureCard, RecapCard, dialogs, etc.
```

## Tuning the verdict

Edit `src/logic/config.ts`:

```ts
export const VERDICT = {
  topNationRank: 12,         // both teams ranked ≤ this → "top-nation clash"
  goalFestMinTotal: 4,       // combined goals ≥ this → "goal fest"
  lateDramaMinuteFrom: 85,   // goal minute ≥ this counts as late
  upsetMinRankGap: 10,
  upsetStrongRankGap: 25,    // ≥ this gap → strong upset by itself
};
```

The bundled FIFA ranking snapshot in `src/data/static/rankings.json` is approximate. Update it
before the tournament if you want sharper upset detection. Rankings barely move during a 39-day window.

## Deploy

Either platform works out of the box:

- **Vercel:** `vercel` (or import the repo). Build command `npm run build`, output `dist`.
- **Netlify:** drop the repo in, same build command and output dir.
- **GitHub Pages:** `npm run build` then publish `dist/` to a Pages branch.

No env vars required.

## Add to home screen

The page ships `theme-color`, `apple-touch-icon`, and `apple-mobile-web-app-*` meta so iOS
"Add to Home Screen" gives you a branded icon and a dark status bar. No service worker — by design.

## Known limits

- The data source can lag by hours after a match ends. Finished games show **Result pending**
  until openfootball updates the score — never a 0–0 placeholder.
- No card (yellow/red) data exists in the source. Detail view shows goals only.
- Tournament-spanning ranking changes aren't tracked; the bundled snapshot is the source of truth.
