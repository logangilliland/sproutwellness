import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LifeData } from "@/lib/lifeos";

async function fetchAll(): Promise<LifeData> {
  await supabase.rpc("seed_life_os");
  const [
    habits,
    habitLogs,
    tasks,
    projects,
    goals,
    events,
    classes,
    accounts,
    transactions,
    shifts,
    dailyLogs,
    changes,
  ] = await Promise.all([
    supabase.from("habits").select("*").order("sort_order"),
    supabase.from("habit_logs").select("*"),
    supabase.from("tasks").select("*").order("sort_order"),
    supabase.from("projects").select("*").order("created_at"),
    supabase.from("goals").select("*").order("priority"),
    supabase.from("events").select("*").order("date"),
    supabase.from("classes").select("*").order("created_at"),
    supabase.from("accounts").select("*").order("sort_order"),
    supabase.from("transactions").select("*").order("date", { ascending: false }),
    supabase.from("work_shifts").select("*").order("date", { ascending: false }),
    supabase.from("daily_logs").select("*").order("date", { ascending: false }),
    supabase.from("change_log").select("*").order("created_at", { ascending: false }).limit(80),
  ]);

  return {
    habits: (habits.data ?? []) as LifeData["habits"],
    habitLogs: (habitLogs.data ?? []) as LifeData["habitLogs"],
    tasks: (tasks.data ?? []) as LifeData["tasks"],
    projects: (projects.data ?? []) as LifeData["projects"],
    goals: (goals.data ?? []) as LifeData["goals"],
    events: (events.data ?? []) as LifeData["events"],
    classes: (classes.data ?? []) as LifeData["classes"],
    accounts: (accounts.data ?? []) as LifeData["accounts"],
    transactions: (transactions.data ?? []) as LifeData["transactions"],
    shifts: (shifts.data ?? []) as LifeData["shifts"],
    dailyLogs: (dailyLogs.data ?? []) as LifeData["dailyLogs"],
    changes: (changes.data ?? []) as LifeData["changes"],
  };
}

export function useLifeData(enabled = true) {
  return useQuery({
    queryKey: ["life-data"],
    queryFn: fetchAll,
    enabled,
    staleTime: 10_000,
  });
}

export function useRefreshLife() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["life-data"] });
}
