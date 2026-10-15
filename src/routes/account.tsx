import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/AccountMenu";

export const Route = createFileRoute("/account")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Your profile — LedgerGhost" },
      { name: "description", content: "Manage your LedgerGhost display name and avatar." },
      { property: "og:title", content: "Your profile — LedgerGhost" },
      { property: "og:description", content: "Manage your LedgerGhost display name and avatar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user, profile, ready, reloadProfile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (ready && !user) navigate({ to: "/auth" }); }, [ready, user, navigate]);
  useEffect(() => { setName(profile?.display_name ?? ""); setAvatar(profile?.avatar_url ?? ""); }, [profile]);

  if (!user) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setSaved(false);
    const url = avatar.trim();
    await supabase.from("profiles").upsert({ id: user.id, display_name: name.trim().slice(0, 60) || null, avatar_url: /^https:\/\//.test(url) ? url : null, updated_at: new Date().toISOString() });
    await reloadProfile(); setSaving(false); setSaved(true);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to audits</Link>
      <div className="rounded-2xl border bg-card p-6">
        <div className="flex items-center gap-4">
          <Avatar user={user} profile={{ display_name: name, avatar_url: /^https:\/\//.test(avatar) ? avatar : null }} size={56} />
          <div><h1 className="text-xl font-bold">Your profile</h1><p className="text-sm text-muted-foreground">{user.email}</p></div>
        </div>
        <form onSubmit={save} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">Display name
            <input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm font-normal" />
          </label>
          <label className="block text-sm font-medium">Avatar image link
            <input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://…" className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm font-normal" />
          </label>
          <button disabled={saving} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
          </button>
          {saved && <p className="text-sm text-success">Saved.</p>}
        </form>
      </div>
    </div>
  );
}
