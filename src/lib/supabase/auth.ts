/**
 * LandVision AI — authentication helpers.
 *
 * Thin, typed wrappers over the Supabase client. All functions degrade safely
 * to a no-op / null result when Supabase is not configured (demo mode), so the
 * rest of the app never has to branch on configuration state.
 *
 * A "session user" is the auth identity joined with the user's `profiles` row
 * (role + jurisdiction), mapped to the app's existing `AppUser` shape.
 */
import { supabase, isSupabaseConfigured } from "./client";
import type { AuthChangeEvent, Session } from "./client";
import type { AppUser, Role } from "@/lib/lv/types";

export interface AuthResult {
  user: AppUser | null;
  error: string | null;
}

interface ProfileRow {
  id: string;
  email: string | null;
  name: string | null;
  role: string | null;
  state: string | null;
  district: string | null;
  status: string | null;
  last_login: string | null;
}

function toAppUser(row: ProfileRow, fallbackEmail?: string): AppUser {
  return {
    id: row.id,
    name: row.name ?? "",
    email: row.email ?? fallbackEmail ?? "",
    role: (row.role ?? "ANALYST") as Role,
    state: row.state ?? null,
    district: row.district ?? null,
    status: row.status === "Disabled" ? "Disabled" : "Active",
    lastLogin: row.last_login ?? "",
  };
}

/** Fetch a user's profile row and map it to AppUser. */
export async function fetchProfile(userId: string, fallbackEmail?: string): Promise<AppUser | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, name, role, state, district, status, last_login")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return toAppUser(data as ProfileRow, fallbackEmail);
}

/** Sign in with email + password, returning the mapped AppUser or an error. */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  if (!supabase) {
    return { user: null, error: "Backend not configured. See SETUP.md." };
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data?.user) {
    return { user: null, error: error?.message ?? "Invalid credentials" };
  }
  const profile = await fetchProfile(data.user.id, data.user.email ?? email);
  if (!profile) {
    return { user: null, error: "No profile found for this account. Contact an administrator." };
  }
  if (profile.status === "Disabled") {
    await supabase.auth.signOut();
    return { user: null, error: "This account is disabled." };
  }
  // Best-effort last-login stamp (ignore failures).
  void supabase.from("profiles").update({ last_login: new Date().toISOString() }).eq("id", profile.id);
  return { user: profile, error: null };
}

/** Sign the current user out. */
export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

/** Resolve the current session into an AppUser (or null if not signed in). */
export async function getSessionUser(): Promise<AppUser | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  const user = data?.session?.user;
  if (!user) return null;
  return fetchProfile(user.id, user.email ?? undefined);
}

/**
 * Subscribe to auth state changes. The callback receives the resolved AppUser
 * (or null on sign-out). Returns an unsubscribe function.
 */
export function onAuthChange(cb: (user: AppUser | null) => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange(
    async (_event: AuthChangeEvent, session: Session | null) => {
      if (!session?.user) {
        cb(null);
        return;
      }
      cb(await fetchProfile(session.user.id, session.user.email ?? undefined));
    },
  );
  return () => data?.subscription?.unsubscribe?.();
}

export { isSupabaseConfigured };
