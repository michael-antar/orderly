import { createClient } from '@supabase/supabase-js';

import { type Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be defined in.env.local');
}

/**
 * Singleton Supabase client instance typed against the generated `Database` schema.
 * Use this for all database queries and authentication operations throughout the application.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
