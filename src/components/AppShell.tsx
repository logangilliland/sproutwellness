import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  LayoutDashboard,
  LogOut,
  Settings as SettingsIcon,
  Target,
  Wallet,
  Boxes,
  Sprout,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { sectionOn, type SectionKey } from "@/lib/profile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV: Array<{
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  section?: SectionKey;
}> = [
  { to: "/", label: "Today", icon: LayoutDashboard },
  { to: "/garden", label: "Garden", icon: Sprout, section: "garden" },
  { to: "/habits", label: "Habits", icon: CheckCircle2, section: "habits" },
  { to: "/money", label: "Money", icon: Wallet, section: "money" },
  { to: "/goals", label: "Goals", icon: Target, section: "goals" },
  { to: "/projects", label: "Projects", icon: Boxes, section: "projects" },
  { to: "/calendar", label: "Calendar", icon: CalendarDays, section: "calendar" },
  { to: "/stats", label: "Stats", icon: BarChart3, section: "stats" },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  useEffect(() => {
    if (session && profile && !profile.onboarded && path !== "/onboarding") {
      navigate({ to: "/onboarding" });
    }
  }, [session, profile, path, navigate]);

  if (loading || !session || profileLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        Loading Sprout…
      </div>
    );
  }

  const settings = profile?.settings;
  const nav = NAV.filter((n) => !n.section || !settings || sectionOn(settings, n.section));
  const primary = nav.slice(0, 5);
  const rest = nav.slice(5);

  return (
    <div className="min-h-dvh pb-28 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-border bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3.5 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2 font-display text-sm font-bold">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Sprout className="size-4" />
            </span>
            <span className="truncate text-primary">SPROUT</span>
          </Link>
          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {nav.map((item) => (
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
          {primary.map((item) => (
            <NavTile key={item.to} item={item} active={path === item.to} />
          ))}
        </div>
        {rest.length > 0 && (
          <div
            className="grid gap-1 border-t border-border px-1 py-1.5"
            style={{ gridTemplateColumns: `repeat(${Math.min(rest.length, 5)}, minmax(0, 1fr))` }}
          >
            {rest.map((item) => (
              <NavTile key={item.to} item={item} active={path === item.to} />
            ))}
          </div>
        )}
      </nav>
    </div>
  );
}

function NavTile({
  item,
  active,
}: {
  item: { to: string; label: string; icon: typeof LayoutDashboard };
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      className={cn(
        "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-[10px] text-muted-foreground transition-colors",
        active && "bg-primary/15 text-primary",
      )}
    >
      <Icon className="size-4" />
      {item.label}
    </Link>
  );
}
