-- profiles: per-user name + onboarding state
ALTER TABLE public.profiles ALTER COLUMN display_name DROP DEFAULT;
ALTER TABLE public.profiles ALTER COLUMN display_name DROP NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarded boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- generic jobs
CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  employer text,
  position text,
  pay_rate numeric NOT NULL DEFAULT 0,
  pay_type text NOT NULL DEFAULT 'hourly',
  typical_hours numeric,
  location text,
  start_date date,
  status text NOT NULL DEFAULT 'active',
  is_primary boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own jobs" ON public.jobs;
CREATE POLICY "own jobs" ON public.jobs FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS jobs_updated_at ON public.jobs;
CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- link shifts to a job, preserving history when a job is archived
ALTER TABLE public.work_shifts ADD COLUMN IF NOT EXISTS job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL;
ALTER TABLE public.work_shifts ADD COLUMN IF NOT EXISTS job_name text;

-- no more hardcoded personal seed data
DROP FUNCTION IF EXISTS public.seed_life_os();

-- let a user wipe their own Sprout data and redo onboarding
CREATE OR REPLACE FUNCTION public.reset_sprout()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  DELETE FROM public.habit_logs WHERE user_id = uid;
  DELETE FROM public.habits WHERE user_id = uid;
  DELETE FROM public.tasks WHERE user_id = uid;
  DELETE FROM public.projects WHERE user_id = uid;
  DELETE FROM public.goals WHERE user_id = uid;
  DELETE FROM public.events WHERE user_id = uid;
  DELETE FROM public.classes WHERE user_id = uid;
  DELETE FROM public.accounts WHERE user_id = uid;
  DELETE FROM public.transactions WHERE user_id = uid;
  DELETE FROM public.work_shifts WHERE user_id = uid;
  DELETE FROM public.jobs WHERE user_id = uid;
  DELETE FROM public.daily_logs WHERE user_id = uid;
  DELETE FROM public.point_activities WHERE user_id = uid;
  DELETE FROM public.point_suggestions WHERE user_id = uid;
  DELETE FROM public.point_categories WHERE user_id = uid;
  DELETE FROM public.day_scores WHERE user_id = uid;
  DELETE FROM public.garden_plants WHERE user_id = uid;
  DELETE FROM public.chat_messages WHERE user_id = uid;
  DELETE FROM public.change_log WHERE user_id = uid;

  UPDATE public.profiles
     SET onboarded = false, seeded = false, display_name = NULL, settings = '{}'::jsonb
   WHERE id = uid;
END;
$$;

REVOKE ALL ON FUNCTION public.reset_sprout() FROM public;
GRANT EXECUTE ON FUNCTION public.reset_sprout() TO authenticated;