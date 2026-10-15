import { useEffect, useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { resolveAvatar } from "@/lib/avatars";

export type Profile = { display_name: string | null; avatar_url: string | null; avatar_path?: string | null };

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  const loadProfile = useCallback(async (u: User | null) => {
    if (!u) { setProfile(null); return; }
    const { data } = await supabase.from("profiles").select("display_name, avatar_url").eq("id", u.id).maybeSingle();
    setProfile(data ? { ...data, avatar_path: data.avatar_url, avatar_url: await resolveAvatar(data.avatar_url) } : { display_name: u.email?.split("@")[0] ?? null, avatar_url: null });
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setTimeout(() => loadProfile(u), 0);
    });
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u); loadProfile(u).finally(() => setReady(true));
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  return { user, profile, ready, reloadProfile: () => loadProfile(user) };
}
