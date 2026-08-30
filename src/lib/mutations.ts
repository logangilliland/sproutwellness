import { supabase } from "@/integrations/supabase/client";
import { todayKey } from "@/lib/lifeos";

export async function logChange(summary: string, detail?: string) {
  await supabase.from("change_log").insert({ summary, detail: detail ?? null });
}

export async function toggleHabit(habitId: string, date: string, completed: boolean) {
  if (completed) {
    await supabase.from("habit_logs").upsert(
      { habit_id: habitId, date, completed: true },
      { onConflict: "habit_id,date" },
    );
  } else {
    await supabase.from("habit_logs").delete().eq("habit_id", habitId).eq("date", date);
  }
}

export async function toggleTask(id: string, done: boolean) {
  await supabase
    .from("tasks")
    .update({ done, done_at: done ? new Date().toISOString() : null })
    .eq("id", id);
}

export async function addTask(title: string, opts: Partial<{ date: string | null; priority: number; project_id: string | null }> = {}) {
  await supabase.from("tasks").insert({
    title,
    date: opts.date === undefined ? todayKey() : opts.date,
    priority: opts.priority ?? 2,
    project_id: opts.project_id ?? null,
  });
}

export async function deleteRow(table: string, id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from(table as any) as any).delete().eq("id", id);
}

export async function upsertDailyLog(date: string, patch: Record<string, unknown>) {
  await supabase.from("daily_logs").upsert({ date, ...patch }, { onConflict: "user_id,date" });
}

/* ---------- category point system ---------- */

export async function ensureCategories(existing: PointCategory[]) {
  if (existing.length) return;
  await supabase.from("point_categories").insert(
    DEFAULT_CATEGORIES.map((c) => ({
      key: c.key,
      label: c.label,
      emoji: c.emoji,
      daily_target: c.daily_target,
      sort_order: c.sort_order,
    })),
  );
}

export async function ensureSuggestions(
  date: string,
  categories: PointCategory[],
  existing: PointSuggestion[],
) {
  const missing = categories.filter(
    (c) => c.active && !existing.some((s) => s.date === date && s.category_id === c.id),
  );
  if (!missing.length) return false;
  const rows = missing.flatMap((c) =>
    (SUGGESTION_CATALOG[c.key] ?? []).slice(0, 5).map((s, i) => ({
      category_id: c.id,
      date,
      title: s.title,
      points: s.points,
      sort_order: i,
    })),
  );
  if (!rows.length) return false;
  await supabase.from("point_suggestions").insert(rows);
  return true;
}

export async function logActivity(input: {
  category_id: string;
  title: string;
  points: number;
  date?: string;
  reason?: string | null;
}) {
  await supabase.from("point_activities").insert({
    category_id: input.category_id,
    title: input.title,
    points: Math.round(input.points),
    date: input.date ?? todayKey(),
    reason: input.reason ?? null,
    source: "user",
  });
}

export async function deleteActivity(id: string) {
  await supabase.from("point_activities").delete().eq("id", id);
}

export async function setCategoryTarget(id: string, target: number) {
  await supabase
    .from("point_categories")
    .update({ daily_target: Math.max(1, Math.round(target)), updated_at: new Date().toISOString() })
    .eq("id", id);
}

export async function setAllTargets(ids: string[], target: number) {
  await supabase
    .from("point_categories")
    .update({ daily_target: Math.max(1, Math.round(target)), updated_at: new Date().toISOString() })
    .in("id", ids);
}

export async function addOptionalCategory(key: string) {
  const def = OPTIONAL_CATEGORIES.find((c) => c.key === key);
  if (!def) return;
  await supabase.from("point_categories").insert({
    key: def.key,
    label: def.label,
    emoji: def.emoji,
    daily_target: def.daily_target,
    sort_order: def.sort_order,
  });
}

export async function setCategoryActive(id: string, active: boolean) {
  await supabase.from("point_categories").update({ active }).eq("id", id);
}

export async function saveDayScore(
  date: string,
  breakdown: CategoryBreakdown[],
  overall: number,
) {
  await supabase.from("day_scores").upsert(
    {
      date,
      overall_pct: overall,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      breakdown: breakdown as any,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,date" },
  );
}
