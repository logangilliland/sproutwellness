import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Star, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Panel, Chip } from "@/components/lifeos/Bits";
import { useLifeData, useRefreshLife } from "@/hooks/useLifeData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { deleteRow } from "@/lib/mutations";
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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Calendar</h1>
        <p className="text-sm text-muted-foreground">
          School, work, fraternity, trips and deadlines — kept as life events.
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
            return (
              <div
                key={key}
                className={`min-h-16 rounded-lg border p-1 text-left text-[11px] ${
                  key === todayKey()
                    ? "border-primary bg-primary/10"
                    : "border-border bg-surface/30"
                } ${inMonth ? "" : "opacity-35"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono">{d.getDate()}</span>
                  {tasksByDate.has(key) && <span className="size-1.5 rounded-full bg-accent" />}
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
              </div>
            );
          })}
        </div>
      </Panel>

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
