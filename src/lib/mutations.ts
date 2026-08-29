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
