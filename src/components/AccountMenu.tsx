import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, UserRound } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/hooks/useAuth";

export function Avatar({ profile, user, size = 32 }: { profile: Profile | null; user: User; size?: number }) {
  const name = profile?.display_name || user.email || "?";
  return profile?.avatar_url ? (
    <img src={profile.avatar_url} alt={name} style={{ width: size, height: size }} className="rounded-full object-cover" />
  ) : (
    <span style={{ width: size, height: size }} className="grid place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function AccountMenu({ user, profile }: { user: User | null; profile: Profile | null }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  if (!user) {
    return <Link to="/auth" className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-secondary">Sign in</Link>;
  }
  const signOut = async () => { setOpen(false); await supabase.auth.signOut(); navigate({ to: "/", replace: true }); };
  return (
    <div className="relative">
      <button aria-label="Account menu" onClick={() => setOpen(!open)} className="rounded-full ring-offset-2 ring-offset-background hover:ring-2 hover:ring-primary/50">
        <Avatar profile={profile} user={user} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border bg-popover p-1 text-popover-foreground shadow-xl">
            <div className="px-3 py-2">
              <p className="truncate text-sm font-semibold">{profile?.display_name || "Your account"}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Link to="/account" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-secondary"><UserRound className="h-4 w-4" /> Profile</Link>
            <button onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-secondary"><LogOut className="h-4 w-4" /> Sign out</button>
          </div>
        </>
      )}
    </div>
  );
}
