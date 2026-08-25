"use client";

import { createBrowserClient } from "@supabase/ssr";

function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env vars are not set, create a mock client for development
  if (!url || !anonKey) {
    // @ts-ignore - mock client for development without Supabase credentials
    const mockSupabase = {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithPassword: async () =>
          Promise.resolve({
            data: { session: null, error: { message: "Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY." } },
          }),
        signInWithOAuth: async () =>
          Promise.resolve({
            data: { session: null, error: { message: "Supabase not configured" } },
          }),
        signUp: async () =>
          Promise.resolve({
            data: { user: null, session: null, error: { message: "Supabase not configured" } },
          }),
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
    };
    return mockSupabase;
  }

  return createBrowserClient(url, anonKey);
}

export function useSupabase() {
  const supabase = createClient();
  return { supabase };
}