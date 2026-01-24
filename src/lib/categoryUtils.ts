import { supabase } from './supabaseClient';
import type { CategoryDefinition } from '@/types/types';

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
