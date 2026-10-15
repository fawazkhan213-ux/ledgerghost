import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/AccountMenu";
import { Button } from "@/components/ui/button";
import { AVATAR_PREFIX } from "@/lib/avatars";

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
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (ready && !user) navigate({ to: "/auth" }); }, [ready, user, navigate]);
  useEffect(() => { setName(profile?.display_name ?? ""); setAvatar(profile?.avatar_url ?? ""); }, [profile]);
  useEffect(() => {
    if (!image) { setPreview(""); return; }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  if (!user) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setSaved(false); setError("");
    let uploadedPath: string | null = null;
    try {
      let avatarValue = profile?.avatar_path ?? profile?.avatar_url ?? null;
      if (image) {
        const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" }[image.type];
        if (!extension) throw new Error("Please choose a JPG, PNG, WebP or GIF image.");
        const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("avatars").upload(path, image, { contentType: image.type });
        if (uploadError) throw uploadError;
        uploadedPath = path;
        avatarValue = AVATAR_PREFIX + path;
      }
      const { error: saveError } = await supabase.from("profiles").upsert({ id: user.id, display_name: name.trim().slice(0, 60) || null, avatar_url: avatarValue, updated_at: new Date().toISOString() });
      if (saveError) throw saveError;
      const previousPath = profile?.avatar_path;
      await reloadProfile();
      setImage(null);
      if (fileInput.current) fileInput.current.value = "";
      setSaved(true);
      if (uploadedPath && previousPath?.startsWith(AVATAR_PREFIX)) {
        await supabase.storage.from("avatars").remove([previousPath.slice(AVATAR_PREFIX.length)]);
      }
    } catch {
      if (uploadedPath) await supabase.storage.from("avatars").remove([uploadedPath]);
      setError("Your changes couldn't be saved. Please try again.");
    } finally { setSaving(false); }
  };

  const selectImage = (file?: File) => {
    setSaved(false); setError("");
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) { setError("Please choose a JPG, PNG, WebP or GIF image."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Please choose an image smaller than 5 MB."); return; }
    setImage(file);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to audits</Link>
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-4">
          <Avatar user={user} profile={{ display_name: name, avatar_url: preview || avatar || null }} size={56} />
          <div className="min-w-0"><h1 className="text-xl font-bold">Your profile</h1><p className="break-words text-sm text-muted-foreground">{user.email}</p></div>
        </div>
        <form onSubmit={save} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">Display name
            <input value={name} maxLength={60} onChange={(e) => { setName(e.target.value); setSaved(false); }} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm font-normal" />
          </label>
          <div className="space-y-2">
            <p className="text-sm font-medium">Profile photo</p>
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" aria-label="Choose profile photo" className="hidden" disabled={saving} onChange={(e) => selectImage(e.target.files?.[0])} />
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" disabled={saving} onClick={() => fileInput.current?.click()}><Upload /> Choose image</Button>
              {image && <Button type="button" size="icon" variant="ghost" disabled={saving} aria-label="Cancel selected image" onClick={() => { setImage(null); if (fileInput.current) fileInput.current.value = ""; }}><X /></Button>}
            </div>
            <p className="break-words text-xs text-muted-foreground">{image ? image.name : "JPG, PNG, WebP or GIF · Up to 5 MB"}</p>
          </div>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
          </Button>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {saved && <p role="status" className="text-sm text-success">Saved.</p>}
        </form>
      </div>
    </div>
  );
}
