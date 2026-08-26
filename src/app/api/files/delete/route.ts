import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const values = [process.env.R2_ACCOUNT_ID, process.env.R2_ACCESS_KEY_ID, process.env.R2_SECRET_ACCESS_KEY, process.env.R2_BUCKET_NAME];
  if (values.some((value) => !value)) return NextResponse.json({ error: "R2 storage is not configured." }, { status: 503 });
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
  const client = new S3Client({ region: "auto", endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! } });
  await client.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: material.file_key }));
  const { error } = await supabase.from("materials").delete().eq("id", material.id);
  if (error) return NextResponse.json({ error: "File deleted, but material metadata could not be removed." }, { status: 500 });
  await supabase.from("activity_logs").insert({ user_id: user.id, action: "deleted", resource_type: "material", resource_id: material.id });
  return NextResponse.json({ success: true });
}
