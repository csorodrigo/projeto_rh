/**
 * Supabase Client for Server Components
 * Server-side Supabase instance with cookie-based session management
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Creates a Supabase client for server components
 * Handles cookie-based session management for Next.js App Router
 *
 * @returns Supabase client configured for server-side usage
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch (error) {
          // Handle cookie setting errors (can occur in Server Components)
          // This is safe to ignore in middleware
          console.error('Error setting cookies:', error);
        }
      },
    },
  });
}

/**
 * Get current user session from server
 * Returns null if no active session
 */
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * Get current authenticated user from server
 * Returns null if no active session
 */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
