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
  /** School only: required homework for the day is still outstanding. */
  requiredIncomplete?: boolean;
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
    { title: "Work a shift", points: 25 },
    { title: "Work a short shift (2h)", points: 15 },
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

export type SuggestionContext = {
  /** Name of the user's active/primary job, if any. */
  jobName?: string | null;
  /** Active goals, used to bias suggestions toward what the user actually wants. */
  goals?: Array<{ name: string; category: string }>;
  /** Names of active projects. */
  projects?: string[];
};

/**
 * Build the day's suggestions for a category from the user's own data.
 * Nothing personal is hardcoded — job, goals and projects come from their account.
 */
export function buildSuggestions(
  key: string,
  ctx: SuggestionContext = {},
): Array<{ title: string; points: number }> {
  const base = [...(SUGGESTION_CATALOG[key] ?? [])];
  const out: Array<{ title: string; points: number }> = [];

  if (key === "work") {
    const job = ctx.jobName?.trim();
    if (!job) {
      // No job on file — don't invent a shift.
      out.push({ title: "Deep work block", points: 20 });
      out.push({ title: "Apply / follow up on work", points: 15 });
      out.push({ title: "Look for work for 30 min", points: 15 });
      return out;
    }
    out.push({ title: `Work a ${job} shift`, points: 25 });
    out.push({ title: `Work a short ${job} shift (2h)`, points: 15 });
    out.push(...base.filter((b) => !b.title.toLowerCase().includes("shift")));
    return out.slice(0, 5);
  }

  if (key === "projects" && ctx.projects?.length) {
    for (const p of ctx.projects.slice(0, 2)) {
      out.push({ title: `1 focused hour on ${p}`, points: 20 });
    }
  }

  const goalTitles = (ctx.goals ?? [])
    .filter((g) => goalMatchesCategory(g.category, key))
    .slice(0, 2)
    .map((g) => ({ title: `Step toward "${g.name}"`, points: 15 }));

  out.push(...goalTitles, ...base);
  const seen = new Set<string>();
  return out.filter((s) => !seen.has(s.title) && seen.add(s.title)).slice(0, 5);
}

function goalMatchesCategory(goalCategory: string, key: string) {
  const g = goalCategory.toLowerCase();
  if (key === "fitness") return g === "fitness" || g === "health";
  if (key === "health") return g === "health";
  if (key === "work") return g === "financial" || g === "career" || g === "work";
  if (key === "projects") return g === "personal" || g === "project" || g === "projects";
  if (key === "school") return g === "school" || g === "academic";
  return false;
}



export function computeBreakdown(
  categories: PointCategory[],
  activities: PointActivity[],
  date: string,
  opts: { schoolRequiredIncomplete?: boolean } = {},
): { breakdown: CategoryBreakdown[]; overall: number } {
  const active = categories
    .filter((c) => c.active)
    .sort((a, b) => a.sort_order - b.sort_order);
  const breakdown = active.map((c) => {
    const points = activities
      .filter((a) => a.date === date && a.category_id === c.id)
      .reduce((s, a) => s + Number(a.points), 0);
    const target = Math.max(1, c.daily_target);
    // School has a special rule: bonus points can never stand in for required homework.
    const blocked = c.key === "school" && !!opts.schoolRequiredIncomplete;
    const rawPct = Math.min(100, Math.round((points / target) * 100));
    return {
      key: c.key,
      label: c.label,
      emoji: c.emoji,
      points,
      target,
      bonus: Math.max(0, points - target),
      pct: blocked ? Math.min(rawPct, 99) : rawPct,
      requiredIncomplete: blocked,
    };
  });
  const overall = breakdown.length
    ? Math.round(breakdown.reduce((s, b) => s + b.pct, 0) / breakdown.length)
    : 0;
  return { breakdown, overall };
}

export function isPerfectDay(breakdown: CategoryBreakdown[]): boolean {
  return (
    breakdown.length > 0 && breakdown.every((b) => b.points >= b.target && !b.requiredIncomplete)
  );
}

export function scoreTone(pct: number): string {
  if (pct >= 100) return "text-primary";
  if (pct >= 70) return "text-fitness";
  if (pct >= 40) return "text-money";
  return "text-muted-foreground";
}
