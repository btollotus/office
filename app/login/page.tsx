'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    // 이미 로그인 되어 있으면 바로 홈으로
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/');
    });
  }, [router]);

  const validate = () => {
    const e = email.trim();
    const p = pw;

    if (!e.includes('@')) return '이메일 형식을 확인해주세요.';
    if (p.length < 6) return '비밀번호는 6자 이상이 필요합니다.';
    return null;
  };

  const submit = async () => {
    setMsg(null);

    const v = validate();
    if (v) {
      setMsg(v);
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        // ✅ 직원 사전등록 이메일만 허용하는 서버 API로 가입 처리
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            password: pw,
          }),
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json?.ok) {
          setMsg(json?.message ?? '회원가입에 실패했습니다.');
          return;
        }

        setMsg(json?.message ?? '인증 메일을 발송했습니다. 메일함을 확인해 주세요.');

        // ✅ 이메일 인증을 켠 경우: 여기서 세션이 생기지 않는 게 정상
        // (인증 링크 클릭 후 로그인으로 진행)
        return;
      }

      // 로그인
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pw,
      });
      if (error) throw error;

      router.replace('/');
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
        <h1 className="mt-2 text-2xl font-bold">{mode === 'login' ? '로그인' : '회원가입'}</h1>

        <div className="mt-6 space-y-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            className="w-full rounded-xl bg-black/40 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-white/25"
            autoComplete="email"
            inputMode="email"
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

          {mode === 'signup' && (
            <div className="pt-2 text-xs text-white/50 leading-relaxed">
              • 등록된 직원 이메일만 회원가입 가능합니다.<br />
              • 가입 후 이메일 인증을 완료한 뒤 로그인해 주세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
