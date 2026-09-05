import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Is the Canvas developer key configured for this deployment? */
export const canvasConfigured = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { canvasConfig } = await import("@/lib/canvas.server");
    const cfg = canvasConfig();
    return { configured: !!cfg, baseUrl: cfg?.baseUrl ?? null };
  });

/** Begin the official Canvas OAuth2 flow and return the URL to send the user to. */
export const startCanvasAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ origin: z.string().url() }).parse(d))
  .handler(async ({ data, context }) => {
    const { canvasConfig, authorizeUrl } = await import("@/lib/canvas.server");
    const cfg = canvasConfig();
    if (!cfg)
      throw new Error(
        "Canvas isn't configured yet. A Canvas developer key (client ID, secret and school Canvas URL) still needs to be added.",
      );
    const state = crypto.randomUUID();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("canvas_connections").upsert(
      {
        user_id: context.userId,
        base_url: cfg.baseUrl,
        oauth_state: state,
        status: "pending",
        last_error: null,
      },
      { onConflict: "user_id" },
    );
    const redirectUri = `${data.origin.replace(/\/+$/, "")}/api/public/canvas/callback`;
    return { url: authorizeUrl(cfg, redirectUri, state) };
  });

/** Pull courses + assignments from Canvas into Life OS. */
export const syncCanvasNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { syncCanvas } = await import("@/lib/canvas.server");
    return await syncCanvas(supabaseAdmin, context.userId);
  });

export const disconnectCanvas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("canvas_connections").delete().eq("user_id", context.userId);
    return { ok: true };
  });
