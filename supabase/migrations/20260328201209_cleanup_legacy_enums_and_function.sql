-- =============================================================================
-- CLEANUP — Drop legacy enums and the function that depends on them
--
-- get_tags_with_usage references a 'category' column on tags that no longer
-- exists (tags now use category_def_id instead), so it was already broken.
-- Dropping it is safe — no app code calls it.
--
-- item_category and price_range enums are leftover from before the dynamic
-- category system was built. Nothing in the app references them anymore.
-- =============================================================================

-- Drop the function first since it depends on the item_category enum
DROP FUNCTION IF EXISTS public.get_tags_with_usage(public.item_category);

-- Now drop the unused enums
DROP TYPE IF EXISTS public.item_category;
DROP TYPE IF EXISTS public.price_range;