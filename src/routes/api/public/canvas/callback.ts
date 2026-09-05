import { createFileRoute } from "@tanstack/react-router";

/** Canvas OAuth2 redirect target. The user is identified by the one-time `state` we stored. */
export const Route = createFileRoute("/api/public/canvas/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const error = url.searchParams.get("error");
        const back = `${url.origin}/school`;

        if (!state) return Response.redirect(`${back}?canvas=badstate`, 302);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: conn } = await supabaseAdmin
          .from("canvas_connections")
          .select("user_id, base_url")
          .eq("oauth_state", state)
          .maybeSingle();
        if (!conn) return Response.redirect(`${back}?canvas=badstate`, 302);

        if (error || !code) {
          await supabaseAdmin
            .from("canvas_connections")
            .update({ status: "error", last_error: error ?? "No authorization code returned." })
            .eq("user_id", conn.user_id);
          return Response.redirect(`${back}?canvas=denied`, 302);
        }

        try {
          const { canvasConfig, exchangeCode } = await import("@/lib/canvas.server");
          const cfg = canvasConfig();
          if (!cfg) throw new Error("Canvas is not configured.");
          const token = await exchangeCode(cfg, code, `${url.origin}/api/public/canvas/callback`);
          await supabaseAdmin
            .from("canvas_connections")
            .update({
              access_token: token.access_token,
              refresh_token: token.refresh_token ?? null,
              expires_at: token.expires_in
                ? new Date(Date.now() + token.expires_in * 1000).toISOString()
                : null,
              canvas_user_id: token.user?.id ? String(token.user.id) : null,
              canvas_user_name: token.user?.name ?? null,
              status: "connected",
              oauth_state: null,
              last_error: null,
            })
            .eq("user_id", conn.user_id);
        } catch (e) {
          await supabaseAdmin
            .from("canvas_connections")
            .update({
              status: "error",
              last_error: e instanceof Error ? e.message : String(e),
              oauth_state: null,
            })
            .eq("user_id", conn.user_id);
          return Response.redirect(`${back}?canvas=failed`, 302);
        }

        return Response.redirect(`${back}?canvas=connected`, 302);
      },
    },
  },
});
