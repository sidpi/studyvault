import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/server-supabase";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => undefined } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const body = await request.json().catch(() => null) as { display_name?: string } | null;
  if (!body || typeof body.display_name !== "string") {
    return NextResponse.json({ error: "A display name is required." }, { status: 400 });
  }
  const displayName = body.display_name.trim();
  if (displayName.length > 80) {
    return NextResponse.json({ error: "Display name must be 80 characters or fewer." }, { status: 400 });
  }

  const service = createSupabaseServiceClient();
  const { data: existing } = await service.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (!existing) {
    const { error: insertError } = await service.from("profiles").insert({
      id: user.id,
      email: user.email ?? "",
      display_name: displayName || null,
      role: "user",
    });
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
    return NextResponse.json({ message: "Profile updated." });
  }

  const { error } = await service.from("profiles").update({ display_name: displayName || null }).eq("id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Profile updated." });
}