import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Ghost, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — LedgerGhost" },
      { name: "description", content: "Sign in to LedgerGhost to save your statement audits and dispute letters across devices." },
      { property: "og:title", content: "Sign in — LedgerGhost" },
      { property: "og:description", content: "Save your statement audits and dispute letters across devices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "err" | "ok"; text: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/" }); });
    const { data: sub } = supabase.auth.onAuthStateChange((e, s) => { if (e === "SIGNED_IN" && s) navigate({ to: "/" }); });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({
          email, password, options: { emailRedirectTo: window.location.origin, data: { display_name: name.trim() || undefined } },
        });
        if (error) throw error;
        if (!data.session) setMsg({ kind: "ok", text: "Check your email to confirm your account, then sign in." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) { setMsg({ kind: "err", text: (err as Error).message }); }
    finally { setBusy(false); }
  };

  const google = async () => {
    setMsg(null);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) setMsg({ kind: "err", text: r.error.message ?? "Google sign-in failed" });
  };

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground"><Ghost className="h-4 w-4" /></span>
          LedgerGhost
        </Link>
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-bold">{mode === "in" ? "Welcome back" : "Create your account"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your audits follow you on every device.</p>
          <button onClick={google} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border bg-background py-2.5 text-sm font-medium hover:bg-secondary">
            <svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="currentColor" d="M21.35 11.1H12v2.98h5.35c-.23 1.5-1.7 4.4-5.35 4.4-3.22 0-5.85-2.67-5.85-5.96S8.78 6.56 12 6.56c1.83 0 3.06.78 3.76 1.45l2.57-2.47C16.68 4 14.55 3 12 3 7.03 3 3 7.03 3 12s4.03 9 9 9c5.2 0 8.64-3.65 8.64-8.8 0-.6-.07-1.05-.29-1.1Z" /></svg>
            Continue with Google
          </button>
          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
          <form onSubmit={submit} className="space-y-3">
            {mode === "up" && <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Display name" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />}
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            {msg && <p className={`text-sm ${msg.kind === "err" ? "text-destructive" : "text-success"}`}>{msg.text}</p>}
            <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}{mode === "in" ? "Sign in" : "Create account"}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {mode === "in" ? "New here?" : "Already have an account?"}{" "}
            <button onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(null); }} className="font-medium text-primary hover:underline">{mode === "in" ? "Create an account" : "Sign in"}</button>
          </p>
        </div>
      </div>
    </div>
  );
}
