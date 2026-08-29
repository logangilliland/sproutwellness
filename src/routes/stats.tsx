import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { Panel, Stat, Heatmap } from "@/components/lifeos/Bits";
import { useLifeData } from "@/hooks/useLifeData";
import {
  addDays,
  bestStreak,
  exerciseThisWeek,
  lastNDays,
  lifeScore,
  money,
  productivityScore,
  startOfWeekKey,
  streak,
  todayKey,
  vapeFreeDates,
  weekEarnings,
} from "@/lib/lifeos";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "Stats — Logan's Life OS" },
      {
        name: "description",
        content:
          "Daily, weekly and monthly trends: productivity score, habit completion, earnings, hours worked, exercise and vape-free days.",
      },
      { property: "og:title", content: "Stats — Logan's Life OS" },
      {
        property: "og:description",
        content: "Charts and streaks that show whether you're actually improving.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <StatsPage />
    </AppShell>
  ),
});

const axis = { stroke: "oklch(0.7 0.02 260)", fontSize: 11 };

function StatsPage() {
  const { data, isLoading } = useLifeData();

  const charts = useMemo(() => {
    if (!data) return null;
    const days = lastNDays(30);
    const daily = days.map((d) => {
      const shifts = data.shifts.filter((s) => s.date === d);
      return {
        date: d.slice(5),
        key: d,
        productivity: productivityScore(data, d),
        earned: shifts.reduce((s, x) => s + Number(x.earnings), 0),
        hours: shifts.reduce((s, x) => s + Number(x.hours), 0),
        habits: data.habitLogs.filter((l) => l.date === d && l.completed).length,
        tasks: data.tasks.filter((t) => t.date === d && t.done).length,
      };
    });

    const weeks = Array.from({ length: 8 }, (_, i) => {
      const start = addDays(startOfWeekKey(), -7 * (7 - i));
      const end = addDays(start, 6);
      const inRange = (d: string) => d >= start && d <= end;
      const dd = lastNDays(7, end);
      return {
        week: start.slice(5),
        productivity: Math.round(
          dd.reduce((s, d) => s + productivityScore(data, d), 0) / 7,
        ),
        earned: data.shifts.filter((s) => inRange(s.date)).reduce((s, x) => s + Number(x.earnings), 0),
        hours: data.shifts.filter((s) => inRange(s.date)).reduce((s, x) => s + Number(x.hours), 0),
        habits: data.habitLogs.filter((l) => inRange(l.date) && l.completed).length,
        vapeFree: vapeFreeDates(data).filter(inRange).length,
      };
    });

    return { daily, weeks };
  }, [data]);

  if (isLoading || !data || !charts) return <p className="text-muted-foreground">Crunching numbers…</p>;

  const ls = lifeScore(data);
  const vape = vapeFreeDates(data);
  const days90 = lastNDays(90);
  const prodToday = productivityScore(data, todayKey());
  const last7 = lastNDays(7).map((d) => productivityScore(data, d));
  const prev7 = lastNDays(7, addDays(todayKey(), -7)).map((d) => productivityScore(data, d));
  const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const delta = Math.round(avg(last7) - avg(prev7));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Statistics</h1>
        <p className="text-sm text-muted-foreground">
          Are you actually improving? This page answers that.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Today" value={`${prodToday}/100`} sub="productivity" />
        <Stat
          label="7-day average"
          value={Math.round(avg(last7))}
          sub={`${delta >= 0 ? "+" : ""}${delta} vs previous week`}
          tone={delta >= 0 ? "text-primary" : "text-destructive"}
        />
        <Stat label="Life score" value={ls.total} sub="14-day rolling" />
        <Stat label="Earned this week" value={money(weekEarnings(data))} tone="text-money" />
      </div>

      <Panel title="Daily productivity — last 30 days">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={charts.daily}>
              <defs>
                <linearGradient id="prod" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.85 0.19 132)" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="oklch(0.85 0.19 132)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 260)" />
              <XAxis dataKey="date" tick={axis} interval={4} />
              <YAxis domain={[0, 100]} tick={axis} width={30} />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.21 0.02 260)",
                  border: "1px solid oklch(0.3 0.02 260)",
                  borderRadius: 12,
                  color: "oklch(0.96 0.005 260)",
                }}
              />
              <Area
                type="monotone"
                dataKey="productivity"
                stroke="oklch(0.85 0.19 132)"
                fill="url(#prod)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Weekly earnings & hours">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.weeks}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 260)" />
                <XAxis dataKey="week" tick={axis} />
                <YAxis tick={axis} width={34} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.21 0.02 260)",
                    border: "1px solid oklch(0.3 0.02 260)",
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="earned" fill="oklch(0.82 0.16 85)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="hours" fill="oklch(0.78 0.15 200)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Weekly habits completed & vape-free days">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.weeks}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 260)" />
                <XAxis dataKey="week" tick={axis} />
                <YAxis tick={axis} width={30} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.21 0.02 260)",
                    border: "1px solid oklch(0.3 0.02 260)",
                    borderRadius: 12,
                  }}
                />
                <Line type="monotone" dataKey="habits" stroke="oklch(0.85 0.19 132)" strokeWidth={2} />
                <Line type="monotone" dataKey="vapeFree" stroke="oklch(0.75 0.16 320)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="🚭 Vape-free streak" value={`${streak(new Set(vape))} days`} sub={`best ${bestStreak(vape)}`} />
        <Stat label="🏃 Activities this week" value={exerciseThisWeek(data)} />
        <Stat
          label="✅ Tasks completed (30d)"
          value={charts.daily.reduce((s, d) => s + d.tasks, 0)}
        />
        <Stat
          label="⏱️ Hours worked (30d)"
          value={charts.daily.reduce((s, d) => s + d.hours, 0).toFixed(1)}
        />
      </div>

      <Panel title="Vape-free heatmap — last 90 days">
        <Heatmap days={days90} active={new Set(vape)} tone="bg-vape" />
      </Panel>

      <Panel title="Change log">
        <ul className="space-y-2">
          {data.changes.map((c) => (
            <li key={c.id} className="flex gap-3 text-sm">
              <span className="w-28 shrink-0 text-xs text-muted-foreground">
                {new Date(c.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
              <span>
                {c.summary}
                {c.detail && <span className="text-muted-foreground"> — {c.detail}</span>}
              </span>
            </li>
          ))}
          {!data.changes.length && <li className="text-sm text-muted-foreground">No changes yet.</li>}
        </ul>
      </Panel>
    </div>
  );
}
