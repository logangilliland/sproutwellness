import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Panel, Meter, Chip } from "@/components/lifeos/Bits";
import { useLifeData, useRefreshLife } from "@/hooks/useLifeData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { addTask, deleteRow, toggleTask } from "@/lib/mutations";
import { daysBetween, prettyDate, todayKey } from "@/lib/lifeos";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — Sprout" },
      {
        name: "description",
        content:
          "Multi-step projects with task lists, progress percentage, deadlines and priority.",
      },
      { property: "og:title", content: "Projects — Sprout" },
      {
        property: "og:description",
        content: "Break big things into tasks and watch the progress bar move.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <Projects />
    </AppShell>
  ),
});

function Projects() {
  const { data, isLoading } = useLifeData();
  const refresh = useRefreshLife();
  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [taskDrafts, setTaskDrafts] = useState<Record<string, string>>({});

  if (isLoading || !data) return <p className="text-muted-foreground">Loading projects…</p>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Projects</h1>
        <p className="text-sm text-muted-foreground">Bigger things with more than one step.</p>
      </div>

      <Panel title="New project">
        <form
          className="flex flex-wrap gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim()) return;
            await supabase.from("projects").insert({ name: name.trim(), deadline: deadline || null });
            setName("");
            setDeadline("");
            refresh();
          }}
        >
          <Input
            className="min-w-40 flex-1"
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          <Button type="submit">
            <Plus className="size-4" /> Add
          </Button>
        </form>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        {data.projects.map((p) => {
          const tasks = data.tasks
            .filter((t) => t.project_id === p.id)
            .sort((a, b) => a.sort_order - b.sort_order);
          const pct = tasks.length ? (tasks.filter((t) => t.done).length / tasks.length) * 100 : 0;
          return (
            <Panel key={p.id} title={p.name}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="stat-number text-2xl">{Math.round(pct)}%</span>
                {p.deadline && (
                  <Chip>
                    ⏳ {prettyDate(p.deadline)} · {daysBetween(todayKey(), p.deadline)}d left
                  </Chip>
                )}
                <Chip>P{p.priority}</Chip>
                <button
                  className="ml-auto text-muted-foreground hover:text-destructive"
                  onClick={async () => {
                    await deleteRow("projects", p.id);
                    refresh();
                  }}
                  aria-label="Delete project"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <Meter className="mt-2" value={pct} />
              {p.description && (
                <p className="mt-2 text-xs text-muted-foreground">{p.description}</p>
              )}
              <ul className="mt-3 space-y-1">
                {tasks.map((t) => (
                  <li key={t.id} className="group flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={t.done}
                      onCheckedChange={async (v) => {
                        await toggleTask(t.id, Boolean(v));
                        refresh();
                      }}
                    />
                    <span className={t.done ? "flex-1 text-muted-foreground line-through" : "flex-1"}>
                      {t.title}
                    </span>
                    <button
                      className="opacity-0 group-hover:opacity-100"
                      onClick={async () => {
                        await deleteRow("tasks", t.id);
                        refresh();
                      }}
                      aria-label="Delete task"
                    >
                      <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </li>
                ))}
              </ul>
              <form
                className="mt-3 flex gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const v = (taskDrafts[p.id] ?? "").trim();
                  if (!v) return;
                  await addTask(v, { project_id: p.id, date: null });
                  setTaskDrafts({ ...taskDrafts, [p.id]: "" });
                  refresh();
                }}
              >
                <Input
                  placeholder="Add step…"
                  value={taskDrafts[p.id] ?? ""}
                  onChange={(e) => setTaskDrafts({ ...taskDrafts, [p.id]: e.target.value })}
                />
                <Button type="submit" size="icon" aria-label="Add step">
                  <Plus className="size-4" />
                </Button>
              </form>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
