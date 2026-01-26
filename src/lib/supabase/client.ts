/**
 * Supabase Client for Browser
 * Client-side Supabase instance with type safety
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Creates a Supabase client for browser usage
 * Automatically handles session management and auth state
 */
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

/**
 * Default browser client instance
 * Use this for client components and client-side operations
 */
export const supabase = createClient();
