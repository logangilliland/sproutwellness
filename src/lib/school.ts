/** School domain logic: terms, assignments, sizing, priority and the required-work rule. */

import { addDays, daysBetween, prettyDate, todayKey } from "@/lib/lifeos";

export type SchoolTerm = {
  id: string;
  name: string;
  starts_on: string;
  ends_on: string;
  archived: boolean;
};

export type SchoolClass = {
  id: string;
  name: string;
  class_code: string | null;
  professor: string | null;
  location: string | null;
  meeting_times: string | null;
  term: string | null;
  term_id: string | null;
  canvas_course_id: string | null;
  color: string | null;
  notes: string | null;
};

export type AssignmentSize = "small" | "medium" | "large" | "major";

export type Assignment = {
  id: string;
  class_id: string | null;
  term_id: string | null;
  canvas_id: string | null;
  canvas_url: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  due_time: string | null;
  source: string;
  status: string;
  completed_on: string | null;
  important: boolean;
  size: AssignmentSize;
  estimated_minutes: number | null;
  points: number;
  is_large: boolean;
  progress: number;
  first_steps: string[];
  points_awarded: number;
  created_at: string;
};

export type AssignmentStep = {
  id: string;
  assignment_id: string;
  title: string;
  done: boolean;
  sort_order: number;
};

export type SchoolTodo = {
  id: string;
  class_id: string | null;
  title: string;
  notes: string | null;
  due_date: string | null;
  done: boolean;
  required: boolean;
  points: number;
  sort_order: number;
};

export const SIZE_META: Record<AssignmentSize, { label: string; points: number; minutes: number }> =
  {
    small: { label: "Small", points: 5, minutes: 30 },
    medium: { label: "Medium", points: 10, minutes: 60 },
    large: { label: "Large", points: 18, minutes: 180 },
    major: { label: "Major project", points: 25, minutes: 480 },
  };

/** Default OSU terms offered the first time a user opens School. */
export const DEFAULT_TERMS = [
  { name: "Fall 2026", starts_on: "2026-09-23", ends_on: "2026-12-11" },
  { name: "Winter 2027", starts_on: "2027-01-04", ends_on: "2027-03-19" },
  { name: "Spring 2027", starts_on: "2027-03-29", ends_on: "2027-06-11" },
];

export function sizePoints(size: AssignmentSize): number {
  return SIZE_META[size]?.points ?? 10;
}

export function isDone(a: Assignment) {
  return a.status === "done";
}

/** Assignments that MUST be finished on a given day. These can never be deleted from the day. */
export function requiredOn(assignments: Assignment[], date: string): Assignment[] {
  return assignments.filter((a) => a.due_date === date);
}

export function requiredRemaining(assignments: Assignment[], date: string): Assignment[] {
  return requiredOn(assignments, date).filter((a) => !isDone(a));
}

/** Overdue but unfinished work still counts as required today. */
export function overdue(assignments: Assignment[], date = todayKey()): Assignment[] {
  return assignments.filter((a) => !isDone(a) && a.due_date && a.due_date < date);
}

export function schoolRequiredComplete(assignments: Assignment[], date: string): boolean {
  return requiredRemaining(assignments, date).length === 0;
}

export type Urgency = "due" | "soon" | "starred" | "upcoming" | "done";

export function urgencyOf(a: Assignment, today = todayKey()): Urgency {
  if (isDone(a)) return "done";
  if (!a.due_date) return "upcoming";
  const left = daysBetween(today, a.due_date);
  if (left <= 0) return "due";
  if (left <= 2) return "soon";
  if (a.important && left <= 7) return "starred";
  return "upcoming";
}

/** What the user should actually do next on a starred/large assignment as the deadline closes in. */
export function nextStepHint(a: Assignment, steps: AssignmentStep[], today = todayKey()): string {
  const open = steps.filter((s) => s.assignment_id === a.id && !s.done);
  if (open.length) return open[0]!.title;
  const first = a.first_steps.find(Boolean);
  if (!a.due_date) return first ?? "Make a start";
  const left = daysBetween(today, a.due_date);
  if (left <= 0) return "Finish and submit today";
  if (left <= 2) return "Finish the draft";
  if (left <= 4) return first ?? "Build the outline";
  return first ?? "Start researching";
}

export function dueLabel(a: Assignment, today = todayKey()): string {
  if (!a.due_date) return "No due date";
  const left = daysBetween(today, a.due_date);
  if (left === 0) return "Due today";
  if (left === 1) return "Due tomorrow";
  if (left < 0) return `Overdue by ${Math.abs(left)}d`;
  return `Due ${prettyDate(a.due_date)} · ${left}d`;
}

/** Group this week's assignments by class for "Week at a Glance". */
export function weekPlan(
  assignments: Assignment[],
  classes: SchoolClass[],
  weekStart: string,
): Array<{ cls: SchoolClass | null; days: Array<{ date: string; items: Assignment[] }> }> {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const inWeek = assignments.filter((a) => a.due_date && days.includes(a.due_date));
  const ids = [...new Set(inWeek.map((a) => a.class_id))];
  return ids
    .map((id) => ({
      cls: classes.find((c) => c.id === id) ?? null,
      days: days
        .map((d) => ({ date: d, items: inWeek.filter((a) => a.class_id === id && a.due_date === d) }))
        .filter((d) => d.items.length),
    }))
    .sort((a, b) => (a.cls?.name ?? "zzz").localeCompare(b.cls?.name ?? "zzz"));
}

export function termFor(terms: SchoolTerm[], date = todayKey()): SchoolTerm | null {
  return terms.find((t) => t.starts_on <= date && date <= t.ends_on) ?? null;
}
