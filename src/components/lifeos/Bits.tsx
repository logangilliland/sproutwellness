import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  children,
  className,
  title,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className={cn("panel p-4 sm:p-5", className)}>
      {(title || action) && (
        <header className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-display text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {title}
          </h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Meter({
  value,
  tone = "primary",
  className,
}: {
  value: number;
  tone?: "primary" | "money" | "fitness" | "vape" | "school" | "destructive";
  className?: string;
}) {
  const toneClass = {
    primary: "bg-primary",
    money: "bg-money",
    fitness: "bg-fitness",
    vape: "bg-vape",
    school: "bg-school",
    destructive: "bg-destructive",
  }[tone];
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-500", toneClass)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function Ring({ value, label }: { value: number; label?: string }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid size-32 place-items-center">
      <svg viewBox="0 0 110 110" className="size-32 -rotate-90">
        <circle cx="55" cy="55" r={r} className="fill-none stroke-muted" strokeWidth="9" />
        <circle
          cx="55"
          cy="55"
          r={r}
          className="fill-none stroke-primary transition-all duration-700"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (Math.min(100, Math.max(0, value)) / 100) * c}
        />
      </svg>
      <div className="absolute text-center">
        <div className="stat-number text-3xl">{Math.round(value)}</div>
        {label && (
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
        )}
      </div>
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface/50 p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={cn("stat-number mt-1 text-2xl", tone)}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function Chip({ children, tone }: { children: ReactNode; tone?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-muted-foreground",
        tone,
      )}
    >
      {children}
    </span>
  );
}

export function Heatmap({
  days,
  active,
  tone = "bg-primary",
}: {
  days: string[];
  active: Set<string>;
  tone?: string;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {days.map((d) => (
        <span
          key={d}
          title={d}
          className={cn(
            "size-3 rounded-[3px]",
            active.has(d) ? tone : "bg-muted",
            active.has(d) ? "opacity-100" : "opacity-60",
          )}
        />
      ))}
    </div>
  );
}
