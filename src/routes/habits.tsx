import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pause, Play, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Panel, Meter, Heatmap, Chip } from "@/components/lifeos/Bits";
import { useLifeData, useRefreshLife } from "@/hooks/useLifeData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { deleteRow, toggleHabit } from "@/lib/mutations";
import {
  CATEGORY_META,
  bestStreak,
  habitCompletionDates,
  lastNDays,
  startOfWeekKey,
  streak,
  todayKey,
} from "@/lib/lifeos";

export const Route = createFileRoute("/habits")({
  head: () => ({
    meta: [
      { title: "Habits — Logan's Life OS" },
      {
        name: "description",
        content:
          "Track daily and weekly habits with streaks, best streaks, completion rates and a 12-week heatmap.",
      },
      { property: "og:title", content: "Habits — Logan's Life OS" },
      {
        property: "og:description",
        content: "Streaks, heatmaps and weekly stats for morning, money, fitness, life and night habits.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <Habits />
    </AppShell>
  ),
});

function Habits() {
  const { data, isLoading } = useLifeData();
  const refresh = useRefreshLife();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("✅");
  const [category, setCategory] = useState("life");
  const today = todayKey();
  const window84 = lastNDays(84);

  if (isLoading || !data) return <p className="text-muted-foreground">Loading habits…</p>;

  const categories = [...new Set(data.habits.map((h) => h.category))];

  async function addHabit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await supabase.from("habits").insert({ name: name.trim(), emoji, category });
    setName("");
    refresh();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Habits</h1>
        <p className="text-sm text-muted-foreground">
          Check things off as you do them. Streaks build the routine.
        </p>
      </div>

      <Panel title="New habit">
        <form onSubmit={addHabit} className="flex flex-wrap gap-2">
          <Input
            className="w-16 text-center"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            aria-label="Emoji"
          />
          <Input
            className="min-w-40 flex-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Habit name"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border border-input bg-surface px-3 py-2 text-sm"
          >
            {Object.entries(CATEGORY_META).map(([k, v]) => (
              <option key={k} value={k}>
                {v.emoji} {v.label}
              </option>
            ))}
          </select>
          <Button type="submit">
            <Plus className="size-4" /> Add
          </Button>
        </form>
      </Panel>

      {categories.map((cat) => {
        const meta = CATEGORY_META[cat] ?? { label: cat, emoji: "•" };
        const list = data.habits.filter((h) => h.category === cat);
        return (
          <Panel key={cat} title={`${meta.emoji} ${meta.label}`}>
            <div className="space-y-3">
              {list.map((h) => {
                const dates = habitCompletionDates(data, h.id);
                const set = new Set(dates);
                const weekDone = dates.filter((d) => d >= startOfWeekKey()).length;
                const rate = Math.round(
                  (window84.filter((d) => set.has(d)).length / window84.length) * 100,
                );
                const on = set.has(today);
                return (
                  <div
                    key={h.id}
                    className={`rounded-xl border p-3 ${
                      h.active ? "border-border bg-surface/40" : "border-border/50 opacity-50"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={async () => {
                          await toggleHabit(h.id, today, !on);
                          refresh();
                        }}
                        className={`grid size-9 place-items-center rounded-lg border text-lg ${
                          on ? "border-primary bg-primary/20" : "border-border bg-background"
                        }`}
                        aria-label={`Toggle ${h.name}`}
                      >
                        {h.emoji}
                      </button>
                      <div className="min-w-40 flex-1">
                        <p className="text-sm font-medium">{h.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {h.frequency} · target {h.target_per_week}/week · {weekDone} this week
                        </p>
                      </div>
                      <Chip>🔥 {streak(set)} streak</Chip>
                      <Chip>🏆 {bestStreak(dates)} best</Chip>
                      <Chip>{rate}% (12wk)</Chip>
                      <button
                        onClick={async () => {
                          await supabase
                            .from("habits")
                            .update({ active: !h.active })
                            .eq("id", h.id);
                          refresh();
                        }}
                        className="rounded p-1.5 text-muted-foreground hover:text-foreground"
                        aria-label={h.active ? "Pause habit" : "Resume habit"}
                      >
                        {h.active ? <Pause className="size-4" /> : <Play className="size-4" />}
                      </button>
                      <button
                        onClick={async () => {
                          await deleteRow("habits", h.id);
                          refresh();
                        }}
                        className="rounded p-1.5 text-muted-foreground hover:text-destructive"
                        aria-label="Delete habit"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <div className="mt-3 space-y-2">
                      <Meter value={rate} />
                      <Heatmap days={window84} active={set} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        );
      })}
    </div>
  );
}
