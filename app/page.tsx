'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    // 1) 최초 세션 체크
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;

      if (error || !data.session) {
        router.replace('/login');
        return;
      }

      setChecking(false);
    });

    // 2) 세션 변경(로그아웃/토큰만료 등)도 감지해서 즉시 처리
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/login');
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const goChannels = () => router.push('/channels');

  const onLogout = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
    } finally {
      router.replace('/login');
      setSigningOut(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="font-mono text-white/70">CHECKING SESSION...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <h1 className="text-2xl font-bold">OFFICE 메신저</h1>
      <p className="mt-2 text-white/70">로그인 성공 ✅</p>

      <div className="mt-6 flex gap-3">
        <button
          onClick={goChannels}
          className="rounded-xl bg-emerald-500 px-4 py-3 text-black hover:bg-emerald-400"
        >
          채널로 이동
        </button>

        <button
          onClick={onLogout}
          disabled={signingOut}
          className="rounded-xl bg-white/10 px-4 py-3 hover:bg-white/15 disabled:opacity-60"
        >
          {signingOut ? '로그아웃 중...' : '로그아웃'}
        </button>
      </div>
    </div>
  );
}
