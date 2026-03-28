-- =============================================================================
-- EXISTING OBJECTS — Functions, RLS Policies, and Indexes
-- Pulled from the live Supabase DB to have full DB context in the repo.
-- All use CREATE OR REPLACE / IF NOT EXISTS so this is safe to apply.
-- =============================================================================


-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Helper used by item_tags RLS policy to verify item ownership
CREATE OR REPLACE FUNCTION public.get_user_id_from_item(item_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT user_id FROM public.items WHERE id = item_id;
$$;


-- Glicko-1 comparison handler — called from ComparisonModal.tsx
CREATE OR REPLACE FUNCTION public.handle_comparison(p_winner_id uuid, p_loser_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  winner_item public.items;
  loser_item public.items;

  -- Glicko-1 constants
  q double precision := ln(10.0) / 400.0;  -- ~0.00575646
  c_decay double precision;                 -- RD time-decay constant
  rating_period_days int := 1;              -- 1 rating period = 1 day
  max_rd double precision := 350.0;
  min_rd double precision := 30.0;
  periods_to_max int := 90;                 -- Days of inactivity to return to max RD

  -- Per-item working variables
  winner_rd double precision;
  loser_rd double precision;
  g_winner double precision;
  g_loser double precision;
  e_winner double precision;
  e_loser double precision;
  d2_winner double precision;
  d2_loser double precision;
  new_rating_winner double precision;
  new_rating_loser double precision;
  new_rd_winner double precision;
  new_rd_loser double precision;
  elapsed_winner double precision;
  elapsed_loser double precision;
BEGIN
  -- 1. Fetch both items
  SELECT * INTO winner_item FROM public.items WHERE id = p_winner_id;
  SELECT * INTO loser_item FROM public.items WHERE id = p_loser_id;

  IF winner_item.status != 'ranked' OR loser_item.status != 'ranked' THEN
    RAISE EXCEPTION 'Both items must be in "ranked" status to be compared.';
  END IF;

  -- 2. Compute RD time-decay constant: c = sqrt((max_rd^2 - min_rd^2) / periods_to_max)
  c_decay := sqrt((max_rd * max_rd - min_rd * min_rd) / periods_to_max);

  -- 3. Apply RD time decay based on time since last comparison
  elapsed_winner := EXTRACT(EPOCH FROM (now() - COALESCE(winner_item.last_compared_at, winner_item.created_at))) / (86400.0 * rating_period_days);
  elapsed_loser  := EXTRACT(EPOCH FROM (now() - COALESCE(loser_item.last_compared_at, loser_item.created_at))) / (86400.0 * rating_period_days);

  winner_rd := LEAST(sqrt(winner_item.rd * winner_item.rd + c_decay * c_decay * elapsed_winner), max_rd);
  loser_rd  := LEAST(sqrt(loser_item.rd * loser_item.rd + c_decay * c_decay * elapsed_loser), max_rd);

  -- 4. Glicko-1 g(RD) function for each opponent
  g_loser  := 1.0 / sqrt(1.0 + 3.0 * q * q * loser_rd * loser_rd / (pi() * pi()));
  g_winner := 1.0 / sqrt(1.0 + 3.0 * q * q * winner_rd * winner_rd / (pi() * pi()));

  -- 5. Expected scores E
  e_winner := 1.0 / (1.0 + pow(10.0, -g_loser * (winner_item.rating - loser_item.rating) / 400.0));
  e_loser  := 1.0 / (1.0 + pow(10.0, -g_winner * (loser_item.rating - winner_item.rating) / 400.0));

  -- 6. d^2 (pre-update rating deviation factor)
  d2_winner := 1.0 / (q * q * g_loser * g_loser * e_winner * (1.0 - e_winner));
  d2_loser  := 1.0 / (q * q * g_winner * g_winner * e_loser * (1.0 - e_loser));

  -- 7. New ratings
  new_rating_winner := winner_item.rating + (q / (1.0 / (winner_rd * winner_rd) + 1.0 / d2_winner)) * g_loser * (1.0 - e_winner);
  new_rating_loser  := loser_item.rating  + (q / (1.0 / (loser_rd * loser_rd) + 1.0 / d2_loser)) * g_winner * (0.0 - e_loser);

  -- 8. New RDs, clamped to [min_rd, max_rd]
  new_rd_winner := GREATEST(min_rd, sqrt(1.0 / (1.0 / (winner_rd * winner_rd) + 1.0 / d2_winner)));
  new_rd_loser  := GREATEST(min_rd, sqrt(1.0 / (1.0 / (loser_rd * loser_rd) + 1.0 / d2_loser)));

  -- 9. Update items
  UPDATE public.items
  SET rating = round(new_rating_winner),
      rd = new_rd_winner,
      comparison_count = comparison_count + 1,
      last_compared_at = now()
  WHERE id = p_winner_id;

  UPDATE public.items
  SET rating = round(new_rating_loser),
      rd = new_rd_loser,
      comparison_count = comparison_count + 1,
      last_compared_at = now()
  WHERE id = p_loser_id;

  -- 10. Log the comparison
  INSERT INTO public.comparisons (
    user_id, winner_id, loser_id,
    winner_rating_before, winner_rating_after,
    loser_rating_before, loser_rating_after,
    winner_rd_before, winner_rd_after,
    loser_rd_before, loser_rd_after
  ) VALUES (
    winner_item.user_id, p_winner_id, p_loser_id,
    winner_item.rating, round(new_rating_winner),
    loser_item.rating, round(new_rating_loser),
    winner_item.rd, new_rd_winner,
    loser_item.rd, new_rd_loser
  );
END;
$function$;


-- Seeds default categories for new users — called from categoryUtils.ts
CREATE OR REPLACE FUNCTION public.seed_user_categories()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();

  -- If user already has categories, do nothing
  IF EXISTS (SELECT 1 FROM category_definitions WHERE user_id = v_user_id) THEN
    RETURN;
  END IF;

  -- Copy global template categories (user_id IS NULL) to the new user
  INSERT INTO category_definitions (user_id, name, icon, field_definitions)
  SELECT
    v_user_id,
    name,
    icon,
    field_definitions
  FROM category_definitions
  WHERE user_id IS NULL;
END;
$function$;


-- Legacy function — references the old item_category enum.
-- This will be dropped in the next migration.
CREATE OR REPLACE FUNCTION public.get_tags_with_usage(p_category item_category)
RETURNS TABLE(id bigint, user_id uuid, name text, category item_category, is_used boolean)
LANGUAGE plpgsql
STABLE
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.user_id,
        t.name,
        t.category,
        COUNT(it.tag_id) > 0 AS is_used
    FROM public.tags AS t
    LEFT JOIN public.item_tags AS it ON t.id = it.tag_id
    WHERE t.user_id = auth.uid() AND t.category = p_category
    GROUP BY t.id
    ORDER BY t.name;
END;
$function$;


-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- category_definitions --
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public categories are viewable by everyone' AND tablename = 'category_definitions') THEN
    CREATE POLICY "Public categories are viewable by everyone"
      ON public.category_definitions FOR SELECT
      USING (user_id IS NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own categories' AND tablename = 'category_definitions') THEN
    CREATE POLICY "Users can view their own categories"
      ON public.category_definitions FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own categories' AND tablename = 'category_definitions') THEN
    CREATE POLICY "Users can insert their own categories"
      ON public.category_definitions FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own categories' AND tablename = 'category_definitions') THEN
    CREATE POLICY "Users can update their own categories"
      ON public.category_definitions FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own categories' AND tablename = 'category_definitions') THEN
    CREATE POLICY "Users can delete their own categories"
      ON public.category_definitions FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- comparisons --
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own comparisons' AND tablename = 'comparisons') THEN
    CREATE POLICY "Users can manage their own comparisons"
      ON public.comparisons FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- items --
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own items' AND tablename = 'items') THEN
    CREATE POLICY "Users can manage their own items"
      ON public.items FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- tags --
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own tags' AND tablename = 'tags') THEN
    CREATE POLICY "Users can manage their own tags"
      ON public.tags FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- item_tags --
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage tags on their own items' AND tablename = 'item_tags') THEN
    CREATE POLICY "Users can manage tags on their own items"
      ON public.item_tags FOR ALL
      USING (auth.uid() = get_user_id_from_item(item_id));
  END IF;
END $$;


-- ============================================================================
-- INDEXES (non-primary-key, since PKs are created by the initial schema)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_comparisons_user_id    ON public.comparisons USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_item_tags_item_id      ON public.item_tags USING btree (item_id);
CREATE INDEX IF NOT EXISTS idx_item_tags_tag_id       ON public.item_tags USING btree (tag_id);
CREATE INDEX IF NOT EXISTS idx_items_category_def_id  ON public.items USING btree (category_def_id);
CREATE INDEX IF NOT EXISTS idx_items_properties       ON public.items USING gin (properties);
CREATE INDEX IF NOT EXISTS idx_items_user_id          ON public.items USING btree (user_id);
CREATE INDEX IF NOT EXISTS items_created_at_idx       ON public.items USING btree (created_at);
CREATE INDEX IF NOT EXISTS items_name_idx             ON public.items USING btree (name);
CREATE INDEX IF NOT EXISTS items_rating_idx           ON public.items USING btree (rating);
CREATE INDEX IF NOT EXISTS idx_tags_category_def_id   ON public.tags USING btree (category_def_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id           ON public.tags USING btree (user_id);