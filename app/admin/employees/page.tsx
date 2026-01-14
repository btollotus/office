// app/admin/employees/page.tsx
import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabaseServer';

function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;

  const raw = process.env.ADMIN_EMAILS ?? '';
  const admins = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  return admins.includes(email.toLowerCase());
}

export default async function AdminEmployeesPage() {
  // ✅ 중요: createSupabaseServer()는 async 이므로 await 필요
  const supabase = await createSupabaseServer();

  // ✅ 서버에서 현재 로그인 유저 확인 (쿠키 기반)
  const { data, error } = await supabase.auth.getUser();

  // 1) 로그인 안되어 있으면 로그인으로
  if (error || !data?.user) {
    redirect('/login?next=/admin/employees');
  }

  const email = data.user.email ?? null;

  // 2) 관리자 이메일 아니면 차단
  if (!isAdminEmail(email)) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white p-6">
        <h1 className="text-2xl font-bold">접근 권한이 없습니다</h1>

        <div className="mt-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          <p className="text-white/80">
            이 페이지는 <span className="text-emerald-300">관리자</span>만 접근할 수 있어요.
          </p>

          <p className="mt-2 text-white/60 text-sm">로그인 사용자: {email ?? '없음'}</p>

          <p className="mt-2 text-white/60 text-sm">
            해결: 서버 환경변수{' '}
            <code className="text-white/80">ADMIN_EMAILS</code>에 관리자 이메일을 쉼표로
            등록하세요.
          </p>

          <p className="mt-2 text-white/60 text-sm">
            현재 ADMIN_EMAILS:{' '}
            <code className="text-white/80">
              {(process.env.ADMIN_EMAILS ?? '').trim() || '(비어있음)'}
            </code>
          </p>
        </div>

        <div className="mt-6 flex gap-2">
          <a
            href="/"
            className="inline-flex items-center rounded-xl bg-white/10 px-4 py-3 hover:bg-white/15"
          >
            홈으로
          </a>
          <a
            href="/login"
            className="inline-flex items-center rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-black hover:bg-emerald-400"
          >
            로그인으로
          </a>
        </div>
      </div>
    );
  }

  // ✅ 여기까지 오면 관리자 OK
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <h1 className="text-2xl font-bold">직원 관리 (관리자)</h1>
      <p className="mt-2 text-white/70">로그인 사용자: {email}</p>

      <div className="mt-6 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
        <p className="text-white/80">
          ✅ 여기까지 뜨면 라우팅/미들웨어/서버 세션 연결은 정상입니다.
        </p>
        <p className="mt-2 text-white/60 text-sm">
          다음 단계에서 “등록된 이메일만 회원가입 허용” 로직을 붙입니다.
        </p>
      </div>
    </div>
  );
}
