import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Star, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Panel, Chip, Meter } from "@/components/lifeos/Bits";
import { useLifeData, useRefreshLife } from "@/hooks/useLifeData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { deleteRow } from "@/lib/mutations";
import { scoreTone } from "@/lib/points";
import { EVENT_TYPES, addDays, daysBetween, prettyDate, todayKey, toKey, fromKey } from "@/lib/lifeos";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — Logan's Life OS" },
      {
        name: "description",
        content:
          "Persistent life calendar: school dates, exams, deadlines, breaks, fraternity events, trips, work shifts and personal events.",
      },
      { property: "og:title", content: "Calendar — Logan's Life OS" },
      {
        property: "og:description",
        content: "Deadlines and life events that stay on record instead of disappearing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <CalendarPage />
    </AppShell>
  ),
});

function monthGrid(anchor: Date) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function CalendarPage() {
  const { data, isLoading } = useLifeData();
  const refresh = useRefreshLife();
  const [monthOffset, setMonthOffset] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    type: "personal",
    date: todayKey(),
    time: "",
    notes: "",
  });

  if (isLoading || !data) return <p className="text-muted-foreground">Loading calendar…</p>;

  const anchor = new Date();
  anchor.setDate(1);
  anchor.setMonth(anchor.getMonth() + monthOffset);
  const grid = monthGrid(anchor);
  const upcoming = data.events
    .filter((e) => e.date >= todayKey())
    .sort((a, b) => a.date.localeCompare(b.date));
  const past = data.events
    .filter((e) => e.date < todayKey())
    .sort((a, b) => b.date.localeCompare(a.date));

  const byDate = new Map<string, typeof data.events>();
  for (const e of data.events) {
    byDate.set(e.date, [...(byDate.get(e.date) ?? []), e]);
  }
  const tasksByDate = new Set(data.tasks.filter((t) => t.date).map((t) => t.date as string));
  const scoreByDate = new Map(data.dayScores.map((s) => [s.date, s]));
  const selectedScore = selected ? scoreByDate.get(selected) : undefined;
  const selectedActivities = selected
    ? data.activities.filter((a) => a.date === selected)
    : [];
  const catById = new Map(data.categories.map((c) => [c.id, c]));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Calendar</h1>
        <p className="text-sm text-muted-foreground">
          School, work, fraternity, trips and deadlines — plus the score you earned each day.
        </p>
      </div>

      <Panel
        title={anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        action={
          <div className="flex gap-1">
            <Button size="sm" variant="secondary" onClick={() => setMonthOffset(monthOffset - 1)}>
              ←
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setMonthOffset(0)}>
              Today
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setMonthOffset(monthOffset + 1)}>
              →
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {grid.map((d) => {
            const key = toKey(d);
            const inMonth = d.getMonth() === anchor.getMonth();
            const events = byDate.get(key) ?? [];
            const score = scoreByDate.get(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key === selected ? null : key)}
                className={`min-h-16 rounded-lg border p-1 text-left text-[11px] transition-colors ${
                  key === todayKey()
                    ? "border-primary bg-primary/10"
                    : key === selected
                      ? "border-accent bg-surface/70"
                      : "border-border bg-surface/30 hover:border-primary/40"
                } ${inMonth ? "" : "opacity-35"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono">{d.getDate()}</span>
                  {score ? (
                    <span className={`font-mono text-[10px] ${scoreTone(score.overall_pct)}`}>
                      {score.overall_pct}%
                    </span>
                  ) : (
                    tasksByDate.has(key) && <span className="size-1.5 rounded-full bg-accent" />
                  )}
                </div>
                {events.slice(0, 2).map((e) => (
                  <div key={e.id} className="mt-0.5 truncate rounded bg-muted px-1 py-0.5">
                    {e.is_milestone ? "★ " : ""}
                    {e.title}
                  </div>
                ))}
                {events.length > 2 && (
                  <div className="text-muted-foreground">+{events.length - 2}</div>
                )}
              </button>
            );
          })}
        </div>
      </Panel>

      {selected && (
        <Panel
          title={prettyDate(selected)}
          action={
            <button
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          }
        >
          {selectedScore ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className={`stat-number text-4xl ${scoreTone(selectedScore.overall_pct)}`}>
                  {selectedScore.overall_pct}%
                </span>
                <span className="text-sm text-muted-foreground">overall</span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {(selectedScore.breakdown ?? []).map((b) => (
                  <div key={b.key} className="rounded-lg border border-border bg-surface/40 p-2">
                    <div className="flex justify-between text-sm">
                      <span>
                        {b.emoji} {b.label}
                      </span>
                      <span className="font-mono">
                        {b.points}/{b.target}
                        {b.points >= b.target && <span className="ml-1 text-primary">✓</span>}
                        {b.bonus > 0 && <span className="ml-1 text-money">+{b.bonus}</span>}
                      </span>
                    </div>
                    <Meter value={b.pct} className="mt-1.5" />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No score recorded for this day.</p>
          )}

          {selectedActivities.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Activities
              </p>
              <ul className="mt-1.5 space-y-1">
                {selectedActivities.map((a) => (
                  <li key={a.id} className="flex items-center gap-2 text-sm">
                    <span className="w-6">{catById.get(a.category_id)?.emoji ?? "•"}</span>
                    <span className="flex-1 truncate" title={a.reason ?? undefined}>
                      {a.title}
                    </span>
                    <span className="font-mono text-xs text-primary">+{a.points}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(byDate.get(selected) ?? []).length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Events</p>
              <ul className="mt-1.5 space-y-1 text-sm">
                {(byDate.get(selected) ?? []).map((e) => (
                  <li key={e.id} className="truncate">
                    {e.is_milestone ? "★ " : ""}
                    {e.title} <span className="text-muted-foreground">· {e.type}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>
      )}

      <Panel title="Add event">
        <form
          className="grid gap-2 sm:grid-cols-6"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!form.title.trim()) return;
            await supabase.from("events").insert({
              title: form.title.trim(),
              type: form.type,
              date: form.date,
              time: form.time || null,
              notes: form.notes || null,
            });
            setForm({ title: "", type: "personal", date: todayKey(), time: "", notes: "" });
            refresh();
          }}
        >
          <Input
            className="sm:col-span-2"
            placeholder="Event title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <select
            className="rounded-md border border-input bg-surface px-3 py-2 text-sm"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input placeholder="Time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          <Button type="submit">
            <Plus className="size-4" /> Add
          </Button>
        </form>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Upcoming">
          <ul className="space-y-2">
            {upcoming.map((e) => (
              <li key={e.id} className="flex items-center gap-2 rounded-lg border border-border bg-surface/40 p-2">
                <div className="w-24 shrink-0 text-xs text-muted-foreground">{prettyDate(e.date)}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    {e.is_milestone && <Star className="mr-1 inline size-3 text-primary" />}
                    {e.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {e.type}
                    {e.time ? ` · ${e.time}` : ""} · in {daysBetween(todayKey(), e.date)}d
                  </p>
                </div>
                <button
                  className="text-muted-foreground hover:text-destructive"
                  onClick={async () => {
                    await deleteRow("events", e.id);
                    refresh();
                  }}
                  aria-label="Delete event"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
            {!upcoming.length && <li className="text-sm text-muted-foreground">Nothing upcoming.</li>}
          </ul>
        </Panel>

        <Panel title="Past events (kept on record)">
          <ul className="space-y-1.5">
            {past.slice(0, 15).map((e) => (
              <li key={e.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-24 text-xs">{prettyDate(e.date)}</span>
                <span className="flex-1 truncate">{e.title}</span>
                <Chip>{e.type}</Chip>
              </li>
            ))}
            {!past.length && <li className="text-sm text-muted-foreground">No history yet.</li>}
          </ul>
        </Panel>
      </div>

      <p className="text-xs text-muted-foreground">
        Tip: the week ahead runs {prettyDate(todayKey())} → {prettyDate(addDays(todayKey(), 6))} (
        {fromKey(todayKey()).getFullYear()}).
      </p>
    </div>
  );
}
