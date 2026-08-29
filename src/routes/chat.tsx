import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Panel } from "@/components/lifeos/Bits";
import { useLifeData, useRefreshLife } from "@/hooks/useLifeData";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { sendChatMessage } from "@/lib/aichat.functions";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Assistant — Logan's Life OS" },
      {
        name: "description",
        content:
          "Talk to the assistant that reads and updates your habits, tasks, money, goals, projects and calendar in plain language.",
      },
      { property: "og:title", content: "AI Assistant — Logan's Life OS" },
      {
        property: "og:description",
        content: "Dump your day into chat and the system updates itself.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <Chat />
    </AppShell>
  ),
});

const PROMPTS = [
  "I made $87 doing Uber Eats today over 4 hours.",
  "Today sucked. Didn't work or exercise, but I cleaned my room, did laundry and didn't vape.",
  "Move my trip to September 8.",
  "Change my weekly Uber Eats goal to $400.",
  "What should I do right now?",
];

function Chat() {
  const send = useServerFn(sendChatMessage);
  const refresh = useRefreshLife();
  useLifeData();
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
      await send({ data: { message } });
      await refetch();
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">AI Assistant</h1>
        <p className="text-sm text-muted-foreground">
          Tell it what happened. It updates the actual system — tasks, habits, money, goals, calendar.
        </p>
      </div>

      <Panel className="flex h-[62vh] flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
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
          {messages.map((m) => (
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
    </div>
  );
}
