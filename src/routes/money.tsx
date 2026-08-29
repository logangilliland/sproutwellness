import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Panel, Meter, Stat } from "@/components/lifeos/Bits";
import { useLifeData, useRefreshLife } from "@/hooks/useLifeData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { deleteRow } from "@/lib/mutations";
import {
  addDays,
  money,
  prettyDate,
  startOfWeekKey,
  todayKey,
  totalMoney,
  weekEarnings,
} from "@/lib/lifeos";

export const Route = createFileRoute("/money")({
  head: () => ({
    meta: [
      { title: "Money — Logan's Life OS" },
      {
        name: "description",
        content:
          "Track checking, savings and cash, Uber Eats hours and earnings, hourly rate, spending and income goals.",
      },
      { property: "og:title", content: "Money — Logan's Life OS" },
      {
        property: "og:description",
        content: "Income tracker for Uber Eats shifts, balances, spending and money goals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <Money />
    </AppShell>
  ),
});

function Money() {
  const { data, isLoading } = useLifeData();
  const refresh = useRefreshLife();
  const [shift, setShift] = useState({ date: todayKey(), hours: "", earnings: "", miles: "", notes: "" });
  const [txn, setTxn] = useState({ date: todayKey(), amount: "", kind: "expense", category: "", notes: "" });

  if (isLoading || !data) return <p className="text-muted-foreground">Loading finances…</p>;

  const ws = startOfWeekKey();
  const weekShifts = data.shifts.filter((s) => s.date >= ws && s.date <= addDays(ws, 6));
  const weekHours = weekShifts.reduce((s, x) => s + Number(x.hours), 0);
  const earned = weekEarnings(data);
  const monthPrefix = todayKey().slice(0, 7);
  const monthShifts = data.shifts.filter((s) => s.date.startsWith(monthPrefix));
  const monthEarned = monthShifts.reduce((s, x) => s + Number(x.earnings), 0);
  const allHours = data.shifts.reduce((s, x) => s + Number(x.hours), 0);
  const allEarned = data.shifts.reduce((s, x) => s + Number(x.earnings), 0);
  const rate = allHours ? allEarned / allHours : 21;
  const goal = data.goals.find((g) => g.category === "financial" && g.status === "active");
  const target = Number(goal?.target_value ?? 250);
  const remaining = Math.max(0, target - earned);
  const weekSpend = data.transactions
    .filter((t) => t.kind === "expense" && t.date >= ws)
    .reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Money</h1>
        <p className="text-sm text-muted-foreground">Balances, Uber Eats income and spending.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {data.accounts.map((a) => (
          <Panel key={a.id} title={a.name} className={a.is_savings ? "ring-1 ring-money/40" : ""}>
            <input
              className="stat-number w-full bg-transparent text-2xl outline-none"
              defaultValue={Number(a.balance).toFixed(2)}
              onBlur={async (e) => {
                const v = Number(e.target.value);
                if (!Number.isNaN(v) && v !== Number(a.balance)) {
                  await supabase.from("accounts").update({ balance: v }).eq("id", a.id);
                  refresh();
                }
              }}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {a.is_savings ? "Savings — don't touch" : "Spending money"}
            </p>
          </Panel>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Total money" value={money(totalMoney(data))} tone="text-money" />
        <Stat label="Earned this week" value={money(earned)} sub={`${weekHours.toFixed(1)} hours`} />
        <Stat label="Earned this month" value={money(monthEarned)} />
        <Stat label="Avg hourly" value={money(rate)} />
      </div>

      {goal && (
        <Panel title={`Goal — ${goal.name}`}>
          <div className="flex items-baseline justify-between">
            <span className="stat-number text-3xl text-money">{money(earned)}</span>
            <span className="text-sm text-muted-foreground">of {money(target)}</span>
          </div>
          <Meter tone="money" className="mt-2" value={(earned / Math.max(1, target)) * 100} />
          <p className="mt-2 text-sm text-muted-foreground">
            {money(remaining)} remaining · about {(remaining / Math.max(1, rate)).toFixed(1)} more
            hours at {money(rate)}/hour.
          </p>
        </Panel>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Log an Uber Eats shift">
          <form
            className="grid grid-cols-2 gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              await supabase.from("work_shifts").insert({
                date: shift.date,
                hours: Number(shift.hours || 0),
                earnings: Number(shift.earnings || 0),
                miles: shift.miles ? Number(shift.miles) : null,
                notes: shift.notes || null,
              });
              setShift({ date: todayKey(), hours: "", earnings: "", miles: "", notes: "" });
              refresh();
            }}
          >
            <Input type="date" value={shift.date} onChange={(e) => setShift({ ...shift, date: e.target.value })} />
            <Input placeholder="Hours" inputMode="decimal" value={shift.hours} onChange={(e) => setShift({ ...shift, hours: e.target.value })} />
            <Input placeholder="Earnings $" inputMode="decimal" value={shift.earnings} onChange={(e) => setShift({ ...shift, earnings: e.target.value })} />
            <Input placeholder="Miles (optional)" inputMode="decimal" value={shift.miles} onChange={(e) => setShift({ ...shift, miles: e.target.value })} />
            <Input className="col-span-2" placeholder="Notes" value={shift.notes} onChange={(e) => setShift({ ...shift, notes: e.target.value })} />
            <Button type="submit" className="col-span-2">
              <Plus className="size-4" /> Add shift
            </Button>
          </form>
          <ul className="mt-4 space-y-1.5">
            {data.shifts.slice(0, 8).map((s) => (
              <li key={s.id} className="flex items-center gap-2 text-sm">
                <span className="w-24 text-muted-foreground">{prettyDate(s.date)}</span>
                <span className="font-mono">{Number(s.hours).toFixed(1)}h</span>
                <span className="font-mono text-money">{money(Number(s.earnings))}</span>
                <span className="text-xs text-muted-foreground">
                  {Number(s.hours) ? `${money(Number(s.earnings) / Number(s.hours))}/hr` : ""}
                </span>
                <button
                  className="ml-auto text-muted-foreground hover:text-destructive"
                  onClick={async () => {
                    await deleteRow("work_shifts", s.id);
                    refresh();
                  }}
                  aria-label="Delete shift"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Spending & income">
          <form
            className="grid grid-cols-2 gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              await supabase.from("transactions").insert({
                date: txn.date,
                amount: Number(txn.amount || 0),
                kind: txn.kind,
                category: txn.category || null,
                notes: txn.notes || null,
              });
              setTxn({ date: todayKey(), amount: "", kind: "expense", category: "", notes: "" });
              refresh();
            }}
          >
            <Input type="date" value={txn.date} onChange={(e) => setTxn({ ...txn, date: e.target.value })} />
            <Input placeholder="Amount $" inputMode="decimal" value={txn.amount} onChange={(e) => setTxn({ ...txn, amount: e.target.value })} />
            <select
              className="rounded-md border border-input bg-surface px-3 py-2 text-sm"
              value={txn.kind}
              onChange={(e) => setTxn({ ...txn, kind: e.target.value })}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="savings">To savings</option>
            </select>
            <Input placeholder="Category" value={txn.category} onChange={(e) => setTxn({ ...txn, category: e.target.value })} />
            <Button type="submit" className="col-span-2">
              <Plus className="size-4" /> Add entry
            </Button>
          </form>
          <p className="mt-3 text-sm text-muted-foreground">
            Spent this week: <span className="font-mono text-foreground">{money(weekSpend)}</span> ·
            comfortable budget $200/wk
          </p>
          <ul className="mt-2 space-y-1.5">
            {data.transactions.slice(0, 8).map((t) => (
              <li key={t.id} className="flex items-center gap-2 text-sm">
                <span className="w-24 text-muted-foreground">{prettyDate(t.date)}</span>
                <span className={t.kind === "expense" ? "font-mono text-destructive" : "font-mono text-primary"}>
                  {t.kind === "expense" ? "-" : "+"}
                  {money(Number(t.amount))}
                </span>
                <span className="truncate text-xs text-muted-foreground">{t.category ?? t.notes}</span>
                <button
                  className="ml-auto text-muted-foreground hover:text-destructive"
                  onClick={async () => {
                    await deleteRow("transactions", t.id);
                    refresh();
                  }}
                  aria-label="Delete entry"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
