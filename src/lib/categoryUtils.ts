import type { CategoryDefinition } from '@/types/types';

import { supabase } from './supabaseClient';

/**
 * Fetches the authenticated user's category definitions from Supabase, ordered by creation date.
 * If the user has no categories yet, calls the `seed_user_categories` RPC to create defaults
 * before re-fetching and returning them.
 *
 * @returns A promise that resolves to the user's array of `CategoryDefinition` objects.
 * @throws {PostgrestError} If the initial fetch or the category-seeding RPC fails.
 *
 * Side Effects:
 * - Reads from and may write to the `category_definitions` table.
 * - May invoke the `seed_user_categories` Supabase RPC on first use.
 */
export async function ensureUserCategories(): Promise<CategoryDefinition[]> {
  // Try to fetch existing categories
  const { data: existing, error } = await supabase
    .from('category_definitions')
    .select('*')
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
    .order('created_at', { ascending: true });

  return (seeded as unknown as CategoryDefinition[]) || [];
}
