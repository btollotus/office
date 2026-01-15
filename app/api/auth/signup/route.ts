import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function json(status: number, body: any) {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

// ✅ 관리자(서버)에서만 쓰는 서비스 롤 클라이언트
function adminSupabase() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  try {
    const { email, password, full_name, phone } = await req.json();

    if (!email || !password) {
      return json(400, { ok: false, error: "EMAIL_PASSWORD_REQUIRED" });
    }
    if (String(password).length < 6) {
      return json(400, { ok: false, error: "PASSWORD_TOO_SHORT" });
    }

    const supabase = adminSupabase();

    // 1) employees에 등록된 이메일인지 확인
    const { data: emp, error: empErr } = await supabase
      .from("employees")
      .select("email,status")
      .ilike("email", String(email))
      .maybeSingle();

    if (empErr) return json(500, { ok: false, error: "EMPLOYEE_LOOKUP_FAILED", detail: empErr.message });
    if (!emp || !["pending", "active"].includes(emp.status)) {
      return json(403, { ok: false, error: "NOT_ALLOWED_EMAIL" });
    }

    // 2) Auth 사용자 생성(이메일 인증 없이 바로 confirmed로 생성)
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: String(email).toLowerCase(),
      password: String(password),
      email_confirm: true,
      user_metadata: {
        display_name: full_name ?? String(email).split("@")[0],
        phone: phone ?? null,
      },
    });

    if (createErr) {
      return json(500, { ok: false, error: "CREATE_USER_FAILED", detail: createErr.message });
    }

    // 3) employees에 profile_id 연결 + active 전환
    const uid = created.user?.id ?? null;
    if (uid) {
      const { error: upErr } = await supabase
        .from("employees")
        .update({
          profile_id: uid,
          status: emp.status === "disabled" ? "disabled" : "active",
        })
        .ilike("email", String(email));

      if (upErr) {
        // 사용자 생성은 됐는데 직원 테이블 업데이트가 실패한 경우
        return json(500, { ok: false, error: "EMPLOYEE_UPDATE_FAILED", detail: upErr.message });
      }
    }

    return json(200, { ok: true });
  } catch (e: any) {
    return json(500, { ok: false, error: "SERVER_ERROR", detail: String(e?.message ?? e) });
  }
}

// ✅ GET으로 때리면 405 대신 안내 JSON 주기
export async function GET() {
  return json(405, { ok: false, error: "METHOD_NOT_ALLOWED", allow: ["POST"] });
}
