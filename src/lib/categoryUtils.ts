import type { CategoryDefinition } from '@/types/types';

import { supabase } from './supabaseClient';

/**
 * After seeding user-owned category copies, migrates any items and tags that
 * still reference global template category IDs (`user_id IS NULL`) to the
 * corresponding user-owned copies (matched by name).
 *
 * This handles the case where users were previously operating on global
 * template rows directly due to a missing `user_id` filter.
 */
async function migrateGlobalReferences(userId: string, userCategories: CategoryDefinition[]): Promise<void> {
  // Fetch global template categories
  const { data: globals } = await supabase.from('category_definitions').select('*').is('user_id', null);

  if (!globals || globals.length === 0) return;

  const globalCats = globals as unknown as CategoryDefinition[];

  // Build a mapping: global category ID → user-owned category ID (matched by name)
  const idMap = new Map<string, string>();
  for (const global of globalCats) {
    const userCat = userCategories.find((uc) => uc.name === global.name);
    if (userCat) {
      idMap.set(global.id, userCat.id);
    }
  }

  if (idMap.size === 0) return;

  const globalIds = [...idMap.keys()];

  // Check if the user has any items still pointing to global categories
  const { data: orphanedItems } = await supabase
    .from('items')
    .select('id, category_def_id')
    .eq('user_id', userId)
    .in('category_def_id', globalIds);

  if (orphanedItems && orphanedItems.length > 0) {
    // Migrate items, grouped by source global ID
    for (const [globalId, userCatId] of idMap) {
      await supabase
        .from('items')
        .update({ category_def_id: userCatId })
        .eq('user_id', userId)
        .eq('category_def_id', globalId);
    }
  }

  // Check if the user has any tags still pointing to global categories
  const { data: orphanedTags } = await supabase
    .from('tags')
    .select('id, category_def_id')
    .eq('user_id', userId)
    .in('category_def_id', globalIds);

  if (orphanedTags && orphanedTags.length > 0) {
    for (const [globalId, userCatId] of idMap) {
      await supabase
        .from('tags')
        .update({ category_def_id: userCatId })
        .eq('user_id', userId)
        .eq('category_def_id', globalId);
    }
  }
}

/**
 * Fetches the authenticated user's category definitions from Supabase, ordered by creation date.
 * If the user has no categories yet, calls the `seed_user_categories` RPC to create defaults
 * before re-fetching and returning them.
 *
 * On first seed, also migrates any items/tags that were previously linked to
 * global template categories (from the pre-fix era) to the new user-owned copies.
 *
 * @param userId - The authenticated user's ID, used to filter for user-owned categories only.
 * @returns A promise that resolves to the user's array of `CategoryDefinition` objects.
 * @throws {PostgrestError} If the initial fetch or the category-seeding RPC fails.
 *
 * Side Effects:
 * - Reads from and may write to the `category_definitions` table.
 * - May invoke the `seed_user_categories` Supabase RPC on first use.
 * - May update `items` and `tags` rows to point to user-owned category IDs.
 */
export async function ensureUserCategories(userId: string): Promise<CategoryDefinition[]> {
  // Try to fetch existing categories owned by this user (excludes global templates)
  const { data: existing, error } = await supabase
    .from('category_definitions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true }); // Oldest first

  if (error) throw error;

  // If categories exist, return them
  if (existing && existing.length > 0) {
    return existing as unknown as CategoryDefinition[];
  }

  // If NO categories, trigger the seed function
  console.log('No categories found. Seeding defaults...');
  const { error: seedError } = await supabase.rpc('seed_user_categories');

  if (seedError) throw seedError;

  // Re-fetch after seeding
  const { data: seeded } = await supabase
    .from('category_definitions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  const userCategories = (seeded as unknown as CategoryDefinition[]) || [];

  // Migrate any items/tags that still reference global template categories
  if (userCategories.length > 0) {
    await migrateGlobalReferences(userId, userCategories);
  }

  return userCategories;
}
