import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LifeData } from "@/lib/lifeos";
import { todayKey } from "@/lib/lifeos";
import type {
  DayScoreRow,
  PointActivity,
  PointCategory,
  PointSuggestion,
} from "@/lib/points";
import { ensureCategories, ensureSuggestions } from "@/lib/mutations";
import type { GardenPlant } from "@/lib/garden";
import { CATEGORY_SECTION, DIFFICULTIES, readSettings, sectionOn } from "@/lib/profile";

export type Job = {
  id: string;
  name: string;
  employer: string | null;
  position: string | null;
  pay_rate: number;
  pay_type: string;
  typical_hours: number | null;
  location: string | null;
  start_date: string | null;
  status: string;
  is_primary: boolean;
};

export type FullData = LifeData & {
  categories: PointCategory[];
  activities: PointActivity[];
  suggestions: PointSuggestion[];
  dayScores: DayScoreRow[];
  plants: GardenPlant[];
  jobs: Job[];
};

async function fetchPoints() {
  const [cats, acts, sugg, scores, plants] = await Promise.all([
    supabase.from("point_categories").select("*").order("sort_order"),
    supabase.from("point_activities").select("*").order("created_at", { ascending: false }),
    supabase.from("point_suggestions").select("*").order("sort_order"),
    supabase.from("day_scores").select("id,date,overall_pct,breakdown").order("date", { ascending: false }),
    supabase.from("garden_plants").select("*").order("date", { ascending: false }),
  ]);
  return {
    categories: (cats.data ?? []) as unknown as PointCategory[],
    activities: (acts.data ?? []) as unknown as PointActivity[],
    suggestions: (sugg.data ?? []) as unknown as PointSuggestion[],
    dayScores: (scores.data ?? []) as unknown as DayScoreRow[],
    plants: (plants.data ?? []) as unknown as GardenPlant[],
  };
}

async function fetchAll(): Promise<FullData> {
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
    jobs,
    profile,
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
    supabase.from("jobs").select("*").order("sort_order"),
    supabase.from("profiles").select("settings").maybeSingle(),
  ]);

  const settings = readSettings(profile.data?.settings ?? null);
  const target = DIFFICULTIES[settings.difficulty]?.target ?? 25;

  const jobRows = (jobs.data ?? []) as unknown as Job[];
  const activeJob =
    jobRows.find((j) => j.is_primary && j.status === "active") ??
    jobRows.find((j) => j.status === "active") ??
    jobRows[0] ??
    null;
  const goalRows = (goals.data ?? []) as LifeData["goals"];
  const projectRows = (projects.data ?? []) as LifeData["projects"];

  const enabledKeys = Object.entries(CATEGORY_SECTION)
    .filter(([, section]) => !section || sectionOn(settings, section))
    .map(([key]) => key);

  let points = await fetchPoints();
  if (!points.categories.length) {
    await ensureCategories(points.categories, target, enabledKeys);
    points = await fetchPoints();
  }
  const suggestionCtx = {
    jobName: activeJob?.name ?? null,
    goals: goalRows
      .filter((g) => g.status === "active")
      .map((g) => ({ name: g.name, category: g.category })),
    projects: projectRows.filter((p) => p.status === "active").map((p) => p.name),
  };
  const seeded = await ensureSuggestions(
    todayKey(),
    points.categories,
    points.suggestions,
    suggestionCtx,
  );
  if (seeded) points = await fetchPoints();

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
    jobs: jobRows,
    ...points,
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
