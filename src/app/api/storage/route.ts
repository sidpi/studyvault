import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const config = {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET_NAME,
  };
  if (Object.values(config).some((value) => !value)) {
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

  try {
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: config.accessKeyId!, secretAccessKey: config.secretAccessKey! },
    });

    let objectCount = 0;
    let totalBytes = 0;
    let continuationToken: string | undefined;

    do {
      const command = new ListObjectsV2Command({
        Bucket: config.bucket,
        ContinuationToken: continuationToken,
      });
      const result = await client.send(command);
      const contents = result.Contents ?? [];
      objectCount += contents.length;
      totalBytes += contents.reduce((sum, object) => sum + (object.Size ?? 0), 0);
      continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined;
    } while (continuationToken);

    return NextResponse.json({ objectCount, totalBytes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to read storage usage.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}