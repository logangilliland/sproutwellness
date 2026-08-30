import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Flame, Plus, Sparkles, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Panel, Meter, Ring, Stat, Chip } from "@/components/lifeos/Bits";
import { useLifeData, useRefreshLife } from "@/hooks/useLifeData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { addTask, deleteRow, toggleHabit, toggleTask } from "@/lib/mutations";
import {
  daysBetween,
  exerciseThisWeek,
  lifeScore,
  longDate,
  money,
  nextMilestone,
  phaseFor,
  productivityScore,
  streak,
  todayKey,
  totalMoney,
  vapeFreeDates,
  weekEarnings,
  prettyDate,
} from "@/lib/lifeos";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — Logan's Life OS" },
      {
        name: "description",
        content:
          "Daily command center: priorities, productivity score, habit streaks, money, fitness and the next big deadline.",
      },
      { property: "og:title", content: "Today — Logan's Life OS" },
      {
        property: "og:description",
        content: "What to do next, how you're doing, and whether you're improving.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <Today />
    </AppShell>
  ),
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "GOOD MORNING, LOGAN";
  if (h < 18) return "GOOD AFTERNOON, LOGAN";
  return "GOOD EVENING, LOGAN";
}

function Today() {
  const { data, isLoading } = useLifeData();
  const refresh = useRefreshLife();
  const [newTask, setNewTask] = useState("");
  const today = todayKey();

  const computed = useMemo(() => {
    if (!data) return null;
    const score = productivityScore(data, today);
    const ls = lifeScore(data);
    const milestone = nextMilestone(data.events);
    const vape = streak(new Set(vapeFreeDates(data)));
    return { score, ls, milestone, vape };
  }, [data, today]);

  if (isLoading || !data || !computed) {
    return <p className="text-muted-foreground">Loading your day…</p>;
  }

  const tasks = data.tasks
    .filter((t) => t.date === today)
    .sort((a, b) => a.priority - b.priority || a.sort_order - b.sort_order);
  const habits = data.habits.filter((h) => h.active);
  const doneHabits = new Set(
    data.habitLogs.filter((l) => l.date === today && l.completed).map((l) => l.habit_id),
  );
  const phase = phaseFor(data.events);
  const moneyGoal = data.goals.find((g) => g.category === "financial" && g.status === "active");
  const earned = weekEarnings(data);
  const checking = data.accounts.find((a) => a.kind === "checking");
  const savings = data.accounts.find((a) => a.is_savings);
  const cash = data.accounts.find((a) => a.kind === "cash");

  async function submitTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.trim()) return;
    await addTask(newTask.trim(), { date: today, priority: 2 });
    setNewTask("");
    refresh();
  }

  async function minimumViableDay() {
    const items = ["Shower", "Eat something real", "Do one useful task"];
    for (const t of items) await addTask(t, { date: today, priority: 1 });
    refresh();
    toast.success("Minimum Viable Day set. Three things and it counts as a win.");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary">{phase.name}</p>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{greeting()}</h1>
          <p className="text-sm text-muted-foreground">{longDate(today)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip>
            <Flame className="size-3 text-primary" /> {computed.vape} day vape-free streak
          </Chip>
          <Chip>🏃 {exerciseThisWeek(data)} activities this week</Chip>
          <Chip>💰 {money(earned)} earned this week</Chip>
        </div>
      </div>

      <DayPoints
        date={today}
        categories={data.categories}
        activities={data.activities}
        suggestions={data.suggestions}
        refresh={refresh}
      />

      <div className="grid gap-4 lg:grid-cols-2">



        <Panel title="Life score">
          <div className="flex items-baseline gap-2">
            <span className="stat-number text-4xl">{computed.ls.total}</span>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>
          <div className="mt-3 space-y-2">
            {computed.ls.parts.map((p) => (
              <div key={p.key}>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{p.label}</span>
                  <span className="font-mono">{p.value}</span>
                </div>
                <Meter value={p.value} className="mt-1" />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Next major deadline">
          {computed.milestone ? (
            <div>
              <div className="stat-number text-3xl text-primary">
                {daysBetween(today, computed.milestone.date)} days
              </div>
              <p className="mt-1 font-display text-lg">{computed.milestone.title}</p>
              <p className="text-sm text-muted-foreground">
                {prettyDate(computed.milestone.date)}
                {computed.milestone.notes ? ` · ${computed.milestone.notes}` : ""}
              </p>
              <Link
                to="/calendar"
                className="mt-3 inline-block text-xs text-primary hover:underline"
              >
                Open calendar →
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nothing scheduled. Add an event in the calendar.
            </p>
          )}
        </Panel>
      </div>

      <div className="grid gap-4">


        <Panel
          title="Habit check-in"
          action={
            <Link to="/habits" className="text-xs text-primary hover:underline">
              Manage
            </Link>
          }
        >
          <div className="grid gap-1.5 sm:grid-cols-2">
            {habits.map((h) => {
              const on = doneHabits.has(h.id);
              return (
                <button
                  key={h.id}
                  onClick={async () => {
                    await toggleHabit(h.id, today, !on);
                    refresh();
                  }}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm transition-colors ${
                    on
                      ? "border-primary/50 bg-primary/10 text-foreground"
                      : "border-border bg-surface/40 text-muted-foreground hover:bg-surface"
                  }`}
                >
                  <span>{h.emoji}</span>
                  <span className="flex-1 truncate">{h.name}</span>
                  {on && <span className="text-primary">✓</span>}
                </button>
              );
            })}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Panel title="Money">
          <div className="space-y-2 text-sm">
            <Row label="Checking" value={money(Number(checking?.balance ?? 0))} />
            <Row label="Savings" value={money(Number(savings?.balance ?? 0))} />
            <Row label="Cash" value={money(Number(cash?.balance ?? 0))} />
            <Row label="Total" value={money(totalMoney(data))} strong />
          </div>
          {moneyGoal && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{moneyGoal.name}</span>
                <span className="font-mono">
                  {money(earned)} / {money(Number(moneyGoal.target_value ?? 0))}
                </span>
              </div>
              <Meter
                tone="money"
                className="mt-1"
                value={(earned / Math.max(1, Number(moneyGoal.target_value ?? 1))) * 100}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {money(Math.max(0, Number(moneyGoal.target_value ?? 0) - earned))} to go · ~
                {Math.max(
                  0,
                  (Number(moneyGoal.target_value ?? 0) - earned) / 21,
                ).toFixed(1)}{" "}
                hours at $21/hr
              </p>
            </div>
          )}
        </Panel>

        <Panel title="Vape">
          <div className="stat-number text-3xl text-vape">{computed.vape} days</div>
          <p className="mt-1 text-sm text-muted-foreground">vape-free</p>
          <p className="mt-3 rounded-lg border border-vape/40 bg-vape/10 px-2 py-1.5 text-xs font-medium text-foreground">
            DO NOT BUY ANOTHER ONE
          </p>
        </Panel>

        <Panel title="Fitness">
          <div className="stat-number text-3xl text-fitness">{exerciseThisWeek(data)}</div>
          <p className="mt-1 text-sm text-muted-foreground">activities this week</p>
          <Meter tone="fitness" className="mt-3" value={(exerciseThisWeek(data) / 4) * 100} />
          <p className="mt-1 text-xs text-muted-foreground">Target: 4 / week</p>
        </Panel>

        <Panel title="Room move">
          {(() => {
            const project = data.projects.find((p) => p.name.toLowerCase().includes("room"));
            if (!project) return <p className="text-sm text-muted-foreground">No project yet.</p>;
            const pt = data.tasks.filter((t) => t.project_id === project.id);
            const pct = pt.length ? (pt.filter((t) => t.done).length / pt.length) * 100 : 0;
            return (
              <div>
                <div className="stat-number text-3xl">{Math.round(pct)}%</div>
                <Meter className="mt-2" value={pct} />
                <p className="mt-1 text-xs text-muted-foreground">
                  {pt.filter((t) => t.done).length}/{pt.length} tasks
                  {project.deadline ? ` · due ${prettyDate(project.deadline)}` : ""}
                </p>
                <Link to="/projects" className="mt-2 inline-block text-xs text-primary hover:underline">
                  Open project →
                </Link>
              </div>
            );
          })()}
        </Panel>
      </div>

      <Stats data={data} />
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-mono font-semibold text-money" : "font-mono"}>{value}</span>
    </div>
  );
}

function Stats({ data }: { data: NonNullable<ReturnType<typeof useLifeData>["data"]> }) {
  const week = data.shifts.filter((s) => s.date >= todayKey().slice(0, 8) + "01");
  const hours = week.reduce((s, x) => s + Number(x.hours), 0);
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <Stat
        label="Activities logged today"
        value={data.activities.filter((a) => a.date === todayKey()).length}
      />
      <Stat label="Hours worked (month)" value={hours.toFixed(1)} />
      <Stat
        label="Avg $/hour"
        value={hours ? money(week.reduce((s, x) => s + Number(x.earnings), 0) / hours) : "—"}
        tone="text-money"
      />
      <Stat label="Active goals" value={data.goals.filter((g) => g.status === "active").length} />
    </div>
  );
}
