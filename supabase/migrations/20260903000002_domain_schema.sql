-- 0002_domain_schema.sql
-- LandVision AI — core domain tables.
--
-- Canonical dataset (land_projects) mirrors the ml_service feature columns and
-- the §4 field list exactly. RLS on every base table DENIES anonymous (public)
-- users; the citizen portal reads curated views created in 0003 instead
-- (spec §1, §2, §27).
--
-- NOTE: server-side ingestion (the ML backend / server functions) should use
-- the Supabase SERVICE ROLE key, which bypasses RLS. RLS here governs the
-- browser client (anon + authenticated).

-- ---------------------------------------------------------------------------
-- Datasets — upload / gov-sync provenance (§4, §20)
-- ---------------------------------------------------------------------------
create table if not exists public.datasets (
  id          uuid primary key default gen_random_uuid(),
  filename    text not null,
  source      text not null default 'upload' check (source in ('upload', 'gov_sync', 'seed')),
  row_count   integer not null default 0,
  checksum    text,
  status      text not null default 'active' check (status in ('active', 'archived', 'validating', 'rejected')),
  notes       text,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Land projects — canonical §4 record (matches ml_service NUMERICAL/CATEGORICAL
-- feature columns). Yes/No factors stored as text for ML compatibility.
-- ---------------------------------------------------------------------------
create table if not exists public.land_projects (
  id                      uuid primary key default gen_random_uuid(),
  dataset_id              uuid references public.datasets (id) on delete cascade,
  project_ref             text,                       -- external/source id if provided
  name                    text,
  -- Location / categorical
  state                   text not null,
  district                text,
  project_type            text not null,
  -- Numerical features
  land_required_hectare   numeric,
  land_remaining_hectare  numeric,
  affected_families       integer,
  compensation_amount     numeric,
  project_cost            numeric,
  -- Categorical Yes/No factors (kept as given for the ML pipeline)
  legal_dispute           text,
  court_case              text,
  environmental_clearance text,
  forest_clearance        text,
  rehabilitation_issue    text,
  -- Delay targets (days). NULL when not yet known — never fabricate.
  award_delay             numeric,
  payment_delay           numeric,
  possession_delay        numeric,
  delay_reason            text,
  is_public               boolean not null default true,  -- publishable to citizen portal
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists idx_land_projects_state   on public.land_projects (state);
create index if not exists idx_land_projects_district on public.land_projects (district);
create index if not exists idx_land_projects_type    on public.land_projects (project_type);
create index if not exists idx_land_projects_dataset on public.land_projects (dataset_id);

drop trigger if exists trg_land_projects_updated_at on public.land_projects;
create trigger trg_land_projects_updated_at
  before update on public.land_projects
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Model versions / retraining registry (§22)
-- ---------------------------------------------------------------------------
create table if not exists public.model_versions (
  id               uuid primary key default gen_random_uuid(),
  target           text not null,   -- Award_Delay | Payment_Delay | Possession_Delay | Overall_Delay | Risk_Level
  version          text not null,
  algorithm        text,
  metrics          jsonb not null default '{}'::jsonb,   -- {accuracy, precision, recall, f1, roc_auc} or {mae, rmse, r2}
  dataset_size     integer,
  training_samples integer,
  test_samples     integer,
  status           text not null default 'Staging' check (status in ('Active', 'Archived', 'Staging')),
  trained_at       timestamptz not null default now(),
  notes            text,
  unique (target, version)
);

create index if not exists idx_model_versions_target_status on public.model_versions (target, status);

-- ---------------------------------------------------------------------------
-- Predictions — ML output per project (§5, §6)
-- ---------------------------------------------------------------------------
create table if not exists public.predictions (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references public.land_projects (id) on delete cascade,
  model_version       text,
  target              text,
  risk_score          numeric,
  delay_probability   numeric,
  expected_delay_days numeric,
  risk_category       text check (risk_category in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  drivers             jsonb not null default '[]'::jsonb,   -- explainability factors
  created_at          timestamptz not null default now()
);

create index if not exists idx_predictions_project on public.predictions (project_id);
create index if not exists idx_predictions_created on public.predictions (created_at desc);

-- ---------------------------------------------------------------------------
-- Alerts (Action & Governance)
-- ---------------------------------------------------------------------------
create table if not exists public.alerts (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid references public.land_projects (id) on delete cascade,
  severity       text not null check (severity in ('Critical', 'High', 'Medium', 'Information')),
  message        text not null,
  trigger        text,
  officer        text,
  recommendation text,
  status         text not null default 'New' check (status in ('New', 'Acknowledged', 'Assigned', 'Escalated', 'Resolved')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_alerts_status on public.alerts (status);

drop trigger if exists trg_alerts_updated_at on public.alerts;
create trigger trg_alerts_updated_at
  before update on public.alerts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Interventions (Action & Governance)
-- ---------------------------------------------------------------------------
create table if not exists public.interventions (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references public.land_projects (id) on delete cascade,
  action      text not null,
  assigned_to text,
  department  text,
  priority    text check (priority in ('Critical', 'High', 'Medium', 'Low')),
  deadline    date,
  status      text not null default 'Pending' check (status in ('Pending', 'In Progress', 'Completed', 'Escalated')),
  notes       text,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_interventions_status on public.interventions (status);

drop trigger if exists trg_interventions_updated_at on public.interventions;
create trigger trg_interventions_updated_at
  before update on public.interventions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Audit log (§25) — immutable; admin-only visibility
-- ---------------------------------------------------------------------------
create table if not exists public.audit_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles (id) on delete set null,
  actor_role text,
  action     text not null,
  entity     text,
  entity_id  text,
  old_value  text,
  new_value  text,
  status     text not null default 'INFO' check (status in ('SUCCESS', 'WARNING', 'INFO')),
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_created on public.audit_log (created_at desc);

-- ---------------------------------------------------------------------------
-- API registry (§24) — admin-only. Describes platform endpoints + gov gateways.
-- Stores STATUS only, never credentials.
-- ---------------------------------------------------------------------------
create table if not exists public.api_endpoints (
  id              uuid primary key default gen_random_uuid(),
  method          text not null check (method in ('GET', 'POST', 'PUT', 'DELETE')),
  path            text not null,
  description     text,
  category        text,
  status          text not null default 'Planned Govt Gateway'
                    check (status in ('Implemented', 'Demo Simulation', 'Planned Govt Gateway')),
  params          jsonb not null default '[]'::jsonb,
  response_sample jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

-- ===========================================================================
-- Row Level Security. No policy references `anon`, so with RLS enabled the
-- anon (public) role receives ZERO rows from every base table below.
-- ===========================================================================
alter table public.datasets       enable row level security;
alter table public.land_projects  enable row level security;
alter table public.model_versions enable row level security;
alter table public.predictions    enable row level security;
alter table public.alerts         enable row level security;
alter table public.interventions  enable row level security;
alter table public.audit_log      enable row level security;
alter table public.api_endpoints  enable row level security;

-- datasets: officials read; ops-writers manage.
drop policy if exists "datasets read" on public.datasets;
create policy "datasets read" on public.datasets
  for select to authenticated using (public.is_official());
drop policy if exists "datasets write" on public.datasets;
create policy "datasets write" on public.datasets
  for all to authenticated using (public.can_write_ops()) with check (public.can_write_ops());

-- land_projects: officials read; ops-writers manage.
drop policy if exists "land_projects read" on public.land_projects;
create policy "land_projects read" on public.land_projects
  for select to authenticated using (public.is_official());
drop policy if exists "land_projects write" on public.land_projects;
create policy "land_projects write" on public.land_projects
  for all to authenticated using (public.can_write_ops()) with check (public.can_write_ops());

-- model_versions: officials read; ADMIN only may train/activate/modify.
drop policy if exists "model_versions read" on public.model_versions;
create policy "model_versions read" on public.model_versions
  for select to authenticated using (public.is_official());
drop policy if exists "model_versions admin write" on public.model_versions;
create policy "model_versions admin write" on public.model_versions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- predictions: officials read; ops-writers write.
drop policy if exists "predictions read" on public.predictions;
create policy "predictions read" on public.predictions
  for select to authenticated using (public.is_official());
drop policy if exists "predictions write" on public.predictions;
create policy "predictions write" on public.predictions
  for all to authenticated using (public.can_write_ops()) with check (public.can_write_ops());

-- alerts: officials read; ops-writers write.
drop policy if exists "alerts read" on public.alerts;
create policy "alerts read" on public.alerts
  for select to authenticated using (public.is_official());
drop policy if exists "alerts write" on public.alerts;
create policy "alerts write" on public.alerts
  for all to authenticated using (public.can_write_ops()) with check (public.can_write_ops());

-- interventions: officials read; ops-writers write.
drop policy if exists "interventions read" on public.interventions;
create policy "interventions read" on public.interventions
  for select to authenticated using (public.is_official());
drop policy if exists "interventions write" on public.interventions;
create policy "interventions write" on public.interventions
  for all to authenticated using (public.can_write_ops()) with check (public.can_write_ops());

-- audit_log: ADMIN reads; any official may insert their own action. Immutable
-- (no update/delete policy => updates & deletes are rejected).
drop policy if exists "audit read admin" on public.audit_log;
create policy "audit read admin" on public.audit_log
  for select to authenticated using (public.is_admin());
drop policy if exists "audit insert" on public.audit_log;
create policy "audit insert" on public.audit_log
  for insert to authenticated with check (public.is_official());

-- api_endpoints: ADMIN only (API Center is admin-only).
drop policy if exists "api read admin" on public.api_endpoints;
create policy "api read admin" on public.api_endpoints
  for select to authenticated using (public.is_admin());
drop policy if exists "api write admin" on public.api_endpoints;
create policy "api write admin" on public.api_endpoints
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
