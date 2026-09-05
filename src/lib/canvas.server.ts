/** Canvas LMS OAuth2 + REST sync. Official API only — no scraping, no passwords. */

import type { SupabaseClient } from "@supabase/supabase-js";

/* eslint-disable @typescript-eslint/no-explicit-any */
type DB = SupabaseClient<any, any, any>;

export type CanvasConfig = { clientId: string; clientSecret: string; baseUrl: string };

export function canvasConfig(): CanvasConfig | null {
  const clientId = process.env["CANVAS_CLIENT_ID"];
  const clientSecret = process.env["CANVAS_CLIENT_SECRET"];
  const baseUrl = process.env["CANVAS_BASE_URL"];
  if (!clientId || !clientSecret || !baseUrl) return null;
  return { clientId, clientSecret, baseUrl: baseUrl.replace(/\/+$/, "") };
}

export function authorizeUrl(cfg: CanvasConfig, redirectUri: string, state: string) {
  const u = new URL(`${cfg.baseUrl}/login/oauth2/auth`);
  u.searchParams.set("client_id", cfg.clientId);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("state", state);
  u.searchParams.set("scope", "url:GET|/api/v1/courses url:GET|/api/v1/users/self");
  return u.toString();
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  user?: { id?: number; name?: string };
};

export async function exchangeCode(cfg: CanvasConfig, code: string, redirectUri: string) {
  const res = await fetch(`${cfg.baseUrl}/login/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      redirect_uri: redirectUri,
      code,
    }),
  });
  if (!res.ok) throw new Error(`Canvas token exchange failed [${res.status}]: ${await res.text()}`);
  return (await res.json()) as TokenResponse;
}

export async function refreshToken(cfg: CanvasConfig, refresh: string) {
  const res = await fetch(`${cfg.baseUrl}/login/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      refresh_token: refresh,
    }),
  });
  if (!res.ok) throw new Error(`Canvas token refresh failed [${res.status}]`);
  return (await res.json()) as TokenResponse;
}

async function canvasGet<T>(baseUrl: string, token: string, path: string): Promise<T> {
  const res = await fetch(`${baseUrl}/api/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Canvas ${path} failed [${res.status}]: ${await res.text()}`);
  return (await res.json()) as T;
}

function sizeFor(points: number | null, name: string): "small" | "medium" | "large" | "major" {
  const n = name.toLowerCase();
  if (/(final|research paper|term project|capstone)/.test(n)) return "major";
  if (/(paper|report|project|essay|presentation)/.test(n)) return "large";
  if (/(quiz|discussion|reading|post)/.test(n)) return "small";
  if (points != null && points >= 100) return "large";
  if (points != null && points <= 10) return "small";
  return "medium";
}

/** Pull courses + assignments and merge them into Life OS without creating duplicates. */
export async function syncCanvas(supabase: DB, userId: string) {
  const { data: conn } = await supabase
    .from("canvas_connections")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (!conn) throw new Error("Canvas is not connected.");

  const cfg = canvasConfig();
  let token: string = conn.access_token;
  if (cfg && conn.expires_at && new Date(conn.expires_at).getTime() < Date.now() + 60_000) {
    if (!conn.refresh_token) throw new Error("Canvas session expired — reconnect Canvas.");
    const t = await refreshToken(cfg, conn.refresh_token);
    token = t.access_token;
    await supabase
      .from("canvas_connections")
      .update({
        access_token: t.access_token,
        expires_at: t.expires_in
          ? new Date(Date.now() + t.expires_in * 1000).toISOString()
          : null,
      })
      .eq("user_id", userId);
  }

  const baseUrl: string = conn.base_url;
  try {
    const courses = await canvasGet<any[]>(
      baseUrl,
      token,
      "/courses?enrollment_state=active&per_page=50",
    );

    // Terms: use the active one if the user has any on file.
    const { data: terms } = await supabase.from("school_terms").select("*").eq("user_id", userId);
    const today = new Date().toISOString().slice(0, 10);
    const term = (terms ?? []).find((t: any) => t.starts_on <= today && today <= t.ends_on) ?? null;

    const classIdByCourse = new Map<string, string>();
    for (const c of courses) {
      const canvasCourseId = String(c.id);
      const { data: existing } = await supabase
        .from("classes")
        .select("id")
        .eq("user_id", userId)
        .eq("canvas_course_id", canvasCourseId)
        .maybeSingle();
      if (existing) {
        classIdByCourse.set(canvasCourseId, existing.id);
        await supabase
          .from("classes")
          .update({ name: c.name, class_code: c.course_code ?? null })
          .eq("id", existing.id);
      } else {
        const { data: made } = await supabase
          .from("classes")
          .insert({
            user_id: userId,
            name: c.name,
            class_code: c.course_code ?? null,
            canvas_course_id: canvasCourseId,
            term_id: term?.id ?? null,
          })
          .select("id")
          .maybeSingle();
        if (made) classIdByCourse.set(canvasCourseId, made.id);
      }
    }

    let imported = 0;
    let updated = 0;
    for (const c of courses) {
      const canvasCourseId = String(c.id);
      const assignments = await canvasGet<any[]>(
        baseUrl,
        token,
        `/courses/${c.id}/assignments?per_page=100&include[]=submission`,
      );
      for (const a of assignments) {
        const canvasId = `${c.id}:${a.id}`;
        const due = a.due_at ? String(a.due_at).slice(0, 10) : null;
        const submitted =
          a.submission?.workflow_state === "graded" ||
          a.submission?.workflow_state === "submitted" ||
          a.has_submitted_submissions === true;
        const size = sizeFor(a.points_possible ?? null, String(a.name ?? ""));
        const row = {
          user_id: userId,
          class_id: classIdByCourse.get(canvasCourseId) ?? null,
          term_id: term?.id ?? null,
          canvas_id: canvasId,
          canvas_url: a.html_url ?? null,
          title: a.name ?? "Canvas assignment",
          description: (a.description ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || null,
          due_date: due,
          source: "canvas",
          size,
          is_large: size === "large" || size === "major",
        };
        const { data: existing } = await supabase
          .from("assignments")
          .select("id,status,completed_on")
          .eq("user_id", userId)
          .eq("canvas_id", canvasId)
          .maybeSingle();
        if (existing) {
          await supabase
            .from("assignments")
            .update({
              ...row,
              // Canvas owns the due date + submission state; everything else stays user-owned.
              status: submitted ? "done" : existing.status,
              completed_on: submitted ? (existing.completed_on ?? today) : existing.completed_on,
            })
            .eq("id", existing.id);
          updated++;
        } else {
          await supabase.from("assignments").insert({
            ...row,
            status: submitted ? "done" : "todo",
            completed_on: submitted ? today : null,
          });
          imported++;
        }
      }
    }

    await supabase
      .from("canvas_connections")
      .update({ last_sync_at: new Date().toISOString(), last_error: null, status: "connected" })
      .eq("user_id", userId);
    return { imported, updated, courses: courses.length };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    // A failed sync never destroys existing schoolwork.
    await supabase
      .from("canvas_connections")
      .update({ last_error: message, status: "error" })
      .eq("user_id", userId);
    throw e;
  }
}
