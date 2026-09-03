import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Globe2, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { ROLE_LABEL, useLV } from "@/lib/lv/store";
import { isSupabaseConfigured, signIn as supabaseSignIn } from "@/lib/supabase/auth";
import type { Role } from "@/lib/lv/types";
import { HeroMap } from "@/components/lv/HeroMap";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Secure Sign In — LandVision AI Government Portal" },
      {
        name: "description",
        content:
          "Authenticated access for land acquisition officers, district and state administrators and policymakers.",
      },
      { property: "og:title", content: "Secure Sign In — LandVision AI" },
      {
        property: "og:description",
        content: "Role-based access to the LandVision AI land acquisition intelligence platform.",
      },
    ],
  }),
  component: LoginPage,
});

const DEMO: { role: Role; email: string }[] = [
  { role: "ADMIN", email: "admin@landvision.gov.in" },
  { role: "STATE_OFFICER", email: "state.odisha@landvision.gov.in" },
  { role: "DISTRICT_OFFICER", email: "district.khordha@landvision.gov.in" },
  { role: "DECISION_MAKER", email: "policy@landvision.gov.in" },
];

function LoginPage() {
  const { login, users, setSession } = useLV();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Demo sign-in — used only when no real backend is configured.
  const demoSignIn = (role: Role) => {
    setBusy(role);
    setError("");
    window.setTimeout(() => {
      const user = login(role);
      setBusy(null);
      if (!user) {
        setError("This account is disabled. Please contact the administrator.");
        return;
      }
      toast.success(`Signed in as ${ROLE_LABEL[role]}`);
      navigate({ to: "/app/dashboard" });
    }, 550);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isSupabaseConfigured) {
      // Real authentication against Supabase; roles/permissions are enforced
      // server-side by Row Level Security regardless of this UI.
      if (!email.trim() || !password) {
        setError("Enter your email and password.");
        return;
      }
      setBusy("form");
      const { user, error: authError } = await supabaseSignIn(email.trim(), password);
      setBusy(null);
      if (authError || !user) {
        setError(authError ?? "Unable to sign in. Please check your credentials.");
        return;
      }
      setSession(user);
      toast.success(`Signed in as ${user.name || ROLE_LABEL[user.role]}`);
      navigate({ to: "/app/dashboard" });
      return;
    }

    // Demo mode: match a demonstration account by email.
    const match = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!match) {
      setError("We could not find an account with that email address.");
      return;
    }
    if (password.length < 4) {
      setError("Please enter your password (minimum 4 characters for this demonstration).");
      return;
    }
    demoSignIn(match.role);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* LEFT SIDE: VISUAL & OVERLAY */}
      <div className="relative hidden flex-col justify-between border-r border-border bg-surface p-10 lg:flex overflow-hidden">
        <div className="grid-backdrop pointer-events-none absolute inset-0 opacity-50" aria-hidden />

        {/* TOP BRANDING */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Globe2 className="size-5" aria-hidden />
            </span>
            <div>
              <span className="font-display text-base font-bold tracking-wider text-foreground">
                LANDVISION AI
              </span>
              <span className="block text-[9px] font-semibold tracking-widest text-primary uppercase">
                Government Infrastructure Portal
              </span>
            </div>
          </Link>
          <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary">
            GIS Satellite & Cadastral Hub
          </span>
        </div>

        {/* CENTER GIS MAP VISUAL & OVERLAY */}
        <div className="relative z-10 my-auto flex flex-col items-center justify-center">
          <HeroMap />
          
          <div className="mt-6 w-full max-w-md rounded-xl border border-primary/30 bg-background/80 p-5 backdrop-blur shadow-xl text-center space-y-2">
            <h2 className="font-display text-lg font-bold text-foreground tracking-wide">
              LANDVISION AI
            </h2>
            <p className="text-sm font-medium text-primary italic">
              "AI-powered intelligence for land acquisition and infrastructure projects."
            </p>
            <div className="pt-2 flex justify-center gap-4 text-[10px] text-muted-foreground uppercase font-semibold">
              <span>• Odisha & National Jurisdiction</span>
              <span>• Cadastral Risk Scoring</span>
              <span>• FIR Analytics</span>
            </div>
          </div>
        </div>

        {/* BOTTOM HUD METRICS */}
        <div className="relative z-10 grid grid-cols-3 gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
          <div>
            <span className="block text-[10px] text-muted-foreground/70 uppercase">Jurisdiction</span>
            <span className="font-semibold text-foreground">Odisha &amp; All-India</span>
          </div>
          <div>
            <span className="block text-[10px] text-muted-foreground/70 uppercase">Parcels Monitored</span>
            <span className="font-semibold text-foreground">5,842 Records</span>
          </div>
          <div>
            <span className="block text-[10px] text-muted-foreground/70 uppercase">Security Level</span>
            <span className="font-semibold text-foreground">Govt Encrypted</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: CLEAN LOGIN PANEL */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center gap-3 lg:hidden">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Globe2 className="size-5" aria-hidden />
            </span>
            <div>
              <span className="font-display text-base font-bold tracking-wider text-foreground">
                LANDVISION AI
              </span>
              <span className="block text-[9px] font-semibold tracking-widest text-primary uppercase">
                Government Portal
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary border border-primary/20">
              <ShieldCheck className="size-3.5" aria-hidden /> Secure National Gateway
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to your LandVision AI official account to manage land acquisition, FIR analytics, and project risks.
            </p>
          </div>

          <form onSubmit={submit} className="panel space-y-4 p-6 shadow-xl border-border">
            <div>
              <label htmlFor="email" className="text-xs font-semibold text-foreground">
                Email / Username
              </label>
              <div className="mt-1.5 flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-0.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                <Mail className="size-4 text-muted-foreground shrink-0" aria-hidden />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@landvision.gov.in"
                  className="w-full bg-transparent py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="text-xs font-semibold text-foreground">
                Password
              </label>
              <div className="mt-1.5 flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-0.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                <Lock className="size-4 text-muted-foreground shrink-0" aria-hidden />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-muted-foreground cursor-pointer select-none">
                <input type="checkbox" className="size-4 accent-primary rounded border-border" defaultChecked />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => toast.info("Password reset requests are processed by the State IT Cell.")}
                className="font-medium text-primary hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            {error ? (
              <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive-foreground">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy !== null}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
            >
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              <span>Login</span>
            </button>
          </form>

          {/* DEMO ACCOUNTS — shown only when no real backend is configured */}
          <div className="space-y-3 pt-2 border-t border-border">
            {!isSupabaseConfigured ? (
              <>
                <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Quick Demonstration Accounts
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {DEMO.map((d) => (
                    <button
                      key={d.role}
                      onClick={() => demoSignIn(d.role)}
                      disabled={busy !== null}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-left text-xs text-foreground transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-60 cursor-pointer"
                    >
                      <span className="min-w-0">
                        <span className="block font-semibold truncate">{ROLE_LABEL[d.role]}</span>
                        <span className="text-[10px] text-muted-foreground truncate block">{d.email}</span>
                      </span>
                      {busy === d.role ? <Loader2 className="size-3.5 animate-spin text-primary shrink-0" aria-hidden /> : null}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
            <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-primary" /> Audit-Logged Portal
              </span>
              <Link to="/public" className="text-primary font-medium hover:underline">
                Public Portal →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
