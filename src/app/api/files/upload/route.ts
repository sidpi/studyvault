import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const config = {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET_NAME,
  };
  if (Object.values(config).some((value) => !value)) return NextResponse.json({ error: "R2 storage is not configured." }, { status: 503 });

  const cookieStore = await cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => cookieStore.getAll(), setAll: () => undefined },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError) return NextResponse.json({ error: "Unable to verify uploader permissions." }, { status: 500 });
  if (!profile || !["uploader", "super_admin"].includes(profile.role)) return NextResponse.json({ error: "Uploader permissions required." }, { status: 403 });

  const body = await request.json().catch(() => null) as { fileName?: string; contentType?: string } | null;
  if (!body?.fileName || !body.contentType) return NextResponse.json({ error: "File name and content type are required." }, { status: 400 });
  const safeName = body.fileName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-120);
  const fileKey = `materials/${crypto.randomUUID()}-${safeName}`;
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: config.accessKeyId!, secretAccessKey: config.secretAccessKey! },
  });
  const url = await getSignedUrl(client, new PutObjectCommand({ Bucket: config.bucket, Key: fileKey, ContentType: body.contentType }), { expiresIn: 900 });
  return NextResponse.json({ url, fileKey, expiresIn: 900 });
}
