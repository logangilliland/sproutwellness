import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type {
  Assignment,
  AssignmentStep,
  SchoolClass,
  SchoolTerm,
  SchoolTodo,
} from "@/lib/school";
import { ensureDefaultTerms } from "@/lib/school.mutations";

export type CanvasStatus = {
  base_url: string;
  canvas_user_name: string | null;
  status: string;
  last_sync_at: string | null;
  last_error: string | null;
} | null;

export type SchoolData = {
  terms: SchoolTerm[];
  classes: SchoolClass[];
  assignments: Assignment[];
  steps: AssignmentStep[];
  todos: SchoolTodo[];
  canvas: CanvasStatus;
};

async function fetchSchool(): Promise<SchoolData> {
  const [terms, classes, assignments, steps, todos, canvas] = await Promise.all([
    supabase.from("school_terms").select("*").order("starts_on"),
    supabase.from("classes").select("*").order("name"),
    supabase.from("assignments").select("*").order("due_date", { nullsFirst: false }),
    supabase.from("assignment_steps").select("*").order("sort_order"),
    supabase.from("school_todos").select("*").order("sort_order"),
    supabase.from("canvas_status").select("*").maybeSingle(),
  ]);

  if (!(terms.data ?? []).length) {
    await ensureDefaultTerms(0);
    const again = await supabase.from("school_terms").select("*").order("starts_on");
    terms.data = again.data;
  }

  return {
    terms: (terms.data ?? []) as SchoolTerm[],
    classes: (classes.data ?? []) as unknown as SchoolClass[],
    assignments: ((assignments.data ?? []) as unknown as Assignment[]).map((a) => ({
      ...a,
      first_steps: Array.isArray(a.first_steps) ? a.first_steps : [],
    })),
    steps: (steps.data ?? []) as AssignmentStep[],
    todos: (todos.data ?? []) as SchoolTodo[],
    canvas: (canvas.data ?? null) as CanvasStatus,
  };
}

export function useSchool(enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["school", user?.id],
    queryFn: fetchSchool,
    enabled: !!user && enabled,
    staleTime: 5_000,
  });
}

export function useRefreshSchool() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ["school"] });
    void qc.invalidateQueries({ queryKey: ["life"] });
  };
}
