import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Star,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Link2,
  GraduationCap,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Panel, Chip } from "@/components/lifeos/Bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useSchool, useRefreshSchool } from "@/hooks/useSchool";
import { useLifeData, useRefreshLife } from "@/hooks/useLifeData";
import { useProfile } from "@/hooks/useProfile";
import { sectionOn } from "@/lib/profile";
import { AssignmentSheet } from "@/components/school/AssignmentSheet";
import { ImportAssignment } from "@/components/school/ImportAssignment";
import {
  dueLabel,
  isDone,
  overdue,
  prettyClass,
  termFor,
  urgencyOf,
  weekPlan,
  type Assignment,
} from "@/lib/school";
import {
  addClass,
  addSchoolTodo,
  completeAssignment,
  deleteClass,
  deleteSchoolTodo,
  toggleSchoolTodo,
} from "@/lib/school.mutations";
import { canvasConfigured, disconnectCanvas, startCanvasAuth, syncCanvasNow } from "@/lib/canvas.functions";
import { addDays, prettyDate, startOfWeekKey, todayKey } from "@/lib/lifeos";

export const Route = createFileRoute("/school")({
  head: () => ({
    meta: [
      { title: "School — Sprout" },
      {
        name: "description",
        content:
          "Classes, assignments, deadlines and school points in one place — with optional Canvas sync.",
      },
      { property: "og:title", content: "School — Sprout" },
      {
        property: "og:description",
        content: "Every assignment, due date and school to-do feeding straight into your day.",
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

function School() {
  const { profile } = useProfile();
  const enabled = profile ? sectionOn(profile.settings, "school") : false;
  const { data, isLoading } = useSchool(enabled);
  const { data: life } = useLifeData(enabled);
  const refresh = useRefreshSchool();
  const refreshLife = useRefreshLife();
  const [open, setOpen] = useState<Assignment | null>(null);
  const [importing, setImporting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [todo, setTodo] = useState({ title: "", class_id: "", required: false });
  const [cls, setCls] = useState({ name: "", class_code: "", professor: "", location: "", meeting_times: "" });

  const today = todayKey();
  const schoolCategoryId = life?.categories.find((c) => c.key === "school")?.id ?? null;

  const term = useMemo(() => (data ? termFor(data.terms, today) : null), [data, today]);
  const week = useMemo(
    () => (data ? weekPlan(data.assignments, data.classes, startOfWeekKey(today)) : []),
    [data, today],
  );

  if (!enabled)
    return (
      <div className="space-y-3">
        <h1 className="font-display text-2xl font-bold">School</h1>
        <p className="text-sm text-muted-foreground">
          School is switched off. Turn it on in Settings to track classes and assignments.
        </p>
      </div>
    );
  if (isLoading || !data) return <p className="text-muted-foreground">Loading school…</p>;

  const openItems = data.assignments.filter((a) => !isDone(a));
  const dueToday = openItems.filter((a) => a.due_date === today);
  const late = overdue(data.assignments, today);
  const important = openItems.filter((a) => a.important && a.due_date !== today);
  const upcoming = openItems
    .filter((a) => a.due_date && a.due_date > today && a.due_date <= addDays(today, 14))
    .sort((x, y) => (x.due_date ?? "").localeCompare(y.due_date ?? ""));

  async function connectCanvas() {
    try {
      const cfg = await canvasConfigured();
      if (!cfg.configured) {
        toast.error(
          "Canvas isn't set up for this app yet — it needs your school's Canvas address and a developer key.",
        );
        return;
      }
      const { url } = await startCanvasAuth({ data: { origin: window.location.origin } });
      window.location.href = url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start Canvas sign-in.");
    }
  }

  async function sync() {
    setSyncing(true);
    try {
      const r = await syncCanvasNow();
      toast.success(`Canvas synced — ${r.imported} new, ${r.updated} updated.`);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Canvas sync failed. Your work is untouched.");
    } finally {
      setSyncing(false);
    }
  }

  const Row = ({ a }: { a: Assignment }) => {
    const u = urgencyOf(a, today);
    return (
      <li className="flex items-center gap-2 rounded-lg px-1 py-1.5 text-sm hover:bg-surface/60">
        <input
          type="checkbox"
          checked={isDone(a)}
          onChange={async () => {
            await completeAssignment(a, schoolCategoryId, today);
            refresh();
            refreshLife();
            toast.success(`${a.title} — School points added.`);
          }}
          aria-label={`Complete ${a.title}`}
        />
        <button className="flex-1 truncate text-left" onClick={() => setOpen(a)}>
          {a.important && <Star className="mr-1 inline size-3.5 text-amber-300" fill="currentColor" />}
          {a.title}
          <span className="ml-2 text-xs text-muted-foreground">
            {prettyClass(data.classes, a.class_id)}
          </span>
        </button>
        <Chip tone={u === "due" ? "danger" : ""}>{dueLabel(a, today)}</Chip>
        <span className="stat-number text-xs text-muted-foreground">{a.points}p</span>
      </li>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">School</h1>
          <p className="text-sm text-muted-foreground">
            {term ? `${term.name} · ${prettyDate(term.starts_on)} – ${prettyDate(term.ends_on)}` : "No active term"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setImporting(true)}>
            <Plus className="size-4" /> Add assignment
          </Button>
          {data.canvas?.status === "connected" ? (
            <Button variant="outline" disabled={syncing} onClick={sync}>
              {syncing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              Sync Canvas
            </Button>
          ) : (
            <Button variant="outline" onClick={connectCanvas}>
              <Link2 className="size-4" /> Connect Canvas
            </Button>
          )}
        </div>
      </div>

      {data.canvas?.last_error && (
        <p className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          Canvas trouble: {data.canvas.last_error} — everything you've added by hand is safe.
        </p>
      )}
      {data.canvas?.status === "connected" && (
        <p className="text-xs text-muted-foreground">
          Canvas connected{data.canvas.canvas_user_name ? ` as ${data.canvas.canvas_user_name}` : ""}
          {data.canvas.last_sync_at
            ? ` · last synced ${new Date(data.canvas.last_sync_at).toLocaleString()}`
            : ""}{" "}
          ·{" "}
          <button
            className="underline"
            onClick={async () => {
              await disconnectCanvas();
              refresh();
            }}
          >
            disconnect
          </button>
        </p>
      )}

      {late.length > 0 && (
        <Panel title="Overdue">
          <ul className="space-y-1">
            {late.map((a) => (
              <Row key={a.id} a={a} />
            ))}
          </ul>
        </Panel>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Due today">
          <ul className="space-y-1">
            {dueToday.map((a) => (
              <Row key={a.id} a={a} />
            ))}
            {!dueToday.length && (
              <li className="text-sm text-muted-foreground">Nothing due today. Get ahead instead.</li>
            )}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            Work due today is required — School can't hit 100% until it's finished.
          </p>
        </Panel>

        <Panel title="Important">
          <ul className="space-y-1">
            {important.map((a) => (
              <Row key={a.id} a={a} />
            ))}
            {!important.length && (
              <li className="text-sm text-muted-foreground">Star an assignment to pin it here.</li>
            )}
          </ul>
        </Panel>
      </div>

      <Panel title="Coming up (next 2 weeks)">
        <ul className="space-y-1">
          {upcoming.map((a) => (
            <Row key={a.id} a={a} />
          ))}
          {!upcoming.length && <li className="text-sm text-muted-foreground">Nothing on the horizon.</li>}
        </ul>
      </Panel>

      <Panel title="Week at a glance">
        {week.length ? (
          <div className="space-y-3">
            {week.map(({ cls: c, days }) => (
              <div key={c?.id ?? "none"}>
                <p className="text-sm font-medium">{c?.name ?? "No class"}</p>
                <div className="mt-1 grid gap-1 sm:grid-cols-2">
                  {days.map((d) => (
                    <div key={d.date} className="rounded-lg border border-border bg-surface/40 px-2 py-1.5 text-xs">
                      <span className="text-muted-foreground">{prettyDate(d.date)}</span>
                      <ul className="mt-0.5 space-y-0.5">
                        {d.items.map((a) => (
                          <li key={a.id} className={isDone(a) ? "line-through opacity-60" : ""}>
                            {a.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No assignments due this week.</p>
        )}
      </Panel>

      <Panel title="School to-dos">
        <p className="text-xs text-muted-foreground">
          Reading, studying, office hours — school work that isn't a graded assignment.
        </p>
        <form
          className="mt-2 flex flex-wrap gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!todo.title.trim()) return;
            await addSchoolTodo({
              title: todo.title.trim(),
              class_id: todo.class_id || null,
              required: todo.required,
              due_date: today,
            });
            setTodo({ title: "", class_id: "", required: false });
            refresh();
          }}
        >
          <Input
            className="max-w-xs"
            placeholder="Read chapter 4"
            value={todo.title}
            onChange={(e) => setTodo({ ...todo, title: e.target.value })}
          />
          <select
            className="rounded-md border border-input bg-surface px-3 py-2 text-sm"
            value={todo.class_id}
            onChange={(e) => setTodo({ ...todo, class_id: e.target.value })}
          >
            <option value="">No class</option>
            {data.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={todo.required}
              onChange={(e) => setTodo({ ...todo, required: e.target.checked })}
            />
            Required
          </label>
          <Button type="submit">
            <Plus className="size-4" /> Add
          </Button>
        </form>
        <ul className="mt-3 space-y-1.5">
          {data.todos.map((t) => (
            <li key={t.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={t.done}
                onChange={async () => {
                  await toggleSchoolTodo(t.id, !t.done, {
                    title: t.title,
                    points: t.points ?? 5,
                    schoolCategoryId,
                    date: today,
                  });
                  refresh();
                  refreshLife();
                }}
              />
              <span className={`flex-1 truncate ${t.done ? "text-muted-foreground line-through" : ""}`}>
                {t.title}
              </span>
              {t.required && <Chip tone="danger">required</Chip>}
              <span className="text-xs text-muted-foreground">{prettyClass(data.classes, t.class_id)}</span>
              {!t.required && (
                <button
                  className="text-muted-foreground hover:text-destructive"
                  onClick={async () => {
                    await deleteSchoolTodo(t.id);
                    refresh();
                  }}
                  aria-label="Delete to-do"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </li>
          ))}
          {!data.todos.length && <li className="text-sm text-muted-foreground">Nothing on the list.</li>}
        </ul>
      </Panel>

      <Panel title="Classes">
        <form
          className="grid gap-2 sm:grid-cols-5"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!cls.name.trim()) return;
            await addClass({
              name: cls.name.trim(),
              class_code: cls.class_code || null,
              professor: cls.professor || null,
              location: cls.location || null,
              meeting_times: cls.meeting_times || null,
              term_id: term?.id ?? null,
            });
            setCls({ name: "", class_code: "", professor: "", location: "", meeting_times: "" });
            refresh();
          }}
        >
          <Input placeholder="Class name" value={cls.name} onChange={(e) => setCls({ ...cls, name: e.target.value })} />
          <Input placeholder="FOR 111" value={cls.class_code} onChange={(e) => setCls({ ...cls, class_code: e.target.value })} />
          <Input placeholder="Professor" value={cls.professor} onChange={(e) => setCls({ ...cls, professor: e.target.value })} />
          <Input placeholder="MWF 10:00" value={cls.meeting_times} onChange={(e) => setCls({ ...cls, meeting_times: e.target.value })} />
          <Button type="submit">
            <Plus className="size-4" /> Add class
          </Button>
        </form>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {data.classes.map((c) => (
            <div key={c.id} className="flex items-start rounded-xl border border-border bg-surface/40 p-3">
              <div className="flex-1">
                <p className="font-display text-base font-semibold">
                  <GraduationCap className="mr-1 inline size-4 text-muted-foreground" />
                  {c.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {[c.class_code, c.professor, c.location, c.meeting_times].filter(Boolean).join(" · ")}
                </p>
              </div>
              <button
                className="text-muted-foreground hover:text-destructive"
                onClick={async () => {
                  await deleteClass(c.id);
                  refresh();
                }}
                aria-label="Delete class"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          {!data.classes.length && (
            <p className="text-sm text-muted-foreground">No classes yet — add your first one above.</p>
          )}
        </div>
      </Panel>

      <Panel title="Terms">
        <ul className="space-y-1 text-sm">
          {data.terms.map((t) => (
            <li key={t.id} className="flex items-center gap-2">
              <span className="flex-1">{t.name}</span>
              <span className="text-xs text-muted-foreground">
                {prettyDate(t.starts_on)} – {prettyDate(t.ends_on)}
              </span>
              {term?.id === t.id && <Chip>current</Chip>}
            </li>
          ))}
        </ul>
      </Panel>

      <ImportAssignment
        open={importing}
        onOpenChange={setImporting}
        classes={data.classes}
        termId={term?.id ?? null}
        onDone={refresh}
      />
      <AssignmentSheet
        assignment={open}
        steps={data.steps}
        classes={data.classes}
        schoolCategoryId={schoolCategoryId}
        onClose={() => setOpen(null)}
        onChange={() => {
          refresh();
          refreshLife();
        }}
      />
    </div>
  );
}
