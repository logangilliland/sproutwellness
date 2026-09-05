
CREATE TABLE public.school_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_terms TO authenticated;
GRANT ALL ON public.school_terms TO service_role;
ALTER TABLE public.school_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own terms" ON public.school_terms FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS class_code TEXT,
  ADD COLUMN IF NOT EXISTS term_id UUID REFERENCES public.school_terms(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS canvas_course_id TEXT,
  ADD COLUMN IF NOT EXISTS color TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS classes_canvas_unique ON public.classes (user_id, canvas_course_id) WHERE canvas_course_id IS NOT NULL;

CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  term_id UUID REFERENCES public.school_terms(id) ON DELETE SET NULL,
  canvas_id TEXT,
  canvas_url TEXT,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  due_time TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'todo',
  completed_on DATE,
  important BOOLEAN NOT NULL DEFAULT false,
  size TEXT NOT NULL DEFAULT 'medium',
  estimated_minutes INTEGER,
  points INTEGER NOT NULL DEFAULT 10,
  is_large BOOLEAN NOT NULL DEFAULT false,
  progress INTEGER NOT NULL DEFAULT 0,
  first_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments TO authenticated;
GRANT ALL ON public.assignments TO service_role;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own assignments" ON public.assignments FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE UNIQUE INDEX assignments_canvas_unique ON public.assignments (user_id, canvas_id) WHERE canvas_id IS NOT NULL;
CREATE INDEX assignments_due_idx ON public.assignments (user_id, due_date);

CREATE TABLE public.assignment_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignment_steps TO authenticated;
GRANT ALL ON public.assignment_steps TO service_role;
ALTER TABLE public.assignment_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own steps" ON public.assignment_steps FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.school_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  notes TEXT,
  due_date DATE,
  done BOOLEAN NOT NULL DEFAULT false,
  required BOOLEAN NOT NULL DEFAULT false,
  points INTEGER NOT NULL DEFAULT 5,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_todos TO authenticated;
GRANT ALL ON public.school_todos TO service_role;
ALTER TABLE public.school_todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own school todos" ON public.school_todos FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.canvas_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE DEFAULT auth.uid() REFERENCES auth.users ON DELETE CASCADE,
  base_url TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  canvas_user_id TEXT,
  canvas_user_name TEXT,
  status TEXT NOT NULL DEFAULT 'connected',
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.canvas_connections TO service_role;
ALTER TABLE public.canvas_connections ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE VIEW public.canvas_status
WITH (security_invoker = true) AS
SELECT user_id, base_url, canvas_user_name, status, last_sync_at, last_error, created_at
FROM public.canvas_connections
WHERE user_id = auth.uid();
GRANT SELECT ON public.canvas_status TO authenticated;
CREATE POLICY "read own canvas status" ON public.canvas_connections FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "delete own canvas connection" ON public.canvas_connections FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER assignments_updated_at BEFORE UPDATE ON public.assignments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
