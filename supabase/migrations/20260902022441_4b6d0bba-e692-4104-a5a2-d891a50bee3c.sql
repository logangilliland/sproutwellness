CREATE TABLE IF NOT EXISTS public.garden_plants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users ON DELETE CASCADE,
  date DATE NOT NULL,
  species_key TEXT NOT NULL,
  rarity TEXT NOT NULL,
  stage INT NOT NULL DEFAULT 1,
  overall_pct INT NOT NULL DEFAULT 0,
  perfect BOOLEAN NOT NULL DEFAULT false,
  favorite BOOLEAN NOT NULL DEFAULT false,
  locked BOOLEAN NOT NULL DEFAULT false,
  breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.garden_plants TO authenticated;
GRANT ALL ON public.garden_plants TO service_role;

ALTER TABLE public.garden_plants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own garden plants" ON public.garden_plants;
CREATE POLICY "Users manage their own garden plants"
ON public.garden_plants FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);