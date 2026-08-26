import "server-only";

import { createClient } from "@supabase/supabase-js";

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon) throw new Error("Supabase environment variables are missing.");
  return { url, anon, serviceRole };
}

export function createSupabaseServerClient(token: string) {
  const { url, anon } = getEnv();
  return createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
}

export function createSupabaseServiceClient() {
  const { url, serviceRole } = getEnv();
  if (!serviceRole) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing.");
  return createClient(url, serviceRole);
}
