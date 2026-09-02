import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Globe2, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { ROLE_LABEL, useLV } from "@/lib/lv/store";
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
  const { login, users } = useLV();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const signIn = (role: Role) => {
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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const match = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!match) {
      setError("We could not find an account with that email address.");
      return;
    }
    if (password.length < 4) {
      setError("Please enter your password (minimum 4 characters for this demonstration).");
      return;
    }
    signIn(match.role);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between border-r border-border bg-surface p-10 lg:flex">
        <div className="grid-backdrop pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <Link to="/" className="relative flex items-center gap-2">
          <Globe2 className="size-5 text-primary" aria-hidden />
          <span className="font-display text-sm font-bold tracking-widest text-foreground">LANDVISION AI</span>
        </Link>
        <div className="relative flex justify-center">
          <HeroMap />
        </div>
        <p className="relative max-w-md text-sm text-muted-foreground">
          Predict delays. Identify bottlenecks. Prioritize intervention. Accelerate infrastructure.
        </p>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <Globe2 className="size-5 text-primary" aria-hidden />
            <span className="font-display text-sm font-bold tracking-widest text-foreground">LANDVISION AI</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Government portal sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Authorised officials only. All actions in this portal are audit-logged.
          </p>

          <form onSubmit={submit} className="panel mt-6 space-y-4 p-6">
            <div>
              <label htmlFor="email" className="text-xs font-medium text-muted-foreground">
                Official email
              </label>
              <div className="mt-1.5 flex items-center gap-2 rounded-md border border-border bg-background px-3">
                <Mail className="size-4 text-muted-foreground" aria-hidden />
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
              <label htmlFor="password" className="text-xs font-medium text-muted-foreground">
                Password
              </label>
              <div className="mt-1.5 flex items-center gap-2 rounded-md border border-border bg-background px-3">
                <Lock className="size-4 text-muted-foreground" aria-hidden />
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
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-muted-foreground">
                <input type="checkbox" className="size-3.5 accent-[var(--primary)]" /> Remember me
              </label>
              <button
                type="button"
                onClick={() => toast.info("Password reset requests are handled by the state IT cell.")}
                className="text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>
            {error ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive-foreground">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={busy !== null}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-shadow hover:shadow-[var(--shadow-glow)] disabled:opacity-60"
            >
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null} Login
            </button>
          </form>

          <div className="mt-6">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Demonstration accounts
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {DEMO.map((d) => (
                <button
                  key={d.role}
                  onClick={() => signIn(d.role)}
                  disabled={busy !== null}
                  className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2.5 text-left text-xs text-foreground transition-colors hover:border-primary/50 disabled:opacity-60"
                >
                  <span>
                    <span className="block font-semibold">{ROLE_LABEL[d.role]} Demo</span>
                    <span className="text-muted-foreground">{d.email}</span>
                  </span>
                  {busy === d.role ? <Loader2 className="size-3.5 animate-spin text-primary" aria-hidden /> : null}
                </button>
              ))}
            </div>
            <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
              Demonstration environment. No real government credentials or citizen data are used.
            </p>
            <Link to="/public" className="mt-4 inline-block text-xs text-primary hover:underline">
              Continue to the public portal instead →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
