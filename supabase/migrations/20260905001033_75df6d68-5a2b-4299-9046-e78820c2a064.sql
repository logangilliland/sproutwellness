ALTER TABLE public.canvas_connections ADD COLUMN IF NOT EXISTS oauth_state TEXT;
CREATE INDEX IF NOT EXISTS canvas_state_idx ON public.canvas_connections (oauth_state);