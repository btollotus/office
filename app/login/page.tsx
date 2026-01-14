'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // ✅ next 파라미터 처리
  const next = searchParams.get('next') || '/';

  useEffect(() => {
    // 이미 로그인 되어 있으면 next로 이동
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace(next);
    });
  }, [router, next]);

  const submit = async () => {
    setMsg(null);
    setLoading(true);

    try {
      const e = email.trim();
      const p = pw;

      if (!e.includes('@')) {
        setMsg('이메일 형식을 확인해주세요.');
        return;
      }
      if (p.length < 6) {
        setMsg('비밀번호는 6자 이상이 필요합니다.');
        return;
      }

      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: e,
          password: p,
        });
        if (error) throw error;

        setMsg('✅ 가입 요청 완료! (이메일 인증이 켜져 있으면 메일 확인 필요)');

        // 이메일 인증 OFF면 바로 세션 생김 → next로 이동
        const { data } = await supabase.auth.getSession();
        if (data.session) router.replace(next);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: e,
          password: p,
        });
        if (error) throw error;

        // ✅ 로그인 성공 시 next로
        router.replace(next);
      }
    } catch (e: any) {
      setMsg(e?.message ?? '처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.1)]">
        <div className="font-mono text-xs tracking-widest text-white/70">OFFICE</div>
        <h1 className="mt-2 text-2xl font-bold">
          {mode === 'login' ? '로그인' : '회원가입'}
        </h1>

        <div className="mt-2 text-xs text-white/50">
          이동 대상: <span className="text-white/70">{next}</span>
        </div>

        <div className="mt-6 space-y-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            className="w-full rounded-xl bg-black/40 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-white/25"
            autoComplete="email"
          />
          <input
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="비밀번호 (6자 이상)"
            type="password"
            className="w-full rounded-xl bg-black/40 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-white/25"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />

          {msg && (
            <div className="rounded-xl bg-black/40 px-4 py-3 text-sm text-white/80 ring-1 ring-white/10">
              {msg}
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading}
            className="w-full rounded-xl bg-emerald-500 py-3 font-bold text-black hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-60"
          >
            {loading ? '처리중...' : mode === 'login' ? '로그인' : '회원가입'}
          </button>

          <button
            onClick={() => {
              setMsg(null);
              setMode((m) => (m === 'login' ? 'signup' : 'login'));
            }}
            className="w-full rounded-xl bg-white/10 py-3 font-semibold hover:bg-white/15 active:bg-white/20"
          >
            {mode === 'login' ? '처음이신가요? 회원가입' : '이미 계정이 있나요? 로그인'}
          </button>
        </div>
      </div>
    </div>
  );
}
