import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/server-supabase";

const categories = ["news", "event", "course", "competition"] as const;

function createAuthClient() {
  const cookieStorePromise = cookies();
  return { cookieStorePromise };
}

export async function GET() {
  const { cookieStorePromise } = createAuthClient();
  const cookieStore = await cookieStorePromise;
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => undefined } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const service = createSupabaseServiceClient();
  const { data, error } = await service
    .from("posts")
    .select("id, title, category, body, link, author_id, author_name, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data ?? [] });
}

export async function POST(request: Request) {
  const { cookieStorePromise } = createAuthClient();
  const cookieStore = await cookieStorePromise;
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => undefined } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const body = await request.json().catch(() => null) as { title?: string; category?: string; body?: string; link?: string } | null;
  if (!body || typeof body.title !== "string" || typeof body.body !== "string") {
    return NextResponse.json({ error: "A title and body are required." }, { status: 400 });
  }
  const title = body.title.trim();
  const postBody = body.body.trim();
  if (!title || !postBody) {
    return NextResponse.json({ error: "A title and body are required." }, { status: 400 });
  }
  if (title.length > 140) return NextResponse.json({ error: "Title must be 140 characters or fewer." }, { status: 400 });

  const category = categories.includes(body.category as (typeof categories)[number]) ? body.category : "news";
  const link = typeof body.link === "string" ? body.link.trim() : null;

  const service = createSupabaseServiceClient();
  const { data: profile } = await service.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
  const authorName = profile?.display_name ?? user.email ?? "Member";

  const { data, error } = await service
    .from("posts")
    .insert({ title, category, body: postBody, link: link || null, author_id: user.id, author_name: authorName })
    .select("id, title, category, body, link, author_id, author_name, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data }, { status: 201 });
}