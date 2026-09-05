import { useRef, useState } from "react";
import { ImageUp, ClipboardPaste, PencilLine, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { parseAssignment, type ParsedAssignment } from "@/lib/school.functions";
import { addAssignment, addSteps } from "@/lib/school.mutations";
import { SIZE_META, todayKeyLocal, type AssignmentSize, type SchoolClass } from "@/lib/school";

type Mode = "screenshot" | "paste" | "manual";

const SIZES: AssignmentSize[] = ["small", "medium", "large", "major"];

export function ImportAssignment({
  open,
  onOpenChange,
  classes,
  termId,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  classes: SchoolClass[];
  termId: string | null;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<Mode>("paste");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<ParsedAssignment | null>(null);
  const [classId, setClassId] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setDraft(null);
    setText("");
    setClassId("");
  }

  async function run(payload: { text?: string; imageDataUrl?: string }) {
    setBusy(true);
    try {
      const parsed = await parseAssignment({
        data: {
          ...payload,
          today: todayKeyLocal(),
          classes: classes.map((c) => c.name),
        },
      });
      setDraft(parsed);
      const match = classes.find(
        (c) => parsed.class_name && c.name.toLowerCase() === parsed.class_name.toLowerCase(),
      );
      setClassId(match?.id ?? "");
      if (parsed.missing.length)
        toast.info("A few details need confirming before this is saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not read that.");
    } finally {
      setBusy(false);
    }
  }

  async function onFile(file: File) {
    if (file.size > 6_000_000) return toast.error("That image is too large (max 6 MB).");
    const dataUrl = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.onerror = () => rej(new Error("Could not read the image."));
      r.readAsDataURL(file);
    });
    await run({ imageDataUrl: dataUrl });
  }

  async function save() {
    if (!draft?.title?.trim()) return toast.error("Give the assignment a title.");
    if (!draft.due_date) return toast.error("Pick a due date.");
    setBusy(true);
    try {
      const size = draft.size ?? "medium";
      const created = await addAssignment({
        title: draft.title.trim(),
        description: draft.description,
        class_id: classId || null,
        term_id: termId,
        due_date: draft.due_date,
        due_time: draft.due_time,
        size,
        is_large: draft.is_large,
        estimated_minutes: draft.estimated_minutes ?? SIZE_META[size].minutes,
        source: mode === "manual" ? "manual" : "import",
        first_steps: draft.first_steps,
      });
      if (created?.id && draft.is_large && draft.first_steps.length)
        await addSteps(created.id, draft.first_steps);
      toast.success("Assignment added.");
      reset();
      onOpenChange(false);
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save it.");
    } finally {
      setBusy(false);
    }
  }

  const missing = new Set(draft?.missing ?? []);
  const field = (k: string) =>
    missing.has(k) ? "border-amber-400/70 ring-1 ring-amber-400/40" : "";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add an assignment</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          {(
            [
              ["paste", "Paste from Canvas", ClipboardPaste],
              ["screenshot", "Screenshot", ImageUp],
              ["manual", "By hand", PencilLine],
            ] as const
          ).map(([m, label, Icon]) => (
            <Button
              key={m}
              type="button"
              size="sm"
              variant={mode === m ? "default" : "outline"}
              onClick={() => {
                setMode(m);
                setDraft(
                  m === "manual"
                    ? {
                        title: "",
                        class_name: null,
                        due_date: "",
                        due_time: null,
                        description: "",
                        size: "medium",
                        estimated_minutes: null,
                        is_large: false,
                        first_steps: [],
                        missing: [],
                        notes: null,
                      }
                    : null,
                );
              }}
            >
              <Icon className="size-4" /> {label}
            </Button>
          ))}
        </div>

        {!draft && mode === "paste" && (
          <div className="space-y-2">
            <Textarea
              rows={7}
              placeholder="Paste the assignment page or to-do list copied from Canvas…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <Button disabled={busy || !text.trim()} onClick={() => run({ text })}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Read it
            </Button>
          </div>
        )}

        {!draft && mode === "screenshot" && (
          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onFile(f);
                e.target.value = "";
              }}
            />
            <Button disabled={busy} onClick={() => fileRef.current?.click()}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <ImageUp className="size-4" />}
              Choose a screenshot
            </Button>
            <p className="text-xs text-muted-foreground">
              A photo or screenshot of the Canvas assignment page works best.
            </p>
          </div>
        )}

        {draft && (
          <div className="space-y-3">
            {missing.size > 0 && (
              <p className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
                Please confirm the highlighted details — they weren't clear.
              </p>
            )}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Title</label>
              <Input
                className={field("title")}
                value={draft.title ?? ""}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Class</label>
                <select
                  className={`w-full rounded-md border border-input bg-surface px-3 py-2 text-sm ${field("class_name")}`}
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
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
                <label className="text-xs text-muted-foreground">Due</label>
                <Input
                  type="date"
                  className={field("due_date")}
                  value={draft.due_date ?? ""}
                  onChange={(e) => setDraft({ ...draft, due_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Size</label>
                <select
                  className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm"
                  value={draft.size ?? "medium"}
                  onChange={(e) =>
                    setDraft({ ...draft, size: e.target.value as AssignmentSize })
                  }
                >
                  {SIZES.map((s) => (
                    <option key={s} value={s}>
                      {SIZE_META[s].label} — {SIZE_META[s].points} pts
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-end gap-2 pb-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.is_large}
                  onChange={(e) => setDraft({ ...draft, is_large: e.target.checked })}
                />
                Spans multiple days
              </label>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Details</label>
              <Textarea
                rows={5}
                value={draft.description ?? ""}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>
            {draft.first_steps.length > 0 && (
              <div className="rounded-lg border border-border bg-surface/40 p-3">
                <p className="text-xs font-medium text-muted-foreground">First steps</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm">
                  {draft.first_steps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex gap-2">
              <Button disabled={busy} onClick={save}>
                {busy && <Loader2 className="size-4 animate-spin" />} Save assignment
              </Button>
              <Button variant="outline" onClick={reset}>
                Start over
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
