import { useState } from "react";
import { Star, Trash2, Plus, Loader2, Sparkles, ExternalLink, RotateCcw, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Chip } from "@/components/lifeos/Bits";
import { toast } from "sonner";
import {
  SIZE_META,
  dueLabel,
  isDone,
  type Assignment,
  type AssignmentSize,
  type AssignmentStep,
  type SchoolClass,
} from "@/lib/school";
import {
  addSteps,
  completeAssignment,
  deleteAssignment,
  deleteStep,
  reopenAssignment,
  syncProgress,
  toggleImportant,
  toggleStep,
  updateAssignment,
  updateStep,
} from "@/lib/school.mutations";
import { generateSteps } from "@/lib/school.functions";

const SIZES: AssignmentSize[] = ["small", "medium", "large", "major"];

export function AssignmentSheet({
  assignment,
  steps,
  classes,
  schoolCategoryId,
  onClose,
  onChange,
}: {
  assignment: Assignment | null;
  steps: AssignmentStep[];
  classes: SchoolClass[];
  schoolCategoryId: string | null;
  onClose: () => void;
  onChange: () => void;
}) {
  const [newStep, setNewStep] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  if (!assignment) return null;
  const a = assignment;
  const mine = steps.filter((s) => s.assignment_id === a.id);
  const cls = classes.find((c) => c.id === a.class_id) ?? null;
  const done = isDone(a);

  async function after() {
    await syncProgress(a.id);
    onChange();
  }

  async function suggest() {
    setBusy(true);
    try {
      const { steps: generated } = await generateSteps({
        data: {
          title: a.title,
          description: a.description ?? undefined,
          className: cls?.name,
          large: a.is_large,
          dueDate: a.due_date ?? undefined,
        },
      });
      if (!generated.length) return toast.info("No steps came back — try again.");
      await addSteps(a.id, generated, mine.length);
      await after();
      toast.success(a.is_large ? "Broken into steps." : "First steps added.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not build steps.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="pr-8">{a.title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {cls && <Chip>{cls.name}</Chip>}
          <Chip tone={done ? "" : a.due_date && a.due_date <= new Date().toISOString().slice(0, 10) ? "danger" : ""}>
            {dueLabel(a)}
          </Chip>
          <Chip>
            {SIZE_META[a.size as AssignmentSize]?.label ?? a.size} · {a.points} pts
          </Chip>
          {a.source === "canvas" && <Chip>Canvas</Chip>}
          <button
            className={a.important ? "text-amber-300" : "text-muted-foreground"}
            onClick={async () => {
              await toggleImportant(a.id, !a.important);
              onChange();
            }}
            aria-label="Mark important"
          >
            <Star className="size-4" fill={a.important ? "currentColor" : "none"} />
          </button>
          {a.canvas_url && (
            <a
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
              href={a.canvas_url}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="size-3.5" /> Open in Canvas
            </a>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Due</label>
            <Input
              type="date"
              value={a.due_date ?? ""}
              onChange={async (e) => {
                await updateAssignment(a.id, { due_date: e.target.value || null });
                onChange();
              }}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Class</label>
            <select
              className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm"
              value={a.class_id ?? ""}
              onChange={async (e) => {
                await updateAssignment(a.id, { class_id: e.target.value || null });
                onChange();
              }}
            >
              <option value="">No class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Size</label>
            <select
              className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm"
              value={a.size}
              onChange={async (e) => {
                await updateAssignment(a.id, { size: e.target.value });
                onChange();
              }}
            >
              {SIZES.map((s) => (
                <option key={s} value={s}>
                  {SIZE_META[s].label} — {SIZE_META[s].points} pts
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Full details</label>
          <Textarea
            rows={5}
            defaultValue={a.description ?? ""}
            onBlur={async (e) => {
              if (e.target.value !== (a.description ?? "")) {
                await updateAssignment(a.id, { description: e.target.value || null });
                onChange();
              }
            }}
          />
        </div>

        <div className="rounded-xl border border-border bg-surface/40 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Steps {mine.length > 0 && <span className="text-muted-foreground">· {a.progress}%</span>}
            </p>
            <Button size="sm" variant="outline" disabled={busy} onClick={suggest}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {a.is_large ? "Break it down" : "Suggest first steps"}
            </Button>
          </div>
          <ul className="mt-2 space-y-1.5">
            {mine.map((s) => (
              <li key={s.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={s.done}
                  onChange={async () => {
                    await toggleStep(s.id, !s.done);
                    await after();
                  }}
                />
                {editing === s.id ? (
                  <Input
                    autoFocus
                    className="h-8 flex-1"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={async () => {
                      if (editText.trim()) await updateStep(s.id, editText.trim());
                      setEditing(null);
                      onChange();
                    }}
                  />
                ) : (
                  <button
                    className={`flex-1 text-left ${s.done ? "text-muted-foreground line-through" : ""}`}
                    onClick={() => {
                      setEditing(s.id);
                      setEditText(s.title);
                    }}
                  >
                    {s.title}
                  </button>
                )}
                <button
                  className="text-muted-foreground hover:text-destructive"
                  onClick={async () => {
                    await deleteStep(s.id);
                    await after();
                  }}
                  aria-label="Delete step"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
            {!mine.length && (
              <li className="text-sm text-muted-foreground">
                No steps yet — add your own or let Sprout suggest some.
              </li>
            )}
          </ul>
          <form
            className="mt-2 flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newStep.trim()) return;
              await addSteps(a.id, [newStep.trim()], mine.length);
              setNewStep("");
              await after();
            }}
          >
            <Input
              className="h-9"
              placeholder="Add a step"
              value={newStep}
              onChange={(e) => setNewStep(e.target.value)}
            />
            <Button size="sm" type="submit">
              <Plus className="size-4" />
            </Button>
          </form>
        </div>

        <div className="flex flex-wrap gap-2">
          {done ? (
            <Button
              variant="outline"
              onClick={async () => {
                await reopenAssignment(a);
                onChange();
                toast.info("Reopened — its points were removed.");
              }}
            >
              <RotateCcw className="size-4" /> Reopen
            </Button>
          ) : (
            <Button
              onClick={async () => {
                await completeAssignment(a, schoolCategoryId);
                onChange();
                onClose();
                toast.success(`Done — School points added.`);
              }}
            >
              <Check className="size-4" /> Mark complete
            </Button>
          )}
          <Button
            variant="outline"
            className="text-destructive"
            onClick={async () => {
              await deleteAssignment(a.id);
              onChange();
              onClose();
            }}
          >
            <Trash2 className="size-4" /> Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
