// app/admin/employees/page.tsx
import { createSupabaseServer } from '@/lib/supabaseServer';

export default async function AdminEmployeesPage() {
  const supabase = createSupabaseServer();
  const { data } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <h1 className="text-2xl font-bold">직원 관리 (관리자)</h1>
      <p className="mt-2 text-white/70">
        로그인 사용자: {data.user?.email ?? '없음'}
      </p>

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
