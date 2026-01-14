import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function normalizeEmail(email: string) {
  return String(email ?? '').trim().toLowerCase();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = normalizeEmail(body.email);
    const password = String(body.password ?? '');

    if (!email || !password || password.length < 6) {
      return NextResponse.json({ ok: false, message: '이메일/비밀번호를 확인해 주세요.' }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!url || !anonKey || !serviceKey) {
      return NextResponse.json({ ok: false, message: '서버 환경변수가 설정되지 않았습니다.' }, { status: 500 });
    }

    // 1) 직원 사전등록 여부 확인(관리자 권한)
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

    const { data: emp, error: empErr } = await admin
      .from('employees')
      .select('email,status')
      .eq('email', email)
      .maybeSingle();

    if (empErr) {
      return NextResponse.json({ ok: false, message: empErr.message }, { status: 500 });
    }

    if (!emp || (emp.status !== 'pending' && emp.status !== 'active')) {
      return NextResponse.json(
        { ok: false, message: '등록되지 않은 이메일입니다. 관리자에게 직원 등록을 요청해 주세요.' },
        { status: 403 }
      );
    }

    // 2) 실제 회원가입(anon) → 인증 메일 발송
    const client = createClient(url, anonKey, { auth: { persistSession: false } });

    const { error } = await client.auth.signUp({
      email,
      password,
      options: {
        // 배포 주소가 있으면 그걸로 바꿔도 됨
        emailRedirectTo: 'https://office-sigma-seven.vercel.app/login',
      },
    });

    if (error) {
      const msg = error.message.includes('NOT_ALLOWED_EMAIL')
        ? '등록되지 않은 이메일입니다. 관리자에게 직원 등록을 요청해 주세요.'
        : error.message;

      return NextResponse.json({ ok: false, message: msg }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: '인증 메일을 발송했습니다. 메일함을 확인해 주세요.' });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e?.message ?? '서버 오류' }, { status: 500 });
  }
}
