"use client";

import { createBrowserClient } from "@supabase/ssr";

export function useSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env vars are not set, create a mock client for development
  if (!url || !anonKey) {
    const mockSupabase = {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithPassword: async () => ({ data: { session: null }, error: { message: "Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY." } }),
        signInWithOAuth: async () => ({ data: { session: null }, error: { message: "Supabase not configured" } }),
        signUp: async () => ({ data: { user: null, session: null }, error: { message: "Supabase not configured" } }),
        signOut: async () => {},
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
        insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
        update: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
        delete: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
      }),
      storage: {
        from: () => ({
          upload: async () => ({ error: null, data: {} }),
          getPublicUrl: () => ({ data: { publicUrl: "" } }),
          remove: async () => ({ error: null }),
        }),
      },
    };
    return { supabase: mockSupabase } as const;
  }

  const supabase = createBrowserClient(url, anonKey);
  return { supabase };
}