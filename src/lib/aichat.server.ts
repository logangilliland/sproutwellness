import type { SupabaseClient } from "@supabase/supabase-js";

/* eslint-disable @typescript-eslint/no-explicit-any */
type DB = SupabaseClient<any, any, any>;

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function buildSnapshot(supabase: DB) {
  const today = todayKey();
  const [habits, logs, tasks, projects, goals, events, accounts, shifts, txns, daily, classes] =
    await Promise.all([
      supabase.from("habits").select("id,name,category,active,frequency,target_per_week"),
      supabase.from("habit_logs").select("habit_id,date,completed").gte("date", "1900-01-01"),
      supabase.from("tasks").select("id,title,date,priority,done,project_id"),
      supabase.from("projects").select("id,name,deadline,status"),
      supabase.from("goals").select("id,name,category,target_value,current_value,unit,deadline,status"),
      supabase.from("events").select("id,title,type,date,time,is_milestone").order("date"),
      supabase.from("accounts").select("id,name,kind,balance,is_savings"),
      supabase.from("work_shifts").select("date,hours,earnings").order("date", { ascending: false }).limit(30),
      supabase.from("transactions").select("date,amount,kind,category").order("date", { ascending: false }).limit(20),
      supabase.from("daily_logs").select("date,vape_free,exercise_minutes,weed_night_only").order("date", { ascending: false }).limit(30),
      supabase.from("classes").select("name,professor,meeting_times,location,term"),
    ]);

  const habitList = habits.data ?? [];
  const logList = logs.data ?? [];
  const doneToday = new Set(
    logList.filter((l: any) => l.date === today && l.completed).map((l: any) => l.habit_id),
  );

  const lines: string[] = [];
  lines.push(`TODAY: ${today}`);
  lines.push(
    `HABITS: ${habitList
      .map((h: any) => `${h.name} [${h.category}${h.active ? "" : ", paused"}${doneToday.has(h.id) ? ", done today" : ""}]`)
      .join("; ")}`,
  );
  lines.push(
    `TODAY'S TASKS: ${(tasks.data ?? [])
      .filter((t: any) => t.date === today)
      .map((t: any) => `${t.title}${t.done ? " ✓" : ""} (P${t.priority})`)
      .join("; ") || "none"}`,
  );
  lines.push(
    `PROJECTS: ${(projects.data ?? [])
      .map((p: any) => {
        const pt = (tasks.data ?? []).filter((t: any) => t.project_id === p.id);
        return `${p.name} — ${pt.filter((t: any) => t.done).length}/${pt.length} done, due ${p.deadline ?? "n/a"}; open steps: ${pt
          .filter((t: any) => !t.done)
          .map((t: any) => t.title)
          .join(", ")}`;
      })
      .join(" | ") || "none"}`,
  );
  lines.push(
    `GOALS: ${(goals.data ?? [])
      .map((g: any) => `${g.name} (${g.category}, ${g.current_value}/${g.target_value ?? "?"} ${g.unit ?? ""}, ${g.status}, due ${g.deadline ?? "none"})`)
      .join("; ") || "none"}`,
  );
  lines.push(
    `UPCOMING EVENTS: ${(events.data ?? [])
      .filter((e: any) => e.date >= today)
      .slice(0, 12)
      .map((e: any) => `${e.date} ${e.title} (${e.type}${e.is_milestone ? ", MILESTONE" : ""})`)
      .join("; ") || "none"}`,
  );
  lines.push(
    `ACCOUNTS: ${(accounts.data ?? []).map((a: any) => `${a.name} $${a.balance}`).join(", ")}`,
  );
  lines.push(
    `RECENT SHIFTS: ${(shifts.data ?? []).slice(0, 10).map((s: any) => `${s.date}: ${s.hours}h $${s.earnings}`).join("; ") || "none"}`,
  );
  lines.push(
    `RECENT SPENDING: ${(txns.data ?? []).slice(0, 8).map((t: any) => `${t.date} ${t.kind} $${t.amount} ${t.category ?? ""}`).join("; ") || "none"}`,
  );
  lines.push(
    `RECENT DAILY LOGS: ${(daily.data ?? []).slice(0, 10).map((d: any) => `${d.date} vapeFree=${d.vape_free} exercise=${d.exercise_minutes}min`).join("; ") || "none"}`,
  );
  lines.push(
    `CLASSES: ${(classes.data ?? []).map((c: any) => `${c.name} (${c.meeting_times ?? "?"}, ${c.professor ?? "?"})`).join("; ") || "none"}`,
  );
  return lines.join("\n");
}

export const SYSTEM_PROMPT = `You are the assistant inside Logan Gilliland's personal Life OS.

Logan: Oregon State University, Forestry major, Delta Chi fraternity. Currently transitioning from summer into the school year.

Your tone: casual, direct, encouraging, a little funny, honest, never judgmental, always action-oriented. Swearing is fine. Never lecture.

Hard rules:
- NEVER invent numbers. Every statistic you state must come from the CURRENT STATE below or from a tool result.
- Weed is NOT something Logan is quitting. The only rule is that it's a nighttime thing — responsibilities first, chill at night. Never shame him about weed.
- Vaping IS being quit. Celebrate vape-free days; never suggest buying one.
- Keep daily priority lists short (3-6 items). If he's having a bad day, offer a "Minimum Viable Day": shower, eat, one useful task.
- The plan is never permanent. When he says something changed (trip moved, income target changed, school starts Monday, staying longer, hiking instead of gym), update the actual data with tools.
- Small obvious updates: just make them. Big changes (changing a goal target, deleting a habit or goal, moving a milestone): make the change but say clearly what you changed, and ask if he wants it reverted.
- A single message can contain several updates — process all of them with multiple tool calls.
- After tools run, reply in 1-4 short sentences summarizing what you recorded and what to do next. No bullet walls.
- Use adaptive planning: if he keeps failing a big task, suggest a smaller version. If he crushes a goal, suggest raising it. If a deadline is close, raise its priority.`;

type Ctx = { supabase: DB };

async function log(ctx: Ctx, summary: string, detail?: string) {
  await ctx.supabase.from("change_log").insert({ summary, detail: detail ?? null });
}

async function findHabit(ctx: Ctx, name: string) {
  const { data } = await ctx.supabase.from("habits").select("id,name");
  return (data ?? []).find((h: any) => h.name.toLowerCase().includes(name.toLowerCase()));
}

export const TOOLS = [
  {
    type: "function",
    function: {
      name: "add_task",
      description: "Add a task. Use date for a day-specific priority, or project_name to add a project step.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          date: { type: "string", description: "YYYY-MM-DD, omit for undated" },
          priority: { type: "number", description: "1 = key, 2 = normal, 3 = optional" },
          project_name: { type: "string" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "complete_task",
      description: "Mark a task complete by fuzzy title match.",
      parameters: {
        type: "object",
        properties: { title: { type: "string" }, done: { type: "boolean" } },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "log_habit",
      description: "Record a habit as done (or undone) for a date.",
      parameters: {
        type: "object",
        properties: {
          habit_name: { type: "string" },
          date: { type: "string" },
          completed: { type: "boolean" },
        },
        required: ["habit_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "manage_habit",
      description: "Create, pause, resume or delete a habit.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["create", "pause", "resume", "delete"] },
          habit_name: { type: "string" },
          category: { type: "string", enum: ["morning", "money", "fitness", "life", "vape", "night", "school"] },
          emoji: { type: "string" },
        },
        required: ["action", "habit_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "log_work_shift",
      description: "Record an Uber Eats shift (hours and/or earnings).",
      parameters: {
        type: "object",
        properties: {
          hours: { type: "number" },
          earnings: { type: "number" },
          date: { type: "string" },
          notes: { type: "string" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "log_transaction",
      description: "Record money spent or received outside of Uber Eats.",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number" },
          kind: { type: "string", enum: ["expense", "income", "savings"] },
          category: { type: "string" },
          date: { type: "string" },
        },
        required: ["amount", "kind"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_account_balance",
      description: "Set the balance of checking, savings or cash.",
      parameters: {
        type: "object",
        properties: { account_name: { type: "string" }, balance: { type: "number" } },
        required: ["account_name", "balance"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "manage_goal",
      description: "Create or update a goal: target, progress, deadline, status.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["create", "update", "delete"] },
          goal_name: { type: "string" },
          new_name: { type: "string" },
          category: { type: "string" },
          target_value: { type: "number" },
          current_value: { type: "number" },
          unit: { type: "string" },
          deadline: { type: "string" },
          status: { type: "string", enum: ["active", "paused", "completed"] },
          description: { type: "string" },
        },
        required: ["action", "goal_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "manage_event",
      description: "Create, move or delete a calendar event / deadline / milestone.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["create", "update", "delete"] },
          title: { type: "string" },
          date: { type: "string" },
          time: { type: "string" },
          type: { type: "string" },
          is_milestone: { type: "boolean" },
          notes: { type: "string" },
        },
        required: ["action", "title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "log_day",
      description: "Record daily outcomes: vape-free, exercise minutes, weed kept to night, notes.",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string" },
          vape_free: { type: "boolean" },
          weed_night_only: { type: "boolean" },
          exercise_minutes: { type: "number" },
          notes: { type: "string" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "manage_project",
      description: "Create a project or change its deadline/status.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["create", "update"] },
          name: { type: "string" },
          deadline: { type: "string" },
          status: { type: "string" },
          description: { type: "string" },
        },
        required: ["action", "name"],
      },
    },
  },
];

export async function runTool(ctx: Ctx, name: string, args: any): Promise<string> {
  const today = todayKey();
  const sb = ctx.supabase;

  switch (name) {
    case "add_task": {
      let projectId: string | null = null;
      if (args.project_name) {
        const { data } = await sb.from("projects").select("id,name");
        projectId =
          (data ?? []).find((p: any) =>
            p.name.toLowerCase().includes(String(args.project_name).toLowerCase()),
          )?.id ?? null;
      }
      await sb.from("tasks").insert({
        title: args.title,
        date: args.project_name ? null : (args.date ?? today),
        priority: args.priority ?? 2,
        project_id: projectId,
      });
      await log(ctx, `Task added: ${args.title}`);
      return `added task "${args.title}"`;
    }
    case "complete_task": {
      const { data } = await sb.from("tasks").select("id,title,done");
      const match = (data ?? []).find((t: any) =>
        t.title.toLowerCase().includes(String(args.title).toLowerCase()),
      );
      if (!match) return `no task matching "${args.title}"`;
      const done = args.done ?? true;
      await sb
        .from("tasks")
        .update({ done, done_at: done ? new Date().toISOString() : null })
        .eq("id", match.id);
      await log(ctx, `${done ? "Completed" : "Reopened"} task: ${match.title}`);
      return `${done ? "completed" : "reopened"} "${match.title}"`;
    }
    case "log_habit": {
      const habit = await findHabit(ctx, args.habit_name);
      if (!habit) return `no habit matching "${args.habit_name}"`;
      const date = args.date ?? today;
      if (args.completed === false) {
        await sb.from("habit_logs").delete().eq("habit_id", habit.id).eq("date", date);
      } else {
        await sb
          .from("habit_logs")
          .upsert({ habit_id: habit.id, date, completed: true }, { onConflict: "habit_id,date" });
      }
      await log(ctx, `Habit ${args.completed === false ? "cleared" : "logged"}: ${habit.name}`, date);
      return `logged habit "${habit.name}" for ${date}`;
    }
    case "manage_habit": {
      if (args.action === "create") {
        await sb.from("habits").insert({
          name: args.habit_name,
          category: args.category ?? "life",
          emoji: args.emoji ?? "✅",
        });
        await log(ctx, `Habit created: ${args.habit_name}`);
        return `created habit "${args.habit_name}"`;
      }
      const habit = await findHabit(ctx, args.habit_name);
      if (!habit) return `no habit matching "${args.habit_name}"`;
      if (args.action === "delete") {
        await sb.from("habits").delete().eq("id", habit.id);
        await log(ctx, `Habit deleted: ${habit.name}`);
        return `deleted habit "${habit.name}"`;
      }
      await sb.from("habits").update({ active: args.action === "resume" }).eq("id", habit.id);
      await log(ctx, `Habit ${args.action}d: ${habit.name}`);
      return `${args.action}d habit "${habit.name}"`;
    }
    case "log_work_shift": {
      await sb.from("work_shifts").insert({
        date: args.date ?? today,
        hours: args.hours ?? 0,
        earnings: args.earnings ?? 0,
        notes: args.notes ?? null,
      });
      await log(ctx, `Uber Eats shift: ${args.hours ?? 0}h, $${args.earnings ?? 0}`, args.date ?? today);
      return `recorded ${args.hours ?? 0}h / $${args.earnings ?? 0}`;
    }
    case "log_transaction": {
      await sb.from("transactions").insert({
        date: args.date ?? today,
        amount: args.amount,
        kind: args.kind,
        category: args.category ?? null,
      });
      await log(ctx, `${args.kind} recorded: $${args.amount} ${args.category ?? ""}`);
      return `recorded ${args.kind} $${args.amount}`;
    }
    case "set_account_balance": {
      const { data } = await sb.from("accounts").select("id,name");
      const acc = (data ?? []).find((a: any) =>
        a.name.toLowerCase().includes(String(args.account_name).toLowerCase()),
      );
      if (!acc) return `no account named "${args.account_name}"`;
      await sb.from("accounts").update({ balance: args.balance }).eq("id", acc.id);
      await log(ctx, `${acc.name} balance set to $${args.balance}`);
      return `${acc.name} = $${args.balance}`;
    }
    case "manage_goal": {
      if (args.action === "create") {
        await sb.from("goals").insert({
          name: args.goal_name,
          category: args.category ?? "personal",
          target_value: args.target_value ?? null,
          current_value: args.current_value ?? 0,
          unit: args.unit ?? null,
          deadline: args.deadline ?? null,
          description: args.description ?? null,
        });
        await log(ctx, `Goal created: ${args.goal_name}`);
        return `created goal "${args.goal_name}"`;
      }
      const { data } = await sb.from("goals").select("id,name,target_value");
      const goal = (data ?? []).find((g: any) =>
        g.name.toLowerCase().includes(String(args.goal_name).toLowerCase()),
      );
      if (!goal) return `no goal matching "${args.goal_name}"`;
      if (args.action === "delete") {
        await sb.from("goals").delete().eq("id", goal.id);
        await log(ctx, `Goal deleted: ${goal.name}`);
        return `deleted goal "${goal.name}"`;
      }
      const patch: any = {};
      for (const k of ["target_value", "current_value", "unit", "deadline", "status", "description", "category"]) {
        if (args[k] !== undefined) patch[k] = args[k];
      }
      if (args.new_name) patch.name = args.new_name;
      await sb.from("goals").update(patch).eq("id", goal.id);
      await log(
        ctx,
        `Goal updated: ${goal.name}`,
        Object.entries(patch).map(([k, v]) => `${k} → ${v}`).join(", "),
      );
      return `updated goal "${goal.name}" (${JSON.stringify(patch)})`;
    }
    case "manage_event": {
      if (args.action === "create") {
        await sb.from("events").insert({
          title: args.title,
          date: args.date ?? today,
          type: args.type ?? "personal",
          time: args.time ?? null,
          notes: args.notes ?? null,
          is_milestone: args.is_milestone ?? false,
        });
        await log(ctx, `Event added: ${args.title} (${args.date ?? today})`);
        return `added event "${args.title}"`;
      }
      const { data } = await sb.from("events").select("id,title,date");
      const ev = (data ?? []).find((e: any) =>
        e.title.toLowerCase().includes(String(args.title).toLowerCase()),
      );
      if (!ev) return `no event matching "${args.title}"`;
      if (args.action === "delete") {
        await sb.from("events").delete().eq("id", ev.id);
        await log(ctx, `Event deleted: ${ev.title}`);
        return `deleted "${ev.title}"`;
      }
      const patch: any = {};
      for (const k of ["date", "time", "type", "notes", "is_milestone"]) {
        if (args[k] !== undefined) patch[k] = args[k];
      }
      await sb.from("events").update(patch).eq("id", ev.id);
      await log(ctx, `Event moved: ${ev.title}`, `${ev.date} → ${args.date ?? ev.date}`);
      return `updated "${ev.title}"`;
    }
    case "log_day": {
      const date = args.date ?? today;
      const patch: any = { date };
      for (const k of ["vape_free", "weed_night_only", "exercise_minutes", "notes"]) {
        if (args[k] !== undefined) patch[k] = args[k];
      }
      await sb.from("daily_logs").upsert(patch, { onConflict: "user_id,date" });
      await log(ctx, `Day logged`, JSON.stringify(patch));
      return `logged day ${date}`;
    }
    case "manage_project": {
      if (args.action === "create") {
        await sb.from("projects").insert({
          name: args.name,
          deadline: args.deadline ?? null,
          description: args.description ?? null,
        });
        await log(ctx, `Project created: ${args.name}`);
        return `created project "${args.name}"`;
      }
      const { data } = await sb.from("projects").select("id,name");
      const proj = (data ?? []).find((p: any) =>
        p.name.toLowerCase().includes(String(args.name).toLowerCase()),
      );
      if (!proj) return `no project matching "${args.name}"`;
      const patch: any = {};
      for (const k of ["deadline", "status", "description"]) {
        if (args[k] !== undefined) patch[k] = args[k];
      }
      await sb.from("projects").update(patch).eq("id", proj.id);
      await log(ctx, `Project updated: ${proj.name}`, JSON.stringify(patch));
      return `updated project "${proj.name}"`;
    }
    default:
      return `unknown tool ${name}`;
  }
}

export async function chatWithTools(supabase: DB, userMessage: string) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured yet.");

  const { data: history } = await supabase
    .from("chat_messages")
    .select("role,content")
    .order("created_at", { ascending: false })
    .limit(16);

  const snapshot = await buildSnapshot(supabase);

  const messages: any[] = [
    { role: "system", content: `${SYSTEM_PROMPT}\n\nCURRENT STATE:\n${snapshot}` },
    ...(history ?? []).reverse().map((m: any) => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];

  await supabase.from("chat_messages").insert({ role: "user", content: userMessage });

  const actions: string[] = [];

  for (let i = 0; i < 5; i++) {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages,
        tools: TOOLS,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("Rate limited — give it a few seconds and try again.");
      if (res.status === 402)
        throw new Error("AI credits are used up. Add credits in Lovable to keep the assistant running.");
      throw new Error(`AI error (${res.status}): ${text.slice(0, 200)}`);
    }

    const json: any = await res.json();
    const msg = json.choices?.[0]?.message;
    if (!msg) throw new Error("Empty AI response");
    messages.push(msg);

    const calls = msg.tool_calls ?? [];
    if (!calls.length) {
      const content: string = msg.content ?? "Done.";
      await supabase.from("chat_messages").insert({ role: "assistant", content });
      return { reply: content, actions };
    }

    for (const call of calls) {
      let args: any = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        args = {};
      }
      const result = await runTool({ supabase }, call.function.name, args);
      actions.push(result);
      messages.push({ role: "tool", tool_call_id: call.id, content: result });
    }
  }

  const fallback = "Updated what I could. Ask me again if something looks off.";
  await supabase.from("chat_messages").insert({ role: "assistant", content: fallback });
  return { reply: fallback, actions };
}
