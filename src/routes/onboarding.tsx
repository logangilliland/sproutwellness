import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sprout } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useRefreshProfile, saveProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  DEFAULT_SETTINGS,
  DIFFICULTIES,
  GOAL_LIBRARY,
  HABIT_LIBRARY,
  LIFE_TAGS,
  SECTIONS,
  type Difficulty,
  type SectionKey,
  type SproutSettings,
} from "@/lib/profile";
import { addJob, ensureCategories } from "@/lib/mutations";
import { DEFAULT_CATEGORIES } from "@/lib/points";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your Sprout" },
      {
        name: "description",
        content:
          "Tell Sprout your name, what you're working on and how hard you want your daily targets to be.",
      },
      { property: "og:title", content: "Set up your Sprout" },
      {
        property: "og:description",
        content: "A few quick questions and your daily garden starts growing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Onboarding,
});

const STEPS = ["Name", "Life", "Work", "Goals", "Habits", "Sections", "Difficulty"] as const;

function Onboarding() {
  const { session, loading } = useAuth();
  const { profile } = useProfile();
  const refreshProfile = useRefreshProfile();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [job, setJob] = useState({ name: "", employer: "", position: "", pay_rate: "", pay_type: "hourly" });
  const [goals, setGoals] = useState<string[]>([]);
  const [customGoal, setCustomGoal] = useState("");
  const [habits, setHabits] = useState<string[]>([]);
  const [sections, setSections] = useState<Partial<Record<SectionKey, boolean>>>(
    DEFAULT_SETTINGS.sections,
  );
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  useEffect(() => {
    if (profile?.display_name && !name) setName(profile.display_name);
  }, [profile, name]);

  function toggle<T>(list: T[], value: T, set: (v: T[]) => void) {
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  }

  async function finish(skipExtras = false) {
    setBusy(true);
    try {
      const settings: SproutSettings = {
        sections: { ...sections, school: false },
        difficulty,
        lifeTags: tags,
      };
      const target = DIFFICULTIES[difficulty].target;

      await saveProfile({
        display_name: name.trim() || "friend",
        onboarded: true,
        settings,
      });

      await ensureCategories([], target);
      // keep targets aligned with the chosen difficulty for existing categories
      const { data: cats } = await supabase.from("point_categories").select("id");
      if (cats?.length) {
        await supabase
          .from("point_categories")
          .update({ daily_target: target })
          .in("id", cats.map((c) => c.id));
      }

      if (!skipExtras) {
        if (job.name.trim()) {
          await addJob({
            name: job.name.trim(),
            employer: job.employer.trim() || null,
            position: job.position.trim() || null,
            pay_rate: job.pay_rate ? Number(job.pay_rate) : 0,
            pay_type: job.pay_type,
            is_primary: true,
          });
        }
        const pickedGoals = GOAL_LIBRARY.filter((g) => goals.includes(g.name));
        const goalRows = [
          ...pickedGoals.map((g) => ({
            name: g.name,
            category: g.category,
            unit: g.unit,
            target_value: g.target_value,
          })),
          ...(customGoal.trim()
            ? [{ name: customGoal.trim(), category: "personal", unit: null, target_value: null }]
            : []),
        ];
        if (goalRows.length) await supabase.from("goals").insert(goalRows);

        const pickedHabits = HABIT_LIBRARY.filter((h) => habits.includes(h.name));
        if (pickedHabits.length) {
          await supabase.from("habits").insert(
            pickedHabits.map((h, i) => ({
              name: h.name,
              emoji: h.emoji,
              category: h.category,
              frequency: h.frequency,
              target_per_week: h.target_per_week,
              sort_order: i + 1,
            })),
          );
        }
      }

      refreshProfile();
      navigate({ to: "/" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 py-10">
      <div className="flex items-center gap-2 font-display text-sm font-bold">
        <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Sprout className="size-4" />
        </span>
        <span className="text-primary">SPROUT</span>
      </div>

      <div className="mt-6 flex gap-1.5">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={cn("h-1.5 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-secondary")}
          />
        ))}
      </div>

      <div className="panel mt-6 flex-1 p-6">
        {step === 0 && (
          <Section title="What should we call you?" blurb="Used for your daily greeting.">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="mt-1.5"
            />
          </Section>
        )}

        {step === 1 && (
          <Section title="What's your life like right now?" blurb="Pick anything that fits. Optional.">
            <div className="grid gap-2 sm:grid-cols-2">
              {LIFE_TAGS.map((t) => (
                <Toggle
                  key={t.key}
                  on={tags.includes(t.key)}
                  onClick={() => toggle(tags, t.key, setTags)}
                  label={`${t.emoji} ${t.label}`}
                />
              ))}
            </div>
          </Section>
        )}

        {step === 2 && (
          <Section title="Do you have a job?" blurb="Optional — you can add more later in Money.">
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder="Job name (e.g. Barista)"
                value={job.name}
                onChange={(e) => setJob({ ...job, name: e.target.value })}
              />
              <Input
                placeholder="Employer"
                value={job.employer}
                onChange={(e) => setJob({ ...job, employer: e.target.value })}
              />
              <Input
                placeholder="Position"
                value={job.position}
                onChange={(e) => setJob({ ...job, position: e.target.value })}
              />
              <div className="flex gap-2">
                <Input
                  placeholder="Pay rate"
                  inputMode="decimal"
                  value={job.pay_rate}
                  onChange={(e) => setJob({ ...job, pay_rate: e.target.value })}
                />
                <select
                  className="rounded-md border border-input bg-surface px-3 py-2 text-sm"
                  value={job.pay_type}
                  onChange={(e) => setJob({ ...job, pay_type: e.target.value })}
                >
                  <option value="hourly">/hour</option>
                  <option value="salary">salary</option>
                  <option value="gig">gig</option>
                </select>
              </div>
            </div>
          </Section>
        )}

        {step === 3 && (
          <Section title="Any goals to start with?" blurb="Optional. Nothing is added unless you pick it.">
            <div className="grid gap-2 sm:grid-cols-2">
              {GOAL_LIBRARY.map((g) => (
                <Toggle
                  key={g.name}
                  on={goals.includes(g.name)}
                  onClick={() => toggle(goals, g.name, setGoals)}
                  label={g.name}
                />
              ))}
            </div>
            <Input
              className="mt-3"
              placeholder="Or write your own goal"
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
            />
          </Section>
        )}

        {step === 4 && (
          <Section title="Habits you want to track?" blurb="Optional. Pick only what you actually want.">
            <div className="grid max-h-80 gap-2 overflow-y-auto sm:grid-cols-2">
              {HABIT_LIBRARY.map((h) => (
                <Toggle
                  key={h.name}
                  on={habits.includes(h.name)}
                  onClick={() => toggle(habits, h.name, setHabits)}
                  label={`${h.emoji} ${h.name}`}
                />
              ))}
            </div>
          </Section>
        )}

        {step === 5 && (
          <Section title="Which sections do you want?" blurb="You can turn these on or off any time in Settings.">
            <div className="grid gap-2">
              {SECTIONS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  disabled={s.comingSoon}
                  onClick={() => setSections({ ...sections, [s.key]: sections[s.key] === false })}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                    s.comingSoon
                      ? "border-border/50 opacity-50"
                      : sections[s.key] !== false
                        ? "border-primary/50 bg-primary/10"
                        : "border-border bg-surface/40 text-muted-foreground",
                  )}
                >
                  <span>{s.emoji}</span>
                  <span className="flex-1">
                    <span className="font-medium">{s.label}</span>
                    <span className="block text-xs text-muted-foreground">
                      {s.comingSoon ? "Under construction" : s.blurb}
                    </span>
                  </span>
                  {!s.comingSoon && sections[s.key] !== false && <span className="text-primary">✓</span>}
                </button>
              ))}
            </div>
          </Section>
        )}

        {step === 6 && (
          <Section
            title="How hard should your days be?"
            blurb={`Each of your ${DEFAULT_CATEGORIES.length} categories gets this daily point target.`}
          >
            <div className="grid gap-2">
              {(Object.keys(DIFFICULTIES) as Difficulty[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={cn(
                    "rounded-xl border px-3 py-3 text-left text-sm transition-colors",
                    difficulty === d
                      ? "border-primary/60 bg-primary/10"
                      : "border-border bg-surface/40",
                  )}
                >
                  <span className="font-medium">{DIFFICULTIES[d].label}</span>
                  <span className="block text-xs text-muted-foreground">{DIFFICULTIES[d].blurb}</span>
                </button>
              ))}
            </div>
          </Section>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(step - 1)} disabled={busy}>
            Back
          </Button>
        )}
        <button
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() => finish(true)}
          disabled={busy}
        >
          Skip setup
        </button>
        <div className="ml-auto">
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={busy}>
              Continue
            </Button>
          ) : (
            <Button onClick={() => finish()} disabled={busy}>
              Start growing
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  blurb,
  children,
}: {
  title: string;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="font-display text-xl font-bold">{title}</h1>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">{blurb}</p>
      {children}
    </div>
  );
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
        on ? "border-primary/50 bg-primary/10" : "border-border bg-surface/40 text-muted-foreground",
      )}
    >
      {label}
    </button>
  );
}
