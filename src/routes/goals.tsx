import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Panel, Meter, Chip } from "@/components/lifeos/Bits";
import { useLifeData, useRefreshLife } from "@/hooks/useLifeData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { deleteRow } from "@/lib/mutations";
import { GOAL_CATEGORIES, daysBetween, prettyDate, todayKey } from "@/lib/lifeos";

export const Route = createFileRoute("/goals")({
  head: () => ({
    meta: [
      { title: "Goals — Logan's Life OS" },
      {
        name: "description",
        content:
          "Long-term goals across money, fitness, school, health, living, career and travel with progress and deadlines.",
      },
      { property: "og:title", content: "Goals — Logan's Life OS" },
      {
        property: "og:description",
        content: "Goals that stay active until completed, paused or deleted — not a one-week challenge.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <Goals />
    </AppShell>
  ),
});

function Goals() {
  const { data, isLoading } = useLifeData();
  const refresh = useRefreshLife();
  const [form, setForm] = useState({
    name: "",
    category: "personal",
    target_value: "",
    unit: "",
    deadline: "",
  });

  if (isLoading || !data) return <p className="text-muted-foreground">Loading goals…</p>;

  const statuses = ["active", "paused", "completed"];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Goals</h1>
        <p className="text-sm text-muted-foreground">
          Goals are tools, not rules. Change them whenever life changes.
        </p>
      </div>

      <Panel title="New goal">
        <form
          className="grid gap-2 sm:grid-cols-6"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!form.name.trim()) return;
            await supabase.from("goals").insert({
              name: form.name.trim(),
              category: form.category,
              target_value: form.target_value ? Number(form.target_value) : null,
              unit: form.unit || null,
              deadline: form.deadline || null,
            });
            setForm({ name: "", category: "personal", target_value: "", unit: "", deadline: "" });
            refresh();
          }}
        >
          <Input
            className="sm:col-span-2"
            placeholder="Goal name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <select
            className="rounded-md border border-input bg-surface px-3 py-2 text-sm"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {GOAL_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <Input
            placeholder="Target"
            inputMode="decimal"
            value={form.target_value}
            onChange={(e) => setForm({ ...form, target_value: e.target.value })}
          />
          <Input
            placeholder="Unit"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
          />
          <Input
            type="date"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
          />
          <Button type="submit" className="sm:col-span-6">
            <Plus className="size-4" /> Add goal
          </Button>
        </form>
      </Panel>

      {statuses.map((status) => {
        const list = data.goals.filter((g) => g.status === status);
        if (!list.length) return null;
        return (
          <Panel key={status} title={status}>
            <div className="grid gap-3 md:grid-cols-2">
              {list.map((g) => {
                const pct = g.target_value
                  ? Math.min(100, (Number(g.current_value) / Number(g.target_value)) * 100)
                  : 0;
                const cat = GOAL_CATEGORIES.find((c) => c.value === g.category);
                return (
                  <div key={g.id} className="rounded-xl border border-border bg-surface/40 p-3">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-base font-semibold">{g.name}</p>
                        <p className="text-xs text-muted-foreground">{g.description}</p>
                      </div>
                      <button
                        onClick={async () => {
                          await deleteRow("goals", g.id);
                          refresh();
                        }}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Delete goal"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Chip>{cat?.label ?? g.category}</Chip>
                      {g.deadline && (
                        <Chip>
                          {prettyDate(g.deadline)} · {daysBetween(todayKey(), g.deadline)}d
                        </Chip>
                      )}
                      <Chip>P{g.priority}</Chip>
                    </div>
                    {g.target_value && (
                      <div className="mt-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <input
                            className="w-20 rounded border border-input bg-background px-2 py-1 font-mono text-foreground"
                            defaultValue={Number(g.current_value)}
                            onBlur={async (e) => {
                              const v = Number(e.target.value);
                              if (!Number.isNaN(v)) {
                                await supabase
                                  .from("goals")
                                  .update({ current_value: v })
                                  .eq("id", g.id);
                                refresh();
                              }
                            }}
                          />
                          <span>
                            / {Number(g.target_value)} {g.unit}
                          </span>
                          <span className="ml-auto font-mono">{Math.round(pct)}%</span>
                        </div>
                        <Meter className="mt-2" value={pct} />
                      </div>
                    )}
                    <div className="mt-3 flex gap-2">
                      {["active", "paused", "completed"]
                        .filter((s) => s !== g.status)
                        .map((s) => (
                          <Button
                            key={s}
                            size="sm"
                            variant="secondary"
                            onClick={async () => {
                              await supabase.from("goals").update({ status: s }).eq("id", g.id);
                              refresh();
                            }}
                          >
                            {s === "active" ? "Resume" : s === "paused" ? "Pause" : "Complete"}
                          </Button>
                        ))}
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
