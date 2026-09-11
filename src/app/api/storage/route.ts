import { createServerClient } from "@supabase/ssr";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type ListableBucket = {
  list(options?: { prefix?: string; cursor?: string; limit?: number }): Promise<{
    objects: { size: number }[];
    truncated: boolean;
    cursor: string;
  }>;
};

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => undefined } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { env } = await getCloudflareContext({ async: true });
  const bucket = env.STUDYVAULT_BUCKET as unknown as ListableBucket | undefined;
  if (!bucket) return NextResponse.json({ error: "R2 storage is not configured." }, { status: 503 });

  try {
    let objectCount = 0;
    let totalBytes = 0;
    let cursor: string | undefined;

    do {
      const result = await bucket.list({ prefix: "materials/", ...(cursor ? { cursor } : {}) });
      objectCount += result.objects.length;
      totalBytes += result.objects.reduce((sum, object) => sum + (object.size ?? 0), 0);
      cursor = result.truncated ? result.cursor : undefined;
    } while (cursor);

    return NextResponse.json({ objectCount, totalBytes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to read storage usage.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
