DELETE FROM public.point_suggestions a
USING public.point_suggestions b
WHERE a.ctid > b.ctid
  AND a.user_id = b.user_id AND a.date = b.date
  AND a.category_id = b.category_id AND a.title = b.title;

DELETE FROM public.point_categories a
USING public.point_categories b
WHERE a.ctid > b.ctid AND a.user_id = b.user_id AND a.key = b.key;

CREATE UNIQUE INDEX IF NOT EXISTS point_suggestions_unique_day
  ON public.point_suggestions (user_id, date, category_id, title);
CREATE UNIQUE INDEX IF NOT EXISTS point_categories_unique_key
  ON public.point_categories (user_id, key);