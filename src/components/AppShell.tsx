import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Target,
  Wallet,
  Boxes,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Today", icon: LayoutDashboard },
  { to: "/habits", label: "Habits", icon: CheckCircle2 },
  { to: "/money", label: "Money", icon: Wallet },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/projects", label: "Projects", icon: Boxes },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/school", label: "School", icon: GraduationCap },
  { to: "/stats", label: "Stats", icon: BarChart3 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        Loading your Life OS…
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-28 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-border bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3.5 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2 font-display text-sm font-bold">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-xs text-primary-foreground shadow-lg shadow-primary/20">L</span>
            <span className="truncate">LOGAN&apos;S <span className="text-primary">LIFE OS</span></span>
          </Link>
          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                  path === item.to && "bg-primary/15 text-primary shadow-sm shadow-primary/10",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => supabase.auth.signOut()}
            className="ml-auto text-muted-foreground hover:text-foreground md:ml-2"
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/90 backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-5 gap-1 px-1 py-1.5">
          {NAV.slice(0, 5).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-[10px] text-muted-foreground transition-colors",
                  path === item.to && "bg-primary/15 text-primary",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="grid grid-cols-4 gap-1 border-t border-border px-1 py-1.5">
          {NAV.slice(5).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-[10px] text-muted-foreground transition-colors",
                  path === item.to && "bg-primary/15 text-primary",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
