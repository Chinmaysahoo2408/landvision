/**
 * LandVision AI — Supabase browser client (ISOLATION POINT).
 *
 * This is the ONLY file in the app that imports `@supabase/supabase-js`.
 * Everything else imports the typed helpers from `./auth` or this file, so the
 * dependency stays contained. Until `npm install @supabase/supabase-js` is run
 * on a full dev machine, THIS file is the only one that fails to type-check
 * ("cannot find module") — that error is expected and isolated by design.
 *
 * The anon key is a public, browser-safe credential; all access is gated
 * server-side by Row Level Security (see supabase/migrations). Server secrets
 * (service role key, Claude key) never appear here (spec §26).
 */
import {
  createClient,
  type SupabaseClient,
  type Session,
  type AuthChangeEvent,
} from "@supabase/supabase-js";

// Re-export the auth types through this isolation point so other modules can
// annotate against them without importing the package directly. (These names
// are already imported above, so this adds no second module reference.)
export type { SupabaseClient, Session, AuthChangeEvent };

const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const anonKey = import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined;

/**
 * True when Supabase env vars are present. When false, the app runs in its
 * local demonstration mode and makes no real backend calls — this keeps the
 * app renderable before the backend is provisioned.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

/** The Supabase client, or null when not configured (demo mode). */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
