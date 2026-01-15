import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getAdminClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "MISSING_FIELDS" }, { status: 400 });
    }

    const admin = getAdminClient();

    // ✅ Service Role로 유저 생성 (이 단계가 405가 아니라 200/4xx/5xx로 바뀌어야 정상)
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // 대시보드에서 Auto Confirm 체크한 효과
    });

    if (error) {
      return NextResponse.json(
        { ok: false, error: "CREATE_USER_FAILED", detail: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, user_id: data.user?.id ?? null }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}

// (가끔 브라우저가 preflight OPTIONS를 보내는 환경에서 필요)
export async function OPTIONS() {
  return NextResponse.json({ ok: true }, { status: 200 });
}
