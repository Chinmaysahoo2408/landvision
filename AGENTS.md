# Repository guide for AI agents

LandVision AI — a Land Acquisition Delay Monitoring & AI Decision-Support platform.

## Stack

- TanStack Start + TanStack Router (file-based routes in `src/routes`, flat naming), React 19, Vite (rolldown), Tailwind 4.
- Path alias `@/*` → `./src/*`.
- Real ML backend in `ml_service/` (Python FastAPI + XGBoost) — delay regression + risk classification.
- Auth, database, and role-based access are being migrated to Supabase (Auth + Postgres + Row Level Security). See `SETUP.md` when present.

## Conventions

- After adding or deleting a route file, regenerate the route tree: `node scripts/gen-routes.mjs`.
- Never commit secrets. Server-only secrets (e.g. `CLAUDE_API_KEY`) belong in server-side environment variables — never in client code, `VITE_*` variables, browser storage, or the repository.
- Data honesty: never present unverified or sample figures as official data. `src/lib/lv/dataSource.ts` is the single source of truth for data-source status; render the `NoVerifiedData` empty state (from `src/components/lv/panels.tsx`) when verified data is absent.

## Verifying changes

- Type-check: `npx tsc --noEmit`
- Lint: `npx eslint .` — note the repo currently uses CRLF line endings, so `prettier/prettier` messages dominate lint output; filter them out to find real issues.
- Build and browser testing must run on a full dev machine: `npm install`, then `npm run build` / `npm run dev`.
