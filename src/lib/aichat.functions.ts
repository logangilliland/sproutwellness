import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { chatWithTools } from "./aichat.server";

export const sendChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ message: z.string().min(1).max(4000) }).parse(data))
  .handler(async ({ data, context }) => {
    return await chatWithTools(context.supabase, data.message);
  });
