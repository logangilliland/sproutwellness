import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { readSettings, type Profile, type SproutSettings } from "@/lib/profile";

async function fetchProfile(userId: string): Promise<Profile> {
  const { data } = await supabase
    .from("profiles")
    .select("id,display_name,onboarded,settings")
    .eq("id", userId)
    .maybeSingle();

  if (!data) {
    await supabase.from("profiles").insert({ id: userId }).select().maybeSingle();
    return { id: userId, display_name: null, onboarded: false, settings: readSettings(null) };
  }
  return {
    id: data.id,
    display_name: data.display_name,
    onboarded: data.onboarded,
    settings: readSettings(data.settings),
  };
}

export function useProfile() {
  const { user, loading } = useAuth();
  const q = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
    staleTime: 10_000,
  });
  return { ...q, profile: q.data ?? null, authLoading: loading };
}

export function useRefreshProfile() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["profile"] });
}

export async function saveProfile(patch: {
  display_name?: string;
  onboarded?: boolean;
  settings?: SproutSettings;
}) {
  const { data: auth } = await supabase.auth.getUser();
  const id = auth.user?.id;
  if (!id) return;
  await supabase.from("profiles").upsert(
    {
      id,
      ...(patch.display_name !== undefined ? { display_name: patch.display_name } : {}),
      ...(patch.onboarded !== undefined ? { onboarded: patch.onboarded } : {}),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(patch.settings !== undefined ? { settings: patch.settings as any } : {}),
    },
    { onConflict: "id" },
  );
}
