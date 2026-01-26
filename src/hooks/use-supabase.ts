/**
 * Supabase React Hooks
 * Custom hooks for using Supabase in React components
 */

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Profile, Company } from '@/types';

/**
 * Hook to get current user
 * Returns user and loading state
 */
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}

/**
 * Hook to get current user profile
 */
export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useUser();

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const supabase = createClient();

    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          setError(error as Error);
        } else {
          setProfile(data);
        }
        setLoading(false);
      });
  }, [user]);

  return { profile, loading, error };
}

/**
 * Hook to get current user's company
 */
export function useCompany() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { profile } = useProfile();

  useEffect(() => {
    if (!profile?.company_id) {
      setCompany(null);
      setLoading(false);
      return;
    }

    const supabase = createClient();

    supabase
      .from('companies')
      .select('*')
      .eq('id', profile.company_id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          setError(error as Error);
        } else {
          setCompany(data);
        }
        setLoading(false);
      });
  }, [profile]);

  return { company, loading, error };
}

/**
 * Hook to check if user is authenticated
 */
export function useAuth() {
  const { user, loading } = useUser();
  const isAuthenticated = !!user;

  return { user, isAuthenticated, loading };
}

/**
 * Hook to get user role
 */
export function useUserRole() {
  const { profile, loading } = useProfile();

  return {
    role: profile?.role ?? null,
    loading,
    isAdmin: profile?.role === 'company_admin' || profile?.role === 'super_admin',
    isHR: profile?.role === 'hr_manager' || profile?.role === 'hr_analyst',
    isEmployee: profile?.role === 'employee',
  };
}
