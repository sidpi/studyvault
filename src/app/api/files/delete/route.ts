import { createServerClient } from "@supabase/ssr";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => cookieStore.getAll(), setAll: () => undefined },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !["uploader", "super_admin"].includes(profile.role)) return NextResponse.json({ error: "Uploader permissions required." }, { status: 403 });
  const body = await request.json().catch(() => null) as { id?: string } | null;
  if (!body?.id) return NextResponse.json({ error: "Material id is required." }, { status: 400 });
  const { data: material, error: materialError } = await supabase.from("materials").select("id, file_key").eq("id", body.id).maybeSingle();
  if (materialError) return NextResponse.json({ error: "Material lookup failed." }, { status: 500 });
  if (!material) return NextResponse.json({ error: "Material not found." }, { status: 404 });

  const { env } = await getCloudflareContext({ async: true });
  const bucket = env.STUDYVAULT_BUCKET as unknown as { delete(key: string): Promise<unknown> } | undefined;
  if (!bucket) return NextResponse.json({ error: "R2 storage is not available." }, { status: 503 });

  try {
    await bucket.delete(material.file_key);
  } catch {
    return NextResponse.json({ error: "The file could not be removed from storage." }, { status: 502 });
  }

  const { error } = await supabase.from("materials").delete().eq("id", material.id);
  if (error) return NextResponse.json({ error: "File deleted, but material metadata could not be removed." }, { status: 500 });
  await supabase.from("activity_logs").insert({ user_id: user.id, action: "deleted", resource_type: "material", resource_id: material.id });
  return NextResponse.json({ success: true });
}
