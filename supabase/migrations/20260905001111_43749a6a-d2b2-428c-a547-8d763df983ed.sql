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
  DELETE FROM public.assignment_steps WHERE user_id = uid;
  DELETE FROM public.assignments WHERE user_id = uid;
  DELETE FROM public.school_todos WHERE user_id = uid;
  DELETE FROM public.classes WHERE user_id = uid;
  DELETE FROM public.school_terms WHERE user_id = uid;
  DELETE FROM public.canvas_connections WHERE user_id = uid;
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