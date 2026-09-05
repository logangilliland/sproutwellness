import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.7-flash";

export type ParsedAssignment = {
  title: string | null;
  class_name: string | null;
  due_date: string | null;
  due_time: string | null;
  description: string | null;
  size: "small" | "medium" | "large" | "major" | null;
  estimated_minutes: number | null;
  is_large: boolean;
  first_steps: string[];
  missing: string[];
  notes: string | null;
};

const EXTRACT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: ["string", "null"] },
    class_name: { type: ["string", "null"] },
    due_date: { type: ["string", "null"], description: "YYYY-MM-DD, only if clearly stated" },
    due_time: { type: ["string", "null"] },
    description: { type: ["string", "null"] },
    size: { type: ["string", "null"], enum: ["small", "medium", "large", "major", null] },
    estimated_minutes: { type: ["number", "null"] },
    is_large: { type: "boolean" },
    first_steps: { type: "array", items: { type: "string" } },
    missing: { type: "array", items: { type: "string" } },
    notes: { type: ["string", "null"] },
  },
  required: [
    "title",
    "class_name",
    "due_date",
    "due_time",
    "description",
    "size",
    "estimated_minutes",
    "is_large",
    "first_steps",
    "missing",
    "notes",
  ],
} as const;

function systemPrompt(today: string, classes: string[]) {
  return [
    "You extract a single school assignment from Canvas content (a screenshot or pasted text).",
    `Today is ${today}. Resolve relative dates against it and output ISO YYYY-MM-DD.`,
    "NEVER guess a due date, title or class. If a field is not clearly present, return null for it and list its name in `missing`.",
    classes.length
      ? `The user's existing classes are: ${classes.join(", ")}. Match the class name to one of these when it clearly refers to the same course; otherwise return the name as written.`
      : "The user has no classes on file yet.",
    "Keep the description complete — do not summarise away instructions, requirements or rubric details.",
    "Estimate size: small (<45 min quiz/reading/discussion post), medium (a normal homework set or lab), large (multi-hour paper, big lab report, project milestone), major (term project or research paper).",
    "is_large is true when the work realistically spans multiple days.",
    "first_steps: 3-6 short, concrete, practical actions to begin the assignment. No fluff.",
  ].join("\n");
}

async function callGateway(body: unknown) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429) throw new Error("The AI is busy right now — try again in a moment.");
    if (res.status === 402)
      throw new Error("AI credits are exhausted. Add credits in Lovable to keep using AI import.");
    throw new Error(`AI request failed [${res.status}]: ${text}`);
  }
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content ?? "";
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    const m = content.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]) as Record<string, unknown>;
    throw new Error("The AI response could not be read. Try again.");
  }
}

function normalise(raw: Record<string, unknown>): ParsedAssignment {
  const arr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const missing = new Set(arr(raw.missing));
  const out: ParsedAssignment = {
    title: str(raw.title),
    class_name: str(raw.class_name),
    due_date: /^\d{4}-\d{2}-\d{2}$/.test(String(raw.due_date ?? "")) ? String(raw.due_date) : null,
    due_time: str(raw.due_time),
    description: str(raw.description),
    size: (["small", "medium", "large", "major"] as const).includes(raw.size as never)
      ? (raw.size as ParsedAssignment["size"])
      : null,
    estimated_minutes: typeof raw.estimated_minutes === "number" ? raw.estimated_minutes : null,
    is_large: raw.is_large === true,
    first_steps: arr(raw.first_steps).slice(0, 6),
    missing: [],
    notes: str(raw.notes),
  };
  if (!out.title) missing.add("title");
  if (!out.due_date) missing.add("due_date");
  if (!out.class_name) missing.add("class_name");
  out.missing = [...missing];
  return out;
}

const ImportInput = z.object({
  text: z.string().max(20000).optional(),
  imageDataUrl: z.string().max(9_000_000).optional(),
  today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  classes: z.array(z.string()).max(50).default([]),
});

/** Parse a pasted Canvas block or an uploaded screenshot into an assignment draft. */
export const parseAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ImportInput.parse(d))
  .handler(async ({ data }) => {
    if (!data.text && !data.imageDataUrl) throw new Error("Nothing to read.");
    const userContent: unknown[] = [];
    if (data.text) userContent.push({ type: "text", text: data.text });
    if (data.imageDataUrl)
      userContent.push({ type: "image_url", image_url: { url: data.imageDataUrl } });

    const raw = await callGateway({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt(data.today, data.classes) },
        { role: "user", content: userContent },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "assignment", strict: true, schema: EXTRACT_SCHEMA },
      },
    });
    return normalise(raw);
  });

/** Generate first steps / a large-assignment breakdown from the assignment itself. */
export const generateSteps = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        title: z.string().min(1),
        description: z.string().max(20000).optional(),
        className: z.string().optional(),
        large: z.boolean().default(false),
        dueDate: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const raw = await callGateway({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: data.large
            ? "Break a large school assignment into 6-10 ordered, concrete working steps that can be spread across several days. Short imperative phrases, no numbering, no fluff."
            : "Give 3-5 concrete first steps for starting a school assignment. Short imperative phrases, no numbering, no fluff.",
        },
        {
          role: "user",
          content: [
            data.className ? `Class: ${data.className}` : "",
            `Assignment: ${data.title}`,
            data.dueDate ? `Due: ${data.dueDate}` : "",
            data.description ? `Details: ${data.description}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "steps",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: { steps: { type: "array", items: { type: "string" } } },
            required: ["steps"],
          },
        },
      },
    });
    const steps = Array.isArray(raw.steps)
      ? raw.steps.filter((s): s is string => typeof s === "string").slice(0, 10)
      : [];
    return { steps };
  });
