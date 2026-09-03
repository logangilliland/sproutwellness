import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Panel } from "@/components/lifeos/Bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useLifeData, useRefreshLife } from "@/hooks/useLifeData";
import { useProfile, useRefreshProfile, saveProfile } from "@/hooks/useProfile";
import { addJob, deleteJob, resetSprout, setPrimaryJob, updateJob } from "@/lib/mutations";
import {
  DIFFICULTIES,
  SECTIONS,
  type Difficulty,
  type SectionKey,
} from "@/lib/profile";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Sprout" },
      {
        name: "description",
        content:
          "Edit your name, jobs, daily point targets, and which Sprout sections you use — or reset everything.",
      },
      { property: "og:title", content: "Settings — Sprout" },
      {
        property: "og:description",
        content: "Configure Sprout: profile, jobs, sections, difficulty and reset.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <SettingsPage />
    </AppShell>
  ),
});

function SettingsPage() {
  const { profile } = useProfile();
  const refreshProfile = useRefreshProfile();
  const { data } = useLifeData();
  const refresh = useRefreshLife();
  const navigate = useNavigate();
  const [name, setName] = useState(profile?.display_name ?? "");
  const [job, setJob] = useState({ name: "", employer: "", position: "", pay_rate: "", pay_type: "hourly" });
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!profile) return <p className="text-muted-foreground">Loading settings…</p>;
  const settings = profile.settings;

  async function setSection(key: SectionKey, on: boolean) {
    if (!profile) return;
    await saveProfile({
      settings: { ...settings, sections: { ...settings.sections, [key]: on } },
    });
    refreshProfile();
  }

  async function setDifficulty(d: Difficulty) {
    if (!profile) return;
    await saveProfile({ settings: { ...settings, difficulty: d } });
    const ids = (data?.categories ?? []).map((c) => c.id);
    if (ids.length) {
      await supabase
        .from("point_categories")
        .update({ daily_target: DIFFICULTIES[d].target })
        .in("id", ids);
    }
    refreshProfile();
    refresh();
    toast.success(`Daily targets set to ${DIFFICULTIES[d].target} points per category`);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Make Sprout yours.</p>
      </div>

      <Panel title="Profile">
        <Label htmlFor="name">Display name</Label>
        <div className="mt-1.5 flex gap-2">
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          <Button
            onClick={async () => {
              await saveProfile({ display_name: name.trim() || "friend" });
              refreshProfile();
              toast.success("Name saved");
            }}
          >
            Save
          </Button>
        </div>
      </Panel>

      <Panel title="Daily difficulty">
        <div className="grid gap-2 sm:grid-cols-3">
          {(Object.keys(DIFFICULTIES) as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={cn(
                "rounded-xl border px-3 py-3 text-left text-sm transition-colors",
                settings.difficulty === d
                  ? "border-primary/60 bg-primary/10"
                  : "border-border bg-surface/40",
              )}
            >
              <span className="font-medium">{DIFFICULTIES[d].label}</span>
              <span className="block text-xs text-muted-foreground">{DIFFICULTIES[d].blurb}</span>
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Sections">
        <div className="grid gap-2">
          {SECTIONS.map((s) => {
            const on = settings.sections[s.key] !== false;
            return (
              <div
                key={s.key}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface/40 px-3 py-2.5 text-sm"
              >
                <span>{s.emoji}</span>
                <span className="flex-1">
                  <span className="font-medium">
                    {s.label}
                    {s.comingSoon ? " — Under Construction" : ""}
                  </span>
                  <span className="block text-xs text-muted-foreground">{s.blurb}</span>
                </span>
                <Button
                  size="sm"
                  variant={on && !s.comingSoon ? "default" : "outline"}
                  disabled={s.comingSoon}
                  onClick={() => setSection(s.key, !on)}
                >
                  {s.comingSoon ? "Soon" : on ? "On" : "Off"}
                </Button>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Turning a section off hides it — your data is kept.
        </p>
      </Panel>

      <Panel title="Jobs">
        <form
          className="grid gap-2 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!job.name.trim()) return;
            await addJob({
              name: job.name.trim(),
              employer: job.employer.trim() || null,
              position: job.position.trim() || null,
              pay_rate: job.pay_rate ? Number(job.pay_rate) : 0,
              pay_type: job.pay_type,
              is_primary: !(data?.jobs ?? []).length,
            });
            setJob({ name: "", employer: "", position: "", pay_rate: "", pay_type: "hourly" });
            refresh();
          }}
        >
          <Input placeholder="Job name" value={job.name} onChange={(e) => setJob({ ...job, name: e.target.value })} />
          <Input placeholder="Employer" value={job.employer} onChange={(e) => setJob({ ...job, employer: e.target.value })} />
          <Input placeholder="Position" value={job.position} onChange={(e) => setJob({ ...job, position: e.target.value })} />
          <div className="flex gap-2">
            <Input placeholder="Pay rate" inputMode="decimal" value={job.pay_rate} onChange={(e) => setJob({ ...job, pay_rate: e.target.value })} />
            <select
              className="rounded-md border border-input bg-surface px-3 py-2 text-sm"
              value={job.pay_type}
              onChange={(e) => setJob({ ...job, pay_type: e.target.value })}
            >
              <option value="hourly">/hour</option>
              <option value="salary">salary</option>
              <option value="gig">gig</option>
            </select>
          </div>
          <Button type="submit" className="sm:col-span-2">
            <Plus className="size-4" /> Add job
          </Button>
        </form>

        <ul className="mt-4 space-y-2">
          {(data?.jobs ?? []).map((j) => (
            <li key={j.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface/40 px-3 py-2 text-sm">
              <span className="font-medium">{j.name}</span>
              <span className="text-xs text-muted-foreground">
                {[j.employer, j.position].filter(Boolean).join(" · ")}
                {j.pay_rate ? ` · $${Number(j.pay_rate).toFixed(2)} ${j.pay_type}` : ""}
              </span>
              {j.is_primary && <span className="rounded bg-primary/15 px-1.5 text-xs text-primary">primary</span>}
              <select
                className="ml-auto rounded-md border border-input bg-surface px-2 py-1 text-xs"
                value={j.status}
                onChange={async (e) => {
                  await updateJob(j.id, { status: e.target.value });
                  refresh();
                }}
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
              </select>
              {!j.is_primary && (
                <button
                  className="text-xs text-muted-foreground hover:text-primary"
                  onClick={async () => {
                    await setPrimaryJob(j.id);
                    refresh();
                  }}
                >
                  Make primary
                </button>
              )}
              <button
                className="text-muted-foreground hover:text-destructive"
                aria-label="Delete job"
                onClick={async () => {
                  await deleteJob(j.id);
                  refresh();
                }}
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Reset Sprout">
        <p className="text-sm text-muted-foreground">
          Deletes all of your habits, tasks, projects, goals, money, garden and chat data and starts
          onboarding again. Your account stays.
        </p>
        {!confirmReset ? (
          <Button variant="outline" className="mt-3" onClick={() => setConfirmReset(true)}>
            Reset Sprout
          </Button>
        ) : (
          <div className="mt-3 flex gap-2">
            <Button
              variant="destructive"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await resetSprout();
                  refreshProfile();
                  refresh();
                  navigate({ to: "/onboarding" });
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Reset failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Yes, erase everything
            </Button>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
          </div>
        )}
      </Panel>
    </div>
  );
}
