export type PointCategory = {
  id: string;
  key: string;
  label: string;
  emoji: string;
  daily_target: number;
  active: boolean;
  sort_order: number;
};

export type PointActivity = {
  id: string;
  category_id: string;
  date: string;
  title: string;
  points: number;
  reason: string | null;
  source: string;
  created_at: string;
};

export type PointSuggestion = {
  id: string;
  category_id: string;
  date: string;
  title: string;
  points: number;
  sort_order: number;
};

export type DayScoreRow = {
  id: string;
  date: string;
  overall_pct: number;
  breakdown: CategoryBreakdown[];
};

export type CategoryBreakdown = {
  key: string;
  label: string;
  emoji: string;
  points: number;
  target: number;
  bonus: number;
  pct: number;
};

export const DEFAULT_TARGET = 25;

export const DEFAULT_CATEGORIES: Array<Omit<PointCategory, "id">> = [
  { key: "fitness", label: "Fitness", emoji: "🏃", daily_target: 25, active: true, sort_order: 1 },
  { key: "health", label: "Health", emoji: "❤️", daily_target: 25, active: true, sort_order: 2 },
  { key: "work", label: "Work", emoji: "💰", daily_target: 25, active: true, sort_order: 3 },
  { key: "projects", label: "Projects", emoji: "📁", daily_target: 25, active: true, sort_order: 4 },
];

/** Optional categories a user can switch on later (e.g. when school starts). */
export const OPTIONAL_CATEGORIES: Array<Omit<PointCategory, "id">> = [
  { key: "school", label: "School", emoji: "📚", daily_target: 25, active: true, sort_order: 5 },
];

/** Fallback suggestion catalog. The AI can add/replace these per day. */
export const SUGGESTION_CATALOG: Record<string, Array<{ title: string; points: number }>> = {
  fitness: [
    { title: "Gym session", points: 25 },
    { title: "Run", points: 20 },
    { title: "Hike", points: 25 },
    { title: "Bike ride", points: 20 },
    { title: "Home workout", points: 15 },
    { title: "Long walk (30+ min)", points: 10 },
  ],
  health: [
    { title: "Real meal with protein", points: 15 },
    { title: "Shower", points: 10 },
    { title: "Drink water all day", points: 10 },
    { title: "In bed at a reasonable time", points: 15 },
    { title: "Cook instead of takeout", points: 15 },
  ],
  work: [
    { title: "Work a 2 hour shift", points: 15 },
    { title: "Work a 4 hour shift", points: 25 },
    { title: "Deep work block", points: 20 },
    { title: "Apply / follow up on work", points: 15 },
  ],
  projects: [
    { title: "1 focused hour on a project", points: 20 },
    { title: "Finish one small task", points: 10 },
    { title: "Laundry", points: 10 },
    { title: "Clean & tidy your space", points: 15 },
    { title: "Plan the next project step", points: 10 },
  ],
  school: [
    { title: "1 hour of coursework", points: 20 },
    { title: "Readings for one class", points: 15 },
    { title: "Plan the week's assignments", points: 10 },
    { title: "Office hours / study group", points: 15 },
  ],
};


export function computeBreakdown(
  categories: PointCategory[],
  activities: PointActivity[],
  date: string,
): { breakdown: CategoryBreakdown[]; overall: number } {
  const active = categories
    .filter((c) => c.active)
    .sort((a, b) => a.sort_order - b.sort_order);
  const breakdown = active.map((c) => {
    const points = activities
      .filter((a) => a.date === date && a.category_id === c.id)
      .reduce((s, a) => s + Number(a.points), 0);
    const target = Math.max(1, c.daily_target);
    return {
      key: c.key,
      label: c.label,
      emoji: c.emoji,
      points,
      target,
      bonus: Math.max(0, points - target),
      pct: Math.min(100, Math.round((points / target) * 100)),
    };
  });
  const overall = breakdown.length
    ? Math.round(breakdown.reduce((s, b) => s + b.pct, 0) / breakdown.length)
    : 0;
  return { breakdown, overall };
}

export function isPerfectDay(breakdown: CategoryBreakdown[]): boolean {
  return breakdown.length > 0 && breakdown.every((b) => b.points >= b.target);
}

export function scoreTone(pct: number): string {
  if (pct >= 100) return "text-primary";
  if (pct >= 70) return "text-fitness";
  if (pct >= 40) return "text-money";
  return "text-muted-foreground";
}
