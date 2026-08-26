import { NextResponse } from "next/server";
import { encryptPassword } from "@/lib/access-requests-crypto";
import { createSupabaseServiceClient } from "@/lib/server-supabase";

type RequestBody = { email?: string; password?: string };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json() as RequestBody;
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 });
    }

    const supabase = createSupabaseServiceClient();
    const encrypted = await encryptPassword(password);
    const now = new Date().toISOString();

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (existingProfile) {
      return NextResponse.json({ error: "This email already has access. Please sign in." }, { status: 409 });
    }

    const { error } = await supabase
      .from("access_requests")
      .upsert(
        {
          email,
          status: "pending",
          requested_at: now,
          decided_at: null,
          decided_by: null,
          ...encrypted,
        },
        { onConflict: "email" },
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Request sent. An admin will review access soon." });
  }
  catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit access request.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
