import { createServerClient } from "@supabase/ssr";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const maxUploadSize = 100 * 1024 * 1024;

type StudyVaultBucket = {
  put(key: string, value: ArrayBuffer, options: { httpMetadata: { contentType: string } }): Promise<unknown>;
};

declare global {
  interface CloudflareEnv {
    STUDYVAULT_BUCKET: StudyVaultBucket;
  }
}

export async function POST(request: Request) {
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

  try {
    const { env } = await getCloudflareContext({ async: true });
    await env.STUDYVAULT_BUCKET.put(fileKey, fileBytes, {
      httpMetadata: { contentType: request.headers.get("content-type") || "application/octet-stream" },
    });
  } catch {
    return NextResponse.json({ error: "R2 could not store the file. Please try again." }, { status: 502 });
  }

  return NextResponse.json({ fileKey });
}
