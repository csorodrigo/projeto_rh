/**
 * Supabase Authentication Functions
 * Type-safe authentication operations for the HR SaaS system
 */

import { createClient } from './client';
import type { AuthError, User } from '@supabase/supabase-js';

export interface AuthResult {
  user: User | null;
  error: AuthError | null;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

/**
 * Sign in with email and password
 */
export async function signIn({
  email,
  password,
}: SignInCredentials): Promise<AuthResult> {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return {
    user: data.user,
    error,
  };
}

/**
 * Sign up new user with email and password
 * Creates profile automatically via database trigger
 */
export async function signUp({
  email,
  password,
  full_name,
  phone,
}: SignUpCredentials): Promise<AuthResult> {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        phone,
      },
    },
  });

  return {
    user: data.user,
    error,
  };
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Send password reset email
 */
export async function resetPassword(
  email: string
): Promise<{ error: AuthError | null }> {
  const supabase = createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  return { error };
}

/**
 * Update user password
 * User must be authenticated
 */
export async function updatePassword(
  newPassword: string
): Promise<{ error: AuthError | null }> {
  const supabase = createClient();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  return { error };
}

/**
 * Get current user
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/**
 * Get current session
 */
export async function getSession() {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(
  callback: (user: User | null) => void
) {
  const supabase = createClient();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });

  return () => subscription.unsubscribe();
}

/**
 * Verify if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}
