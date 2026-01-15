'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type Channel = {
  id: string;
  name: string;
  is_private: boolean;
  created_at: string;
};

export default function ChannelsPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [uid, setUid] = useState<string | null>(null);

  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1) 세션/UID 확인
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const userId = data.session?.user?.id ?? null;
      if (!userId) {
        router.replace('/login');
        return;
      }
      setUid(userId);
      setChecking(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) router.replace('/login');
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  // 2) 내 채널 로드
  const loadMyChannels = async () => {
    setLoading(true);
    setError(null);
    try {
      // channel_members에서 내가 속한 channel_id 목록
      const { data: memberRows, error: mErr } = await supabase
        .from('channel_members')
        .select('channel_id')
        .order('created_at', { ascending: true });

      if (mErr) throw mErr;

      const ids = (memberRows ?? []).map((r) => r.channel_id).filter(Boolean);

      if (ids.length === 0) {
        setChannels([]);
        return;
      }

      // channels 테이블에서 해당 채널들 가져오기
      const { data: chRows, error: cErr } = await supabase
        .from('channels')
        .select('id,name,is_private,created_at')
        .in('id', ids)
        .order('created_at', { ascending: true });

      if (cErr) throw cErr;
      setChannels((chRows ?? []) as Channel[]);
    } catch (e: any) {
      setError(e?.message ?? '채널을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!checking) loadMyChannels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking]);

  // 3) 기본 채널(공지) 생성 + 내가 owner로 가입 (RLS 정책이 이걸 허용해야 함)
  const createDefaultChannel = async () => {
    setCreating(true);
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) {
        router.replace('/login');
        return;
      }

      // 채널 생성
      const { data: ch, error: chErr } = await supabase
        .from('channels')
        .insert([{ name: '공지', is_private: false, created_by: userId }])
        .select('id,name,is_private,created_at')
        .single();

      if (chErr) throw chErr;

      // 멤버십 등록(본인 owner)
      const { error: mErr } = await supabase
        .from('channel_members')
        .insert([{ channel_id: ch.id, user_id: userId, role: 'owner' }]);

      if (mErr) throw mErr;

      await loadMyChannels();
    } catch (e: any) {
      setError(e?.message ?? '기본 채널 생성 실패');
    } finally {
      setCreating(false);
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
      <h1 className="text-2xl font-bold">채널</h1>

      {/* ✅ 현재 로그인 UID 표시 (문제 원인 바로 잡기) */}
      <p className="mt-2 text-white/50 text-sm">
        내 UID: <span className="font-mono">{uid}</span>
      </p>

      {error && (
        <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-200">
          {error}
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <p className="text-white/70">불러오는 중...</p>
        ) : channels.length === 0 ? (
          <div className="space-y-4">
            <p className="text-white/70">내 채널이 없습니다.</p>

            <button
              onClick={createDefaultChannel}
              disabled={creating}
              className="rounded-xl bg-emerald-500 px-4 py-3 text-black hover:bg-emerald-400 disabled:opacity-60"
            >
              {creating ? '기본 채널 만드는 중...' : '기본 채널 만들기 (공지)'}
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {channels.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => router.push(`/channels/${c.id}`)}
                  className="w-full text-left rounded-xl bg-white/5 px-4 py-3 hover:bg-white/10"
                >
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-sm text-white/50 font-mono">{c.id}</div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8 flex gap-3">
        <button
          onClick={() => router.push('/')}
          className="rounded-xl bg-white/10 px-4 py-3 hover:bg-white/15"
        >
          홈으로
        </button>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.assign("/login?next=/channels");
          }}
          className="rounded-xl bg-white/10 px-4 py-3 hover:bg-white/15"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
