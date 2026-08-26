import { NextResponse } from "next/server";
import { decryptPassword } from "@/lib/access-requests-crypto";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/server-supabase";

type RequestAction = "approve" | "reject";
type ActionBody = { action?: RequestAction };

type AccessRequestRow = {
  id: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  password_ciphertext: string | null;
  password_iv: string | null;
};

async function authenticate(request: Request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  const supabase = createSupabaseServerClient(token);
  const { data: userResult } = await supabase.auth.getUser();
  if (!userResult.user) return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userResult.user.id).maybeSingle();
  if (profile?.role !== "super_admin") return { error: NextResponse.json({ error: "Super Admin access required." }, { status: 403 }) };
  return { userId: userResult.user.id };
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await authenticate(request);
    if ("error" in auth) return auth.error;

    const { id } = await context.params;
    const body = await request.json() as ActionBody;
    if (body.action !== "approve" && body.action !== "reject") {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    const supabase = createSupabaseServiceClient();
    const { data: accessRequest, error } = await supabase
      .from("access_requests")
      .select("id, email, status, password_ciphertext, password_iv")
      .eq("id", id)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!accessRequest) return NextResponse.json({ error: "Request not found." }, { status: 404 });

    const row = accessRequest as AccessRequestRow;
    if (row.status !== "pending") {
      return NextResponse.json({ error: "This request has already been reviewed." }, { status: 409 });
    }

    const reviewedAt = new Date().toISOString();

    if (body.action === "reject") {
      const { error: rejectError } = await supabase
        .from("access_requests")
        .update({
          status: "rejected",
          decided_at: reviewedAt,
          decided_by: auth.userId,
          password_ciphertext: null,
          password_iv: null,
        })
        .eq("id", id);

      if (rejectError) return NextResponse.json({ error: rejectError.message }, { status: 400 });
      return NextResponse.json({ message: "Request rejected." });
    }

    if (!row.password_ciphertext || !row.password_iv) {
      return NextResponse.json({ error: "Request payload is incomplete." }, { status: 400 });
    }

    const password = await decryptPassword(row.password_ciphertext, row.password_iv);

    const createResult = await supabase.auth.admin.createUser({
      email: row.email,
      password,
      email_confirm: true,
    });

    let userId = createResult.data.user?.id;
    if (createResult.error && !createResult.error.message.toLowerCase().includes("already")) {
      return NextResponse.json({ error: createResult.error.message }, { status: 400 });
    }

    if (!userId) {
      const { data: existing } = await supabase.from("profiles").select("id").eq("email", row.email).maybeSingle();
      if (!existing?.id) {
        return NextResponse.json({ error: "Unable to resolve user account for this email." }, { status: 400 });
      }
      userId = existing.id;
    }

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    const profileMutation = existingProfile
      ? supabase.from("profiles").update({ email: row.email }).eq("id", userId)
      : supabase.from("profiles").insert({ id: userId, email: row.email, role: "user" });

    const { error: profileError } = await profileMutation;
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });

    const { error: approveError } = await supabase
      .from("access_requests")
      .update({
        status: "approved",
        decided_at: reviewedAt,
        decided_by: auth.userId,
        password_ciphertext: null,
        password_iv: null,
      })
      .eq("id", id);

    if (approveError) return NextResponse.json({ error: approveError.message }, { status: 400 });

    await supabase.from("activity_logs").insert({
      user_id: auth.userId,
      action: "approved_access_request",
      resource_type: "access_request",
      resource_id: id,
      metadata: { email: row.email },
    });

    return NextResponse.json({ message: "Access approved and account created." });
  }
  catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process access request.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
