-- 0003_public_access.sql
-- LandVision AI — curated PUBLIC views for the unauthenticated citizen portal.
--
-- Base tables deny anon (0002). These views expose ONLY non-sensitive,
-- project-level columns and aggregates. They intentionally run with the view
-- owner's rights (security_invoker = false) so anon can read the curated
-- columns without gaining access to the underlying tables. This is the
-- correct column-restriction mechanism, since RLS is row-level, not
-- column-level (spec §1, §2, §27).
--
-- Supabase's linter will flag these as "SECURITY DEFINER views" — that is
-- expected and intentional here (see SETUP.md).

-- Per-project public-safe status. Excludes internal notes (delay_reason).
create or replace view public.public_project_status
with (security_invoker = false) as
  select
    lp.id,
    lp.name,
    lp.state,
    lp.district,
    lp.project_type,
    lp.land_required_hectare,
    lp.land_remaining_hectare,
    lp.affected_families,
    lp.compensation_amount,
    lp.project_cost,
    lp.award_delay,
    lp.payment_delay,
    lp.possession_delay
  from public.land_projects lp
  where lp.is_public = true;

comment on view public.public_project_status is
  'Public-safe, project-level fields for the citizen portal. No internal notes or personal data.';

-- State / project-type aggregates for the public statistics page.
create or replace view public.public_delay_stats
with (security_invoker = false) as
  select
    lp.state,
    lp.project_type,
    count(*)                                     as project_count,
    round(avg(lp.award_delay)::numeric, 1)       as avg_award_delay,
    round(avg(lp.payment_delay)::numeric, 1)     as avg_payment_delay,
    round(avg(lp.possession_delay)::numeric, 1)  as avg_possession_delay,
    sum(lp.affected_families)                    as total_affected_families
  from public.land_projects lp
  where lp.is_public = true
  group by lp.state, lp.project_type;

comment on view public.public_delay_stats is
  'Aggregate delay statistics by state and project type for the public statistics page.';

-- Latest public risk band per project (no internal driver detail) for the
-- public AI-insights section.
create or replace view public.public_project_risk
with (security_invoker = false) as
  select distinct on (p.project_id)
    p.project_id,
    lp.state,
    lp.district,
    lp.project_type,
    p.risk_category,
    round(p.delay_probability::numeric, 0)   as delay_probability,
    round(p.expected_delay_days::numeric, 0) as expected_delay_days,
    p.created_at
  from public.predictions p
  join public.land_projects lp on lp.id = p.project_id and lp.is_public = true
  order by p.project_id, p.created_at desc;

comment on view public.public_project_risk is
  'Latest public risk band per project for public AI insights. Excludes internal driver detail.';

-- Expose the curated views to the public + authenticated roles.
grant usage on schema public to anon, authenticated;
grant select on public.public_project_status to anon, authenticated;
grant select on public.public_delay_stats    to anon, authenticated;
grant select on public.public_project_risk    to anon, authenticated;
