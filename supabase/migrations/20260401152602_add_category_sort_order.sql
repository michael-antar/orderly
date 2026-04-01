-- Add sort_order column to category_definitions for user-customizable ordering
ALTER TABLE public.category_definitions
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Backfill existing rows: assign sort_order based on created_at order per user
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) - 1 AS rn
  FROM public.category_definitions
)
UPDATE public.category_definitions cd
SET sort_order = ranked.rn
FROM ranked
WHERE cd.id = ranked.id;