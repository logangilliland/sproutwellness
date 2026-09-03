/** Per-user configuration for Sprout. Everything here is user data, never hardcoded to a person. */

export type Difficulty = "easy" | "medium" | "hard";

export const DIFFICULTIES: Record<Difficulty, { label: string; target: number; blurb: string }> = {
  easy: { label: "Easy", target: 25, blurb: "~25 points per category each day." },
  medium: { label: "Medium", target: 35, blurb: "~35 points per category each day." },
  hard: { label: "Hard", target: 45, blurb: "~45 points per category each day." },
};

export type SectionKey =
  | "garden"
  | "habits"
  | "money"
  | "goals"
  | "projects"
  | "calendar"
  | "stats"
  | "school";

export const SECTIONS: Array<{
  key: SectionKey;
  label: string;
  emoji: string;
  blurb: string;
  locked?: boolean;
  comingSoon?: boolean;
}> = [
  { key: "garden", label: "Garden", emoji: "🌿", blurb: "Grow a plant every day from your score." },
  { key: "habits", label: "Habits", emoji: "✅", blurb: "Daily and weekly habits with streaks." },
  { key: "money", label: "Money", emoji: "💰", blurb: "Jobs, earnings, balances and spending." },
  { key: "goals", label: "Goals", emoji: "🎯", blurb: "Longer-term goals and progress." },
  { key: "projects", label: "Projects", emoji: "📁", blurb: "Multi-step projects with task lists." },
  { key: "calendar", label: "Calendar", emoji: "📅", blurb: "Events, deadlines and daily scores." },
  { key: "stats", label: "Stats", emoji: "📊", blurb: "Trends across everything you track." },
  { key: "school", label: "School", emoji: "🎓", blurb: "Classes and coursework.", comingSoon: true },
];

/** Point categories map onto these sections; disabling a section retires its category. */
export const CATEGORY_SECTION: Record<string, SectionKey | null> = {
  fitness: null,
  health: null,
  work: "money",
  projects: "projects",
  school: "school",
};

export type SproutSettings = {
  sections: Partial<Record<SectionKey, boolean>>;
  difficulty: Difficulty;
  lifeTags: string[];
};

export const DEFAULT_SETTINGS: SproutSettings = {
  sections: {
    garden: true,
    habits: true,
    money: true,
    goals: true,
    projects: true,
    calendar: true,
    stats: true,
    school: false,
  },
  difficulty: "easy",
  lifeTags: [],
};

export type Profile = {
  id: string;
  display_name: string | null;
  onboarded: boolean;
  settings: SproutSettings;
};

export function readSettings(raw: unknown): SproutSettings {
  const s = (raw ?? {}) as Partial<SproutSettings>;
  return {
    sections: { ...DEFAULT_SETTINGS.sections, ...(s.sections ?? {}), school: false },
    difficulty: (s.difficulty ?? DEFAULT_SETTINGS.difficulty) as Difficulty,
    lifeTags: s.lifeTags ?? [],
  };
}

export function sectionOn(settings: SproutSettings, key: SectionKey): boolean {
  return settings.sections[key] !== false;
}

/* ---------- optional starter libraries (templates only — never auto-applied) ---------- */

export const LIFE_TAGS = [
  { key: "working", label: "Working", emoji: "💼" },
  { key: "job_hunting", label: "Looking for work", emoji: "🔎" },
  { key: "school", label: "In school", emoji: "🎓" },
  { key: "fitness", label: "Fitness", emoji: "🏃" },
  { key: "saving", label: "Saving money", emoji: "💰" },
  { key: "building", label: "Building a project", emoji: "🛠️" },
  { key: "habits", label: "Improving habits", emoji: "✅" },
  { key: "other", label: "Something else", emoji: "✨" },
];

export const HABIT_LIBRARY: Array<{
  name: string;
  emoji: string;
  category: string;
  frequency: string;
  target_per_week: number;
}> = [
  { name: "Wake up at a reasonable time", emoji: "🌅", category: "morning", frequency: "daily", target_per_week: 7 },
  { name: "Make the bed", emoji: "🛏️", category: "morning", frequency: "daily", target_per_week: 7 },
  { name: "Shower", emoji: "🚿", category: "morning", frequency: "daily", target_per_week: 7 },
  { name: "Eat a real meal", emoji: "🍽️", category: "morning", frequency: "daily", target_per_week: 7 },
  { name: "Drink enough water", emoji: "💧", category: "morning", frequency: "daily", target_per_week: 7 },
  { name: "Exercise", emoji: "🏃", category: "fitness", frequency: "weekly", target_per_week: 4 },
  { name: "Walk 20+ minutes", emoji: "🚶", category: "fitness", frequency: "daily", target_per_week: 7 },
  { name: "Stretch / mobility", emoji: "🧘", category: "fitness", frequency: "daily", target_per_week: 5 },
  { name: "Work a shift", emoji: "💼", category: "money", frequency: "weekly", target_per_week: 5 },
  { name: "Track spending", emoji: "🧾", category: "money", frequency: "daily", target_per_week: 7 },
  { name: "Clean / tidy", emoji: "🧹", category: "life", frequency: "daily", target_per_week: 7 },
  { name: "Laundry", emoji: "🧺", category: "life", frequency: "weekly", target_per_week: 1 },
  { name: "Read", emoji: "📖", category: "night", frequency: "daily", target_per_week: 5 },
  { name: "No screens before bed", emoji: "📵", category: "night", frequency: "daily", target_per_week: 7 },
  { name: "Bed at a reasonable time", emoji: "😴", category: "night", frequency: "daily", target_per_week: 7 },
  { name: "Study session", emoji: "📚", category: "school", frequency: "daily", target_per_week: 5 },
  { name: "Vape-free day", emoji: "🫁", category: "health", frequency: "daily", target_per_week: 7 },
  { name: "Alcohol-free day", emoji: "🚫", category: "health", frequency: "daily", target_per_week: 7 },
  { name: "Meditate", emoji: "🕯️", category: "health", frequency: "daily", target_per_week: 7 },
  { name: "Journal", emoji: "📓", category: "night", frequency: "daily", target_per_week: 5 },
];

export const GOAL_LIBRARY: Array<{
  name: string;
  category: string;
  unit: string | null;
  target_value: number | null;
}> = [
  { name: "Save $1,000", category: "financial", unit: "dollars", target_value: 1000 },
  { name: "Build an emergency fund", category: "financial", unit: "dollars", target_value: 500 },
  { name: "Exercise 4x per week", category: "fitness", unit: "sessions/week", target_value: 4 },
  { name: "Run a 5K", category: "fitness", unit: "percent", target_value: 100 },
  { name: "Sleep 8 hours consistently", category: "health", unit: "good nights", target_value: 30 },
  { name: "Read 12 books this year", category: "personal", unit: "books", target_value: 12 },
  { name: "Ship a personal project", category: "career", unit: "percent", target_value: 100 },
  { name: "Find a new job", category: "career", unit: "percent", target_value: 100 },
];
