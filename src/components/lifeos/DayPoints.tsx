import { useEffect, useMemo, useState } from "react";
import { Plus, Settings2, Trash2 } from "lucide-react";
import { Panel, Meter, Ring } from "@/components/lifeos/Bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addOptionalCategory,
  deleteActivity,
  logActivity,
  saveDayScore,
  setAllTargets,
  setCategoryTarget,
} from "@/lib/mutations";
import {
  OPTIONAL_CATEGORIES,
  computeBreakdown,
  isPerfectDay,
  type PointActivity,
  type PointCategory,
  type PointSuggestion,
} from "@/lib/points";
import { toast } from "sonner";
import { useSchool } from "@/hooks/useSchool";
import { schoolRequiredComplete } from "@/lib/school";

export function DayPoints({
  date,
  categories,
  activities,
  suggestions,
  refresh,
}: {
  date: string;
  categories: PointCategory[];
  activities: PointActivity[];
  suggestions: PointSuggestion[];
  refresh: () => void;
}) {
  const { data: school } = useSchool();
  const schoolOk = schoolRequiredComplete(school?.assignments ?? [], date);
  const [showSettings, setShowSettings] = useState(false);
  const [globalTarget, setGlobalTarget] = useState("25");

  const { breakdown, overall } = useMemo(
    () =>
      computeBreakdown(categories, activities, date, {
        schoolRequiredIncomplete: !schoolOk,
      }),
    [categories, activities, date, schoolOk],
  );

  // Permanently record this day's score (uses today's targets, so history is not rewritten later).
  useEffect(() => {
    if (!breakdown.length) return;
    void saveDayScore(date, breakdown, overall);
  }, [date, overall, JSON.stringify(breakdown)]); // eslint-disable-line react-hooks/exhaustive-deps

  const active = categories
    .filter((c) => c.active)
    .sort((a, b) => a.sort_order - b.sort_order);
  const missingOptional = OPTIONAL_CATEGORIES.filter(
    (o) => !categories.some((c) => c.key === o.key),
  );

  async function log(cat: PointCategory, title: string, points: number, reason?: string) {
    await logActivity({ category_id: cat.id, title, points, date, reason: reason ?? null });
    refresh();
    toast.success(`${cat.emoji} ${cat.label} +${points} — ${title}`);
  }

  return (
    <div className="space-y-4">
      <Panel
        title="Today"
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings((v) => !v)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <Settings2 className="size-3.5" /> Targets
          </Button>
        }
      >
        <div className="flex flex-wrap items-center gap-5">
          <Ring value={overall} label="overall" />
          <div className="min-w-[12rem] flex-1 space-y-2">
            {breakdown.map((b) => (
              <div key={b.key}>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {b.emoji} {b.label}
                  </span>
                  <span className="font-mono">
                    {b.points}/{b.target}
                    {b.points >= b.target && <span className="ml-1 text-primary">✓</span>}
                    {b.bonus > 0 && <span className="ml-1 text-money">+{b.bonus} bonus</span>}
                  </span>
                </div>
                <Meter value={b.pct} className="mt-1" />
              </div>
            ))}
            {isPerfectDay(breakdown) && (
              <p className="rounded-lg border border-primary/40 bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                PERFECT DAY — every category hit its target.
              </p>
            )}
          </div>
        </div>

        {showSettings && (
          <div className="mt-4 space-y-3 rounded-lg border border-border bg-surface/40 p-3">
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label className="text-[10px] uppercase text-muted-foreground">
                  Daily target (all categories)
                </label>
                <Input
                  type="number"
                  min={1}
                  className="mt-1 w-28"
                  value={globalTarget}
                  onChange={(e) => setGlobalTarget(e.target.value)}
                />
              </div>
              <Button
                size="sm"
                onClick={async () => {
                  const n = Number(globalTarget);
                  if (!n || n < 1) return;
                  await setAllTargets(categories.map((c) => c.id), n);
                  refresh();
                  toast.success(`Daily target set to ${n} points for every category.`);
                }}
              >
                Apply to all
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {categories
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((c) => (
                  <div key={c.id} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 truncate">
                      {c.emoji} {c.label}
                    </span>
                    <Input
                      type="number"
                      min={1}
                      defaultValue={c.daily_target}
                      className="w-20"
                      onBlur={async (e) => {
                        const n = Number(e.target.value);
                        if (!n || n === c.daily_target) return;
                        await setCategoryTarget(c.id, n);
                        refresh();
                      }}
                    />
                  </div>
                ))}
            </div>
            {missingOptional.map((o) => (
              <Button
                key={o.key}
                size="sm"
                variant="secondary"
                onClick={async () => {
                  await addOptionalCategory(o.key);
                  refresh();
                  toast.success(`${o.emoji} ${o.label} category added.`);
                }}
              >
                <Plus className="size-3.5" /> Add {o.emoji} {o.label}
              </Button>
            ))}
            <p className="text-xs text-muted-foreground">
              Changing a target only affects today onward — past days keep the score they were
              given.
            </p>
          </div>
        )}
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2">
        {active.map((cat) => {
          const b = breakdown.find((x) => x.key === cat.key);
          if (!b) return null;
          const logged = activities.filter((a) => a.date === date && a.category_id === cat.id);
          const sugg = suggestions
            .filter((s) => s.date === date && s.category_id === cat.id)
            .sort((a, b2) => a.sort_order - b2.sort_order)
            .slice(0, 5);
          return (
            <Panel key={cat.id}>
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-sm font-bold uppercase">
                  {cat.emoji} {cat.label}
                </h3>
                <span className="stat-number text-lg">
                  {b.points}/{b.target}
                  {b.points >= b.target && <span className="ml-1 text-primary">✓</span>}
                </span>
              </div>
              <Meter value={b.pct} className="mt-2" />
              {b.bonus > 0 && (
                <p className="mt-1 text-xs text-money">+{b.bonus} bonus points</p>
              )}

              {logged.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {logged.map((a) => (
                    <li
                      key={a.id}
                      className="group flex items-center gap-2 rounded-md bg-surface/60 px-2 py-1 text-sm"
                    >
                      <span className="flex-1 truncate" title={a.reason ?? undefined}>
                        {a.title}
                      </span>
                      <span className="font-mono text-xs text-primary">+{a.points}</span>
                       <Button
                         variant="ghost"
                         size="icon"
                        aria-label="Remove activity"
                         className="size-8 opacity-70 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                        onClick={async () => {
                          await deleteActivity(a.id);
                          refresh();
                        }}
                       >
                        <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                       </Button>
                    </li>
                  ))}
                </ul>
              )}

              {b.points < b.target && sugg.length > 0 && (
                <div className="mt-3">
                   <p className="text-[10px] uppercase text-muted-foreground">
                    Suggested
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {sugg.map((s) => (
                      <Button
                        key={s.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => log(cat, s.title, s.points, "Suggested activity")}
                        className="h-8 rounded-full px-2.5 text-xs"
                      >
                        {s.title} <span className="font-mono text-primary">+{s.points}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <CustomLog cat={cat} onLog={log} />
            </Panel>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Did something else instead? Log it here or just tell the assistant — it assigns the points.
      </p>
    </div>
  );
}

function CustomLog({
  cat,
  onLog,
}: {
  cat: PointCategory;
  onLog: (cat: PointCategory, title: string, points: number) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [pts, setPts] = useState("15");
  return (
    <form
      className="mt-3 flex gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const n = Number(pts);
        if (!title.trim() || !n) return;
        await onLog(cat, title.trim(), n);
        setTitle("");
        setPts("15");
      }}
    >
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Something else you did…"
        className="h-9"
      />
      <Input
        type="number"
        value={pts}
        onChange={(e) => setPts(e.target.value)}
        className="h-9 w-16"
        aria-label="Points"
      />
      <Button type="submit" size="icon" className="size-9" aria-label="Log activity">
        <Plus className="size-4" />
      </Button>
    </form>
  );
}
