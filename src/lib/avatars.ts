import { supabase } from "@/integrations/supabase/client";

export const AVATAR_PREFIX = "storage:avatars/";

export async function resolveAvatar(value: string | null): Promise<string | null> {
  if (!value?.startsWith(AVATAR_PREFIX)) return value;
  const { data, error } = await supabase.storage.from("avatars").createSignedUrl(value.slice(AVATAR_PREFIX.length), 3600);
  if (error) return null;
  return data.signedUrl;
}