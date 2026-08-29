export type Habit = {
  id: string;
  name: string;
  emoji: string;
  category: string;
  frequency: string;
  target_per_week: number;
  weight: number;
  active: boolean;
  sort_order: number;
};

export type HabitLog = { id: string; habit_id: string; date: string; completed: boolean };

export type Task = {
  id: string;
  title: string;
  notes: string | null;
  date: string | null;
  priority: number;
  done: boolean;
  done_at: string | null;
  project_id: string | null;
  sort_order: number;
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
  deadline: string | null;
  priority: number;
  status: string;
};

export type Goal = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  deadline: string | null;
  target_value: number | null;
  current_value: number;
  unit: string | null;
  priority: number;
  status: string;
};

export type LifeEvent = {
  id: string;
  title: string;
  type: string;
  date: string;
  end_date: string | null;
  time: string | null;
  location: string | null;
  notes: string | null;
  is_milestone: boolean;
};

export type SchoolClass = {
  id: string;
  name: string;
  professor: string | null;
  location: string | null;
  meeting_times: string | null;
  term: string | null;
  notes: string | null;
};

export type Account = {
  id: string;
  name: string;
  kind: string;
  balance: number;
  is_savings: boolean;
  sort_order: number;
};

export type Txn = {
  id: string;
  date: string;
  amount: number;
  kind: string;
  category: string | null;
  notes: string | null;
};

export type Shift = {
  id: string;
  date: string;
  hours: number;
  earnings: number;
  miles: number | null;
  notes: string | null;
};

export type DailyLog = {
  id: string;
  date: string;
  vape_free: boolean | null;
  weed_night_only: boolean | null;
  exercise_minutes: number;
  mood: number | null;
  notes: string | null;
  productivity_score: number | null;
};

export type ChangeEntry = { id: string; summary: string; detail: string | null; created_at: string };

export type LifeData = {
  habits: Habit[];
  habitLogs: HabitLog[];
  tasks: Task[];
  projects: Project[];
  goals: Goal[];
  events: LifeEvent[];
  classes: SchoolClass[];
  accounts: Account[];
  transactions: Txn[];
  shifts: Shift[];
  dailyLogs: DailyLog[];
  changes: ChangeEntry[];
};

export const CATEGORY_META: Record<string, { label: string; emoji: string }> = {
  morning: { label: "Morning", emoji: "🌅" },
  money: { label: "Money", emoji: "💰" },
  fitness: { label: "Fitness", emoji: "🏃" },
  life: { label: "Life", emoji: "🧹" },
  vape: { label: "Vape", emoji: "🚭" },
  night: { label: "Night", emoji: "🌙" },
  school: { label: "School", emoji: "🎓" },
};

export const GOAL_CATEGORIES = [
  { value: "financial", label: "💰 Financial" },
  { value: "fitness", label: "🏃 Fitness" },
  { value: "school", label: "🎓 School" },
  { value: "health", label: "🚭 Health / habits" },
  { value: "personal", label: "🧹 Personal" },
  { value: "social", label: "👥 Social" },
  { value: "living", label: "🏠 Living" },
  { value: "career", label: "💼 Career" },
  { value: "travel", label: "🎒 Travel" },
];

export const EVENT_TYPES = [
  "school",
  "exam",
  "assignment",
  "deadline",
  "break",
  "holiday",
  "fraternity",
  "trip",
  "work",
  "personal",
];

/* ---------- date helpers (local time, YYYY-MM-DD) ---------- */

export function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}


export function todayKey(): string {
  return toKey(new Date());
}

export function addDays(key: string, n: number): string {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((fromKey(b).getTime() - fromKey(a).getTime()) / 86400000);
}

export function startOfWeekKey(key = todayKey()): string {
  const d = fromKey(key);
  const shift = (d.getDay() + 6) % 7; // Monday start
  d.setDate(d.getDate() - shift);
  return toKey(d);
}

export function lastNDays(n: number, end = todayKey()): string[] {
  return Array.from({ length: n }, (_, i) => addDays(end, -(n - 1 - i)));
}

export function prettyDate(key: string): string {
  return fromKey(key).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function longDate(key: string): string {
  return fromKey(key).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function money(n: number): string {
  return `$${(Math.round(n * 100) / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/* ---------- scoring ---------- */

export function habitsDueOn(habits: Habit[], _key: string) {
  return habits.filter((h) => h.active);
}

export function productivityScore(data: LifeData, key: string): number {
  const tasks = data.tasks.filter((t) => t.date === key);
  const habits = habitsDueOn(data.habits, key);
  const logs = new Set(
    data.habitLogs.filter((l) => l.date === key && l.completed).map((l) => l.habit_id),
  );

  // Tasks weighted by priority (1 = most important)
  const taskWeight = (p: number) => (p === 1 ? 3 : p === 2 ? 2 : 1);
  const taskTotal = tasks.reduce((s, t) => s + taskWeight(t.priority), 0);
  const taskDone = tasks.filter((t) => t.done).reduce((s, t) => s + taskWeight(t.priority), 0);
  const taskPart = taskTotal ? taskDone / taskTotal : null;

  const habitTotal = habits.reduce((s, h) => s + h.weight, 0);
  const habitDone = habits.filter((h) => logs.has(h.id)).reduce((s, h) => s + h.weight, 0);
  const habitPart = habitTotal ? habitDone / habitTotal : null;

  const worked = data.shifts.some((s) => s.date === key && s.hours > 0);
  const log = data.dailyLogs.find((l) => l.date === key);
  const exercised = (log?.exercise_minutes ?? 0) > 0;

  let score = 0;
  let weight = 0;
  if (taskPart !== null) {
    score += taskPart * 50;
    weight += 50;
  }
  if (habitPart !== null) {
    score += habitPart * 35;
    weight += 35;
  }
  score += (worked ? 1 : 0) * 8;
  weight += 8;
  score += (exercised ? 1 : 0) * 7;
  weight += 7;

  if (!weight) return 0;
  // Forgiving curve: never let one missed small habit tank the day.
  const raw = (score / weight) * 100;
  return Math.round(Math.min(100, raw * 0.9 + (raw > 0 ? 10 : 0)));
}

export function streak(dates: Set<string>, endKey = todayKey()): number {
  let n = 0;
  let cur = endKey;
  // allow today to be incomplete without breaking the streak
  if (!dates.has(cur)) cur = addDays(cur, -1);
  while (dates.has(cur)) {
    n++;
    cur = addDays(cur, -1);
  }
  return n;
}

export function bestStreak(dates: string[]): number {
  const sorted = [...new Set(dates)].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev && daysBetween(prev, d) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export function habitCompletionDates(data: LifeData, habitId: string): string[] {
  return data.habitLogs.filter((l) => l.habit_id === habitId && l.completed).map((l) => l.date);
}

export function vapeFreeDates(data: LifeData): string[] {
  const habit = data.habits.find((h) => h.name.toLowerCase().includes("vape-free"));
  const fromHabit = habit ? habitCompletionDates(data, habit.id) : [];
  const fromLogs = data.dailyLogs.filter((l) => l.vape_free).map((l) => l.date);
  return [...new Set([...fromHabit, ...fromLogs])];
}

export function weekEarnings(data: LifeData, weekStart = startOfWeekKey()): number {
  return data.shifts
    .filter((s) => s.date >= weekStart && s.date <= addDays(weekStart, 6))
    .reduce((sum, s) => sum + Number(s.earnings), 0);
}

export function totalMoney(data: LifeData): number {
  return data.accounts.reduce((s, a) => s + Number(a.balance), 0);
}

export function exerciseThisWeek(data: LifeData): number {
  const ws = startOfWeekKey();
  const fromLogs = data.dailyLogs.filter(
    (l) => l.date >= ws && l.exercise_minutes > 0,
  ).length;
  const habit = data.habits.find((h) => h.category === "fitness" && h.name.startsWith("Exercise"));
  const fromHabit = habit
    ? data.habitLogs.filter((l) => l.habit_id === habit.id && l.completed && l.date >= ws).length
    : 0;
  return Math.max(fromLogs, fromHabit);
}

export type LifeScore = { total: number; parts: { key: string; label: string; value: number }[] };

export function lifeScore(data: LifeData): LifeScore {
  const days = lastNDays(14);
  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

  const catScore = (cat: string) => {
    const habits = data.habits.filter((h) => h.active && h.category === cat);
    if (!habits.length) return 0;
    const ids = new Set(habits.map((h) => h.id));
    const done = data.habitLogs.filter(
      (l) => ids.has(l.habit_id) && l.completed && days.includes(l.date),
    ).length;
    return Math.round(Math.min(100, (done / (habits.length * days.length)) * 100 * 1.15));
  };

  const moneyGoal = data.goals.find((g) => g.category === "financial" && g.status === "active");
  const earned = weekEarnings(data);
  const target = Number(moneyGoal?.target_value ?? 250);
  const moneyVal = Math.round(Math.min(100, (earned / Math.max(1, target)) * 100));

  const fitnessVal = Math.round(Math.min(100, (exerciseThisWeek(data) / 4) * 100));
  const vapeVal = Math.round(Math.min(100, streak(new Set(vapeFreeDates(data))) * 8));
  const respVal = catScore("life");
  const routineVal = Math.round((catScore("morning") + catScore("night")) / 2);
  const prodVal = Math.round(avg(days.map((d) => productivityScore(data, d))));

  const parts = [
    { key: "money", label: "💰 Money", value: moneyVal },
    { key: "fitness", label: "🏃 Fitness", value: fitnessVal },
    { key: "vape", label: "🚭 Vaping", value: vapeVal },
    { key: "resp", label: "🧹 Responsibilities", value: respVal },
    { key: "routine", label: "🌅 Routine", value: routineVal },
    { key: "prod", label: "📊 Productivity", value: prodVal },
  ];
  return { total: Math.round(avg(parts.map((p) => p.value))), parts };
}

export function nextMilestone(events: LifeEvent[], key = todayKey()) {
  return (
    [...events]
      .filter((e) => e.date >= key)
      .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null
  );
}

export function phaseFor(events: LifeEvent[], key = todayKey()) {
  const milestone = events.find((e) => e.is_milestone);
  if (milestone && key < milestone.date) {
    return { name: "PHASE 1 — RESET", detail: `Through ${prettyDate(milestone.date)}` };
  }
  return { name: "PHASE 2 — COLLEGE", detail: "Ongoing life management" };
}
