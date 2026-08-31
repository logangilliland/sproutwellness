import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send } from "lucide-react";
import { Panel } from "@/components/lifeos/Bits";
import { useRefreshLife } from "@/hooks/useLifeData";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { sendChatMessage } from "@/lib/aichat.functions";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const PROMPTS = [
  "I made $87 doing Uber Eats today over 4 hours.",
  "I didn't go to the gym but I went hiking for two hours.",
  "What should I do right now?",
];

export function ChatPanel() {
  const send = useServerFn(sendChatMessage);
  const refresh = useRefreshLife();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], refetch } = useQuery({
    queryKey: ["chat-messages"],
    queryFn: async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("id,role,content,created_at")
        .order("created_at")
        .limit(200);
      return data ?? [];
    },
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, busy]);

  async function submit(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    setInput("");
    setBusy(true);
    try {
      await send({
        data: {
          message,
          localDate: todayKey(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });

      await refetch();
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel
      title="AI Assistant"
      className="flex flex-col"
    >
      <p className="-mt-1 mb-3 text-xs text-muted-foreground">
        Tell it what happened — it updates your points, money, goals and calendar.
      </p>
      <div className="max-h-80 flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Try one of these:</p>
            {PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => submit(p)}
                className="block w-full rounded-lg border border-border bg-surface/40 px-3 py-2 text-left text-foreground hover:border-primary/50"
              >
                {p}
              </button>
            ))}
          </div>
        )}
        {messages.slice(-50).map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary/15 px-3 py-2 text-sm"
                : "mr-auto max-w-[85%] rounded-2xl rounded-bl-sm border border-border bg-surface/60 px-3 py-2 text-sm"
            }
          >
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="mr-auto rounded-2xl border border-border bg-surface/60 px-3 py-2 text-sm text-muted-foreground">
            thinking…
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        className="mt-3 flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
      >
        <Textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit(input);
            }
          }}
          placeholder="What happened today?"
          className="min-h-11 resize-none"
        />
        <Button type="submit" disabled={busy} size="icon" aria-label="Send">
          <Send className="size-4" />
        </Button>
      </form>
    </Panel>
  );
}
