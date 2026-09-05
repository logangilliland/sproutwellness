import { supabase } from "@/integrations/supabase/client";
import { todayKey } from "@/lib/lifeos";
import {
  DEFAULT_TERMS,
  sizePoints,
  type Assignment,
  type AssignmentSize,
} from "@/lib/school";

/* ---------- terms ---------- */

export async function ensureDefaultTerms(existing: number) {
  if (existing) return;
  await supabase.from("school_terms").insert(DEFAULT_TERMS);
}

export async function addTerm(input: { name: string; starts_on: string; ends_on: string }) {
  await supabase.from("school_terms").insert(input);
}

export async function archiveTerm(id: string, archived: boolean) {
  await supabase.from("school_terms").update({ archived }).eq("id", id);
}

/* ---------- classes ---------- */

export async function addClass(input: {
  name: string;
  class_code?: string | null;
  professor?: string | null;
  term_id?: string | null;
  meeting_times?: string | null;
  location?: string | null;
}) {
  const { data } = await supabase.from("classes").insert(input).select("id").maybeSingle();
  return data?.id ?? null;
}

export async function updateClass(id: string, patch: Record<string, unknown>) {
  await supabase.from("classes").update(patch).eq("id", id);
}

export async function deleteClass(id: string) {
  await supabase.from("classes").delete().eq("id", id);
}

/* ---------- assignments ---------- */

export type AssignmentInput = {
  title: string;
  class_id?: string | null;
  term_id?: string | null;
  description?: string | null;
  due_date?: string | null;
  due_time?: string | null;
  important?: boolean;
  size?: AssignmentSize;
  estimated_minutes?: number | null;
  is_large?: boolean;
  canvas_url?: string | null;
  canvas_id?: string | null;
  source?: string;
  first_steps?: string[];
};

export async function addAssignment(input: AssignmentInput) {
  const size = input.size ?? "medium";
  const { data } = await supabase
    .from("assignments")
    .insert({
      ...input,
      size,
      points: sizePoints(size),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      first_steps: (input.first_steps ?? []) as any,
    })
    .select("id")
    .maybeSingle();
  return data?.id ?? null;
}

export async function updateAssignment(id: string, patch: Record<string, unknown>) {
  if (typeof patch.size === "string") patch.points = sizePoints(patch.size as AssignmentSize);
  await supabase.from("assignments").update(patch).eq("id", id);
}

export async function deleteAssignment(id: string) {
  await supabase.from("assignments").delete().eq("id", id);
}

export async function toggleImportant(id: string, important: boolean) {
  await supabase.from("assignments").update({ important }).eq("id", id);
}

/**
 * Completing an assignment awards its School points on the day it was actually finished
 * (so finishing a Friday paper on Tuesday earns Tuesday's points).
 */
export async function completeAssignment(
  a: Assignment,
  schoolCategoryId: string | null,
  date = todayKey(),
) {
  await supabase
    .from("assignments")
    .update({
      status: "done",
      completed_on: date,
      progress: 100,
      points_awarded: a.points,
    })
    .eq("id", a.id);

  if (schoolCategoryId && a.points_awarded === 0) {
    const early = a.due_date && a.due_date > date;
    await supabase.from("point_activities").insert({
      category_id: schoolCategoryId,
      date,
      title: a.title,
      points: a.points,
      source: "assignment",
      reason: early ? "Finished early" : "Assignment completed",
    });
  }
}

export async function reopenAssignment(a: Assignment) {
  await supabase
    .from("assignments")
    .update({ status: "todo", completed_on: null, points_awarded: 0, progress: 0 })
    .eq("id", a.id);
  if (a.completed_on) {
    await supabase
      .from("point_activities")
      .delete()
      .eq("date", a.completed_on)
      .eq("source", "assignment")
      .eq("title", a.title);
  }
}

/* ---------- steps ---------- */

export async function addSteps(assignmentId: string, titles: string[], offset = 0) {
  if (!titles.length) return;
  await supabase.from("assignment_steps").insert(
    titles.map((title, i) => ({ assignment_id: assignmentId, title, sort_order: offset + i })),
  );
}

export async function toggleStep(id: string, done: boolean) {
  await supabase.from("assignment_steps").update({ done }).eq("id", id);
}

export async function updateStep(id: string, title: string) {
  await supabase.from("assignment_steps").update({ title }).eq("id", id);
}

export async function deleteStep(id: string) {
  await supabase.from("assignment_steps").delete().eq("id", id);
}

export async function syncProgress(assignmentId: string) {
  const { data } = await supabase
    .from("assignment_steps")
    .select("done")
    .eq("assignment_id", assignmentId);
  const rows = data ?? [];
  const pct = rows.length
    ? Math.round((rows.filter((r) => r.done).length / rows.length) * 100)
    : 0;
  await supabase.from("assignments").update({ progress: pct }).eq("id", assignmentId);
}

/* ---------- school to-dos ---------- */

export async function addSchoolTodo(input: {
  title: string;
  class_id?: string | null;
  due_date?: string | null;
  required?: boolean;
  points?: number;
}) {
  await supabase.from("school_todos").insert(input);
}

export async function toggleSchoolTodo(
  id: string,
  done: boolean,
  opts: { title: string; points: number; schoolCategoryId: string | null; date?: string },
) {
  const date = opts.date ?? todayKey();
  await supabase.from("school_todos").update({ done }).eq("id", id);
  if (!opts.schoolCategoryId) return;
  if (done) {
    await supabase.from("point_activities").insert({
      category_id: opts.schoolCategoryId,
      date,
      title: opts.title,
      points: opts.points,
      source: "school_todo",
      reason: "School to-do completed",
    });
  } else {
    await supabase
      .from("point_activities")
      .delete()
      .eq("date", date)
      .eq("source", "school_todo")
      .eq("title", opts.title);
  }
}

export async function deleteSchoolTodo(id: string) {
  await supabase.from("school_todos").delete().eq("id", id);
}
