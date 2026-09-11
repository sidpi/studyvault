import { createServerClient } from "@supabase/ssr";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type ReadableBucket = {
  get(key: string, options?: { range?: { offset?: number; length?: number } }): Promise<{
    body?: ReadableStream;
    size?: number;
    range?: number;
    writeHttpMetadata?: (headers: Headers) => void;
  } | null>;
};

function parseRangeHeader(header: string | null, fileSize: number): { offset: number; length: number } | null {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match) return null;
  const [, rawStart, rawEnd] = match;
  let start: number;
  let end: number;
  if (rawStart === "") {
    // suffix range: last N bytes
    const suffix = Number(rawEnd);
    if (!Number.isFinite(suffix) || suffix <= 0) return null;
    start = Math.max(0, fileSize - suffix);
    end = fileSize - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd === "" ? fileSize - 1 : Math.min(Number(rawEnd), fileSize - 1);
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= fileSize) return null;
  return { offset: start, length: end - start + 1 };
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => cookieStore.getAll(), setAll: () => undefined },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const body = await request.json().catch(() => null) as { fileKey?: string; disposition?: "inline" | "attachment" } | null;
  if (!body?.fileKey || body.fileKey.includes("..") || body.fileKey.startsWith("/")) {
    return NextResponse.json({ error: "A valid file key is required." }, { status: 400 });
  }
  const { data: material, error: materialError } = await supabase
    .from("materials")
    .select("id, file_name, mime_type")
    .eq("file_key", body.fileKey)
    .maybeSingle();
  if (materialError) return NextResponse.json({ error: "Material lookup failed." }, { status: 500 });
  if (!material) return NextResponse.json({ error: "Material not found." }, { status: 404 });

  const { env } = await getCloudflareContext({ async: true });
  const bucket = env.STUDYVAULT_BUCKET as unknown as ReadableBucket | undefined;
  if (!bucket) return NextResponse.json({ error: "R2 storage is not available." }, { status: 503 });

  const range = parseRangeHeader(request.headers.get("range"), Number.MAX_SAFE_INTEGER);
  const object = await bucket.get(body.fileKey, range ? { range } : undefined);
  if (!object || !object.body) return NextResponse.json({ error: "File not found in storage." }, { status: 404 });

  const disposition = body.disposition === "attachment" ? "attachment" : "inline";
  const headers = new Headers();
  headers.set("Content-Type", material.mime_type || "application/octet-stream");
  headers.set("Content-Disposition", `${disposition}; filename="${(material.file_name || "file").replace(/["\\]/g, "")}"`);
  headers.set("Cache-Control", "private, max-age=0, must-revalidate");
  if (typeof object.size === "number") headers.set("Content-Length", String(object.size));
  if (range && typeof object.range === "number") {
    headers.set("Content-Range", `bytes ${range.offset}-${range.offset + object.range - 1}/${object.size ?? "*"}`);
    return new NextResponse(object.body, { status: 206, headers });
  }
  return new NextResponse(object.body, { status: 200, headers });
}
