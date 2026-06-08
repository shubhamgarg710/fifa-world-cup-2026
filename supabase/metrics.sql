-- WC 2026 Companion — metrics queries (the DB side that Vercel Analytics can't see).
-- Save each of these as a snippet in the Supabase dashboard → SQL Editor.
-- Page views, referrers, and the custom events (league_created / league_joined /
-- picks_locked / highlights_clicked) live in the Vercel project's Analytics tab.

-- Total leagues (public vs private)
select count(*) as total_leagues,
       count(*) filter (where code = 'WCUP26') as public_league,
       count(*) - count(*) filter (where code = 'WCUP26') as private_leagues
from leagues;

-- Total members across all leagues
select count(*) as total_members,
       count(distinct league_code) as active_leagues
from members;

-- Pick completion funnel
select
  count(*) as joined,
  count(*) filter (where (picks->>'reachR32') is not null and jsonb_array_length(picks->'reachR32') = 32) as completed_r32,
  count(*) filter (where picks->>'winner' is not null) as picked_winner,
  count(*) filter (where picks->>'goldenBoot' is not null) as picked_boot,
  count(*) filter (where picks->>'goldenBall' is not null) as picked_ball
from members;

-- Daily signups
select date_trunc('day', created_at) as day, count(*)
from members
group by 1 order by 1;

-- Public league cumulative size over time
select date_trunc('day', created_at) as day, count(*) as cumulative
from members
where league_code = 'WCUP26'
group by 1 order by 1;
