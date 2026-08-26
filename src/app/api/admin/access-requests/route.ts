import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/server-supabase";

type AccessRequest = {
  id: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  requested_at: string;
  decided_at: string | null;
};

async function authenticate(request: Request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  const supabase = createSupabaseServerClient(token);
  const { data: userResult } = await supabase.auth.getUser();
  if (!userResult.user) return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userResult.user.id).maybeSingle();
  if (profile?.role !== "super_admin") return { error: NextResponse.json({ error: "Super Admin access required." }, { status: 403 }) };
  return { userId: userResult.user.id };
}

export async function GET(request: Request) {
  const auth = await authenticate(request);
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const supabase = createSupabaseServiceClient();
  let query = supabase
    .from("access_requests")
    .select("id, email, status, requested_at, decided_at")
    .order("requested_at", { ascending: false })
    .limit(100);

  if (status === "pending" || status === "approved" || status === "rejected") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ requests: (data ?? []) as AccessRequest[] });
}
