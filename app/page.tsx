'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 1) 최초 세션 체크
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;

      if (!data.session) {
        router.replace('/login');
      } else {
        setChecking(false);
      }
    });

    // 2) 세션 변경(로그아웃/토큰만료 등)도 감지해서 즉시 처리
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/login');
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

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

      <button
        onClick={async () => {
          await supabase.auth.signOut();
          router.replace('/login');
        }}
        className="mt-6 rounded-xl bg-white/10 px-4 py-3 hover:bg-white/15"
      >
        로그아웃
      </button>
    </div>
  );
}
