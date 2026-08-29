import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Panel, Chip } from "@/components/lifeos/Bits";
import { useLifeData, useRefreshLife } from "@/hooks/useLifeData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { deleteRow } from "@/lib/mutations";
import { daysBetween, prettyDate, todayKey } from "@/lib/lifeos";

export const Route = createFileRoute("/school")({
  head: () => ({
    meta: [
      { title: "School — Logan's Life OS" },
      {
        name: "description",
        content:
          "Oregon State forestry classes, professors, meeting times, exams and assignment deadlines feeding into daily planning.",
      },
      { property: "og:title", content: "School — Logan's Life OS" },
      {
        property: "og:description",
        content: "Classes, exams and academic deadlines that shape what to prioritize.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <School />
    </AppShell>
  ),
});

const KEY_DATE_TEMPLATE = [
  { title: "First day of classes", type: "school" },
  { title: "Last day of classes", type: "school" },
  { title: "Finals week begins", type: "exam" },
  { title: "Registration deadline", type: "deadline" },
  { title: "Break begins", type: "break" },
];

function School() {
  const { data, isLoading } = useLifeData();
  const refresh = useRefreshLife();
  const [form, setForm] = useState({
    name: "",
    professor: "",
    location: "",
    meeting_times: "",
    term: "Fall 2026",
  });
  const [dateForm, setDateForm] = useState({ title: KEY_DATE_TEMPLATE[0]!.title, date: "" });

  if (isLoading || !data) return <p className="text-muted-foreground">Loading school…</p>;

  const schoolEvents = data.events
    .filter((e) => ["school", "exam", "assignment", "deadline", "break", "holiday"].includes(e.type))
    .sort((a, b) => a.date.localeCompare(b.date));
  const firstDay = schoolEvents.find((e) => e.title.toLowerCase().includes("first day"));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">School</h1>
        <p className="text-sm text-muted-foreground">
          Oregon State University · Forestry · Delta Chi
        </p>
      </div>

      {firstDay && (
        <Panel title="School starts">
          <div className="flex items-baseline gap-3">
            <span className="stat-number text-4xl text-school">
              {Math.max(0, daysBetween(todayKey(), firstDay.date))}
            </span>
            <span className="text-sm text-muted-foreground">
              days until {prettyDate(firstDay.date)}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            The AI uses this date to shift priorities toward school prep as it gets closer.
          </p>
        </Panel>
      )}

      <Panel title="Add a key school date">
        <form
          className="flex flex-wrap gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!dateForm.date) return;
            const tpl = KEY_DATE_TEMPLATE.find((t) => t.title === dateForm.title);
            await supabase.from("events").insert({
              title: dateForm.title,
              type: tpl?.type ?? "school",
              date: dateForm.date,
            });
            setDateForm({ title: KEY_DATE_TEMPLATE[0]!.title, date: "" });
            refresh();
          }}
        >
          <select
            className="rounded-md border border-input bg-surface px-3 py-2 text-sm"
            value={dateForm.title}
            onChange={(e) => setDateForm({ ...dateForm, title: e.target.value })}
          >
            {KEY_DATE_TEMPLATE.map((t) => (
              <option key={t.title}>{t.title}</option>
            ))}
          </select>
          <Input
            type="date"
            value={dateForm.date}
            onChange={(e) => setDateForm({ ...dateForm, date: e.target.value })}
          />
          <Button type="submit">
            <Plus className="size-4" /> Add date
          </Button>
        </form>
        <ul className="mt-3 space-y-1.5">
          {schoolEvents.map((e) => (
            <li key={e.id} className="flex items-center gap-2 text-sm">
              <span className="w-24 text-xs text-muted-foreground">{prettyDate(e.date)}</span>
              <span className="flex-1 truncate">{e.title}</span>
              <Chip>{e.type}</Chip>
              <button
                className="text-muted-foreground hover:text-destructive"
                onClick={async () => {
                  await deleteRow("events", e.id);
                  refresh();
                }}
                aria-label="Delete date"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
          {!schoolEvents.length && (
            <li className="text-sm text-muted-foreground">No school dates yet.</li>
          )}
        </ul>
      </Panel>

      <Panel title="Classes">
        <form
          className="grid gap-2 sm:grid-cols-5"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!form.name.trim()) return;
            await supabase.from("classes").insert({
              name: form.name.trim(),
              professor: form.professor || null,
              location: form.location || null,
              meeting_times: form.meeting_times || null,
              term: form.term || null,
            });
            setForm({ name: "", professor: "", location: "", meeting_times: "", term: form.term });
            refresh();
          }}
        >
          <Input placeholder="Class name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Professor" value={form.professor} onChange={(e) => setForm({ ...form, professor: e.target.value })} />
          <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <Input placeholder="MWF 10:00" value={form.meeting_times} onChange={(e) => setForm({ ...form, meeting_times: e.target.value })} />
          <Button type="submit">
            <Plus className="size-4" /> Add class
          </Button>
        </form>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {data.classes.map((c) => (
            <div key={c.id} className="rounded-xl border border-border bg-surface/40 p-3">
              <div className="flex items-start">
                <div className="flex-1">
                  <p className="font-display text-base font-semibold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[c.professor, c.location, c.meeting_times, c.term].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <button
                  className="text-muted-foreground hover:text-destructive"
                  onClick={async () => {
                    await deleteRow("classes", c.id);
                    refresh();
                  }}
                  aria-label="Delete class"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
          {!data.classes.length && (
            <p className="text-sm text-muted-foreground">
              No classes yet. Add them when your Fall schedule is set.
            </p>
          )}
        </div>
      </Panel>
    </div>
  );
}
