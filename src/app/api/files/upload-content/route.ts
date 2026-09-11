import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const maxUploadSize = 100 * 1024 * 1024;

export async function POST(request: Request) {
  const config = {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET_NAME,
  };
  if (Object.values(config).some((value) => !value)) return NextResponse.json({ error: "R2 storage is not configured." }, { status: 503 });

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maxUploadSize) return NextResponse.json({ error: "Files must be 100 MB or smaller." }, { status: 413 });
  const encodedName = request.headers.get("x-file-name");
  if (!encodedName) return NextResponse.json({ error: "A file name is required." }, { status: 400 });

  const cookieStore = await cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => cookieStore.getAll(), setAll: () => undefined },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError) return NextResponse.json({ error: "Unable to verify uploader permissions." }, { status: 500 });
  if (!profile || !["uploader", "super_admin"].includes(profile.role)) return NextResponse.json({ error: "Uploader permissions required." }, { status: 403 });

  let fileName: string;
  try {
    fileName = decodeURIComponent(encodedName);
  } catch {
    return NextResponse.json({ error: "The file name is invalid." }, { status: 400 });
  }
  const fileBytes = await request.arrayBuffer();
  if (!fileBytes.byteLength) return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  if (fileBytes.byteLength > maxUploadSize) return NextResponse.json({ error: "Files must be 100 MB or smaller." }, { status: 413 });

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-120);
  const fileKey = `materials/${crypto.randomUUID()}-${safeName}`;
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: config.accessKeyId!, secretAccessKey: config.secretAccessKey! },
  });

  try {
    await client.send(new PutObjectCommand({
      Bucket: config.bucket,
      Key: fileKey,
      Body: new Uint8Array(fileBytes),
      ContentType: request.headers.get("content-type") || "application/octet-stream",
    }));
  } catch {
    return NextResponse.json({ error: "R2 could not store the file. Please try again." }, { status: 502 });
  }

  return NextResponse.json({ fileKey });
}
