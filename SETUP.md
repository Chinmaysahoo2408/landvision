# LandVision AI — Setup & Deployment Guide

This guide provisions the real backend (Supabase Auth + Postgres + Row Level
Security), wires the app to it, and ingests your dataset. Steps 1–8 run on a
full development machine — the build and browser testing cannot run in the
restricted assistant sandbox.

The database policies created here are the platform's **server-side access
control**: Supabase (PostgREST) enforces Row Level Security at the database
layer, so unauthorized API calls are rejected regardless of the frontend
(spec §1, §25, §28).

---

## 1. Install dependencies

The Lovable build package was removed, so the lockfiles are momentarily out of
sync with `package.json`. Run a normal install to resync — **do not** use
`npm ci` (it fails on an out-of-sync lockfile):

```bash
npm install
npm install @supabase/supabase-js
```

(Equivalent with bun: `bun install` then `bun add @supabase/supabase-js`.)

---

## 2. Create a Supabase project

1. Create a project at https://supabase.com (or use your self-hosted instance).
2. Open **Project Settings → API** and copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon / publishable key** → `VITE_SUPABASE_ANON_KEY` (public, safe in the browser)
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (SECRET — server only)

---

## 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the **public** client values:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_CARTO_API_KEY=your-carto-key   # optional, for basemap
```

Put **server secrets** somewhere the browser bundle never sees them — for local
Cloudflare/Wrangler dev that is `.dev.vars` (already gitignored); in production
use your deployment platform's environment settings:

```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CLAUDE_API_KEY=your-rotated-claude-key
```

**Security rules (spec §26 — non-negotiable):**

- Only `VITE_`-prefixed vars may hold public values; everything with that prefix
  is compiled into the browser bundle.
- `SUPABASE_SERVICE_ROLE_KEY` and `CLAUDE_API_KEY` must **never** be
  `VITE_`-prefixed, never live in React/TypeScript client code, never in
  `localStorage`, and never be committed to git.
- Use the **rotated** Claude API key. If any previously exposed key still exists
  anywhere in the project, remove it.

---

## 4. Run the database migrations

The migrations live in `supabase/migrations/` and must run **in filename
order**:

1. `20260903000001_init_auth_rbac.sql` — roles, profiles, RBAC functions, RLS
2. `20260903000002_domain_schema.sql` — datasets, land_projects (§4 fields),
   predictions, model versions, alerts, interventions, audit log, API registry
3. `20260903000003_public_access.sql` — curated public views for the citizen portal
4. `20260903000004_seed_api_registry.sql` — seeds the API/Gateway registry

**Option A — SQL editor:** open each file, paste into the Supabase SQL editor,
run them one at a time in order.

**Option B — Supabase CLI:**

```bash
supabase link --project-ref YOUR-PROJECT-REF
supabase db push
```

> Supabase's linter will warn that the three `public_*` views are
> "SECURITY DEFINER views". **This is expected and intentional** — the views
> deliberately run with the owner's rights to expose only curated, non-sensitive
> columns to anonymous visitors, while the base tables stay fully closed to
> them.

---

## 5. Lock down signup and create the first admin

For a government platform, accounts should be **admin-provisioned**, not
self-service:

1. In **Authentication → Providers / Sign In → Email**, disable open sign-ups
   (or restrict to invitations).
2. Create your first user under **Authentication → Users → Add user**.
3. A `profiles` row is created automatically with the lowest-privilege role.
   Promote that user to admin (run once in the SQL editor):

```sql
update public.profiles
set role = 'ADMIN', name = 'Platform Administrator', status = 'Active'
where email = 'you@example.gov.in';
```

Thereafter the admin manages all users and roles from the in-app
**Users & Roles** screen. Non-admins cannot change their own role or status —
that is enforced by a database trigger, not just the UI.

---

## 6. Verify the two-tier access model

- **Signed out** (public): only `public_project_status`, `public_delay_stats`,
  and `public_project_risk` return data. Querying any base table (e.g.
  `land_projects`) as `anon` must return **zero rows**.
- **Signed in as an official**: base tables become readable per role; write
  actions require an officer/admin role.
- **Admin-only** areas (Users & Roles, Audit, API Center, model activation)
  reject non-admins at the database layer even if the API is called directly.

A quick anon check with `curl` (should return `[]`, not project rows):

```bash
curl "$VITE_SUPABASE_URL/rest/v1/land_projects?select=*" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY"
```

---

## 7. Ingest your dataset (§4, §20)

Your dataset must contain the §4 columns (as in `ml_service/seed_data.csv`):

`State, District, Project_Type, Land_Required_Hectare, Land_Remaining_Hectare,
Affected_Families, Compensation_Amount, Project_Cost, Legal_Dispute, Court_Case,
Environmental_Clearance, Forest_Clearance, Rehabilitation_Issue, Award_Delay,
Payment_Delay, Possession_Delay, Delay_Reason`

Load rows into `public.datasets` (one provenance row) and `public.land_projects`
(the records) using a **server-side script with the service role key** (it
bypasses RLS). Never ingest from the browser with the anon key.

Once verified data is present, flip the data-honesty switch so the "sample data"
banners disappear: set `mode: "verified"` (and `connected`, `sourceName`,
`lastSyncedAt`) in `src/lib/lv/dataSource.ts`. Until then the platform correctly
shows "Sample / demonstration data" and "No verified data available".

There is **no accessible public bhoomirashi.gov.in API**; do not scrape or
bypass access controls. The API registry lists that gateway as
`Planned Govt Gateway` until you connect an authorized source.

---

## 8. Run the ML service and the app

```bash
# ML backend (real XGBoost models)
cd ml_service
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8000

# App (in another terminal, from the repo root)
npm run dev
```

---

## Security checklist (spec §26)

- [ ] No secret keys in client/TypeScript code, `localStorage`, or the repo
- [ ] `SUPABASE_SERVICE_ROLE_KEY` and `CLAUDE_API_KEY` are server-only, un-prefixed
- [ ] `.env.local` / `.dev.vars` are gitignored (they are)
- [ ] Claude API key is the rotated one; old exposed key removed everywhere
- [ ] Open signup disabled; first admin promoted via SQL
- [ ] Anon queries against base tables return zero rows
- [ ] Admin-only screens reject non-admins even via direct API calls
