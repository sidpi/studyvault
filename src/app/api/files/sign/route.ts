import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const requiredEnv = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
] as const;

export async function POST(request: Request) {
  const missing = requiredEnv.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    return NextResponse.json({ error: "R2 storage is not configured." }, { status: 503 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => undefined } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const body = await request.json().catch(() => null) as { fileKey?: string; disposition?: "inline" | "attachment" } | null;
  if (!body?.fileKey || body.fileKey.includes("..") || body.fileKey.startsWith("/")) {
    return NextResponse.json({ error: "A valid file key is required." }, { status: 400 });
  }
  const { data: material, error: materialError } = await supabase
    .from("materials")
    .select("id")
    .eq("file_key", body.fileKey)
    .maybeSingle();
  if (materialError) return NextResponse.json({ error: "Material lookup failed." }, { status: 500 });
  if (!material) return NextResponse.json({ error: "Material not found." }, { status: 404 });

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: body.fileKey,
    ResponseContentDisposition: body.disposition === "attachment" ? `attachment; filename="${body.fileKey.split("/").pop()}"` : "inline",
  });
  const url = await getSignedUrl(client, command, { expiresIn: 900 });
  return NextResponse.json({ url, expiresIn: 900 });
}
