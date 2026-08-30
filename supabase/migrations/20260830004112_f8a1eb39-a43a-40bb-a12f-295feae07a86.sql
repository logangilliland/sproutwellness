CREATE TABLE public.point_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  key text NOT NULL,
  label text NOT NULL,
  emoji text NOT NULL DEFAULT '⭐',
  daily_target integer NOT NULL DEFAULT 25,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.point_categories TO authenticated;
GRANT ALL ON public.point_categories TO service_role;
ALTER TABLE public.point_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own point categories" ON public.point_categories FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.point_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.point_categories(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  title text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  reason text,
  source text NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.point_activities TO authenticated;
GRANT ALL ON public.point_activities TO service_role;
ALTER TABLE public.point_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own point activities" ON public.point_activities FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX point_activities_user_date_idx ON public.point_activities (user_id, date);

CREATE TABLE public.point_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.point_categories(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  title text NOT NULL,
  points integer NOT NULL DEFAULT 15,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.point_suggestions TO authenticated;
GRANT ALL ON public.point_suggestions TO service_role;
ALTER TABLE public.point_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own point suggestions" ON public.point_suggestions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX point_suggestions_user_date_idx ON public.point_suggestions (user_id, date);

CREATE TABLE public.day_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  overall_pct integer NOT NULL DEFAULT 0,
  breakdown jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.day_scores TO authenticated;
GRANT ALL ON public.day_scores TO service_role;
ALTER TABLE public.day_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own day scores" ON public.day_scores FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

INSERT INTO public.point_categories (user_id, key, label, emoji, sort_order)
SELECT p.id, c.key, c.label, c.emoji, c.sort_order
FROM public.profiles p
CROSS JOIN (VALUES
  ('fitness','Fitness','🏃',1),
  ('health','Health','❤️',2),
  ('work','Work','💰',3),
  ('projects','Projects','📁',4)
) AS c(key,label,emoji,sort_order)
ON CONFLICT (user_id, key) DO NOTHING;