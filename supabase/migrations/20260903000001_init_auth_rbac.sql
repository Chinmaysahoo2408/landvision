-- 0001_init_auth_rbac.sql
-- LandVision AI — authentication, roles, and RBAC helper functions.
--
-- These policies are the platform's SERVER-SIDE access control. Supabase
-- (PostgREST) enforces them at the database layer, so unauthorized API calls
-- are rejected regardless of what the frontend does (spec §1, §25, §28).
--
-- Run order: 0001 (this) -> 0002 -> 0003 -> 0004.

-- ---------------------------------------------------------------------------
-- Roles enum (mirrors src/lib/lv/types.ts Role)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum (
      'ADMIN',
      'STATE_OFFICER',
      'DISTRICT_OFFICER',
      'DECISION_MAKER',
      'ANALYST',
      'PUBLIC_USER'
    );
  end if;
end$$;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users) — holds role + jurisdiction
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  name        text not null default '',
  role        public.app_role not null default 'ANALYST',
  state       text,
  district    text,
  status      text not null default 'Active' check (status in ('Active', 'Disabled')),
  last_login  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'Application user profile + role. One row per auth.users id. Role changes are admin-only (enforced by guard_profile_changes()).';

-- Generic updated_at trigger helper (reused by later migrations).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever a new auth user is created.
-- New users get the LOWEST-privilege role by default; an ADMIN must elevate
-- them. Open signup should also be disabled in Supabase Auth settings so that
-- only admin-provisioned accounts exist (see SETUP.md).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RBAC helper functions.
-- SECURITY DEFINER so they read public.profiles WITHOUT re-triggering the
-- caller's RLS (which would recurse). Marked STABLE for planner caching.
-- ---------------------------------------------------------------------------
create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'ADMIN' and status = 'Active'
       from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Any active, authenticated official. All official roles may READ operational
-- data; the frontend still tailors what it shows per role.
create or replace function public.is_official()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select status = 'Active'
        and role in ('ADMIN', 'STATE_OFFICER', 'DISTRICT_OFFICER', 'DECISION_MAKER', 'ANALYST')
       from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Roles permitted to create / modify operational records.
create or replace function public.can_write_ops()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select status = 'Active'
        and role in ('ADMIN', 'STATE_OFFICER', 'DISTRICT_OFFICER')
       from public.profiles where id = auth.uid()),
    false
  );
$$;

grant execute on function public.current_app_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_official() to authenticated;
grant execute on function public.can_write_ops() to authenticated;

-- ---------------------------------------------------------------------------
-- Prevent privilege escalation: a non-admin must not change their own role,
-- status, id, or email. RLS WITH CHECK cannot compare OLD vs NEW, so this is
-- enforced by a BEFORE UPDATE trigger.
-- ---------------------------------------------------------------------------
create or replace function public.guard_profile_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;  -- admins may change anything
  end if;
  if new.role   is distinct from old.role
     or new.status is distinct from old.status
     or new.id     is distinct from old.id
     or new.email  is distinct from old.email then
    raise exception 'Not authorized to modify role, status, id, or email';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_guard on public.profiles;
create trigger trg_profiles_guard
  before update on public.profiles
  for each row execute function public.guard_profile_changes();

-- ---------------------------------------------------------------------------
-- RLS on profiles
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- A user can read their own profile.
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles
  for select to authenticated
  using (id = auth.uid());

-- Admins can read every profile (Users & Roles admin screen).
drop policy if exists "profiles admin read" on public.profiles;
create policy "profiles admin read" on public.profiles
  for select to authenticated
  using (public.is_admin());

-- A user can update their own profile row (privileged-field changes are
-- blocked by guard_profile_changes()).
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Admins can insert / update / delete any profile (user + role management).
drop policy if exists "profiles admin write" on public.profiles;
create policy "profiles admin write" on public.profiles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
