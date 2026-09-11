"use client";

import { createBrowserClient } from "@supabase/ssr";

function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // The mock client below silently breaks login/logout. In production builds,
  // fail loudly instead of shipping a client that can never authenticate.
  if (process.env.NODE_ENV === "production" && (!url || !anonKey)) {
    throw new Error(
      "Supabase client env vars are missing. NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set at build time (e.g. in .env.production) so they are inlined into the browser bundle.",
    );
  }

  // If env vars are not set, create a mock client for development
  if (!url || !anonKey) {
    const mockSupabase = {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        signInWithPassword: async () =>
          Promise.resolve({ data: { session: null }, error: { message: "Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY." } }),
        signInWithOAuth: async () =>
          Promise.resolve({
            data: { session: null, error: { message: "Supabase not configured" } },
          }),
        signUp: async () =>
          Promise.resolve({
            data: { user: null, session: null, error: { message: "Supabase not configured" } },
          }),
        resetPasswordForEmail: async () => Promise.resolve({ data: {}, error: { message: "Supabase not configured" } }),
        updateUser: async () => Promise.resolve({ data: { user: null }, error: { message: "Supabase not configured" } }),
        signOut: async () => Promise.resolve({ data: {}, error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
          update: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
          delete: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
        }),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
        update: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
        delete: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      }),
      storage: {
        from: () => ({
          upload: async () => Promise.resolve({ error: null, data: {} }),
          getPublicUrl: () => Promise.resolve({ data: { publicUrl: "" } }),
          remove: async () => Promise.resolve({ error: null }),
        }),
      },
    } as unknown as ReturnType<typeof createBrowserClient>;
    return mockSupabase;
  }

  return createBrowserClient(url, anonKey);
}

const supabase = createClient();

export function useSupabase() {
  return { supabase };
}