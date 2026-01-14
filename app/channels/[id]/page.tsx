'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type Msg = {
  id: string;
  channel_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

export default function ChannelRoomPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const channelId = params.id;

  const [checking, setChecking] = useState(true);
  const [uid, setUid] = useState<string | null>(null);

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

  // 1) 세션 확인
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

  // 2) 메시지 로드
  const loadMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id,channel_id,user_id,body,created_at')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(200);

      if (error) throw error;
      setMsgs((data ?? []) as Msg[]);
      // 로드 후 맨 아래로
      setTimeout(scrollToBottom, 50);
    } catch (e: any) {
      setError(e?.message ?? '메시지를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!checking) loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, channelId]);

  // 3) Realtime 구독 (INSERT만)
  useEffect(() => {
    if (checking) return;

    const channel = supabase
      .channel(`room:${channelId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` },
        (payload) => {
          const row = payload.new as Msg;
          setMsgs((prev) => {
            // 혹시 중복 방지
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, row];
          });
          setTimeout(scrollToBottom, 20);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [checking, channelId]);

  // 4) 전송
  const send = async () => {
    const body = text.trim();
    if (!body) return;
    if (!uid) return;

    setSending(true);
    setError(null);
    try {
      // RLS 때문에: user_id = auth.uid() 이어야 insert 됨
      const { error } = await supabase.from('messages').insert([
        {
          channel_id: channelId,
          user_id: uid,
          body,
        },
      ]);

      if (error) throw error;
      setText('');
      // insert 성공하면 realtime으로 다시 들어오지만,
      // 네트워크 상황에 따라 바로 UX 위해 scroll 한번 더
      setTimeout(scrollToBottom, 20);
    } catch (e: any) {
      setError(e?.message ?? '전송 실패');
    } finally {
      setSending(false);
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
    <div className="min-h-screen bg-zinc-950 text-white p-4">
      {/* 상단바 */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm text-white/50">채널</div>
          <div className="text-lg font-bold">공지</div>
          <div className="text-xs text-white/40 font-mono break-all">{channelId}</div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => router.push('/channels')}
            className="rounded-xl bg-white/10 px-4 py-2 hover:bg-white/15"
          >
            채널 목록
          </button>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace('/login');
            }}
            className="rounded-xl bg-white/10 px-4 py-2 hover:bg-white/15"
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* 에러 */}
      {error && (
        <div className="mt-3 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-200">
          {error}
        </div>
      )}

      {/* 메시지 영역 */}
      <div className="mt-4 rounded-2xl bg-black/30 border border-white/10 p-3 h-[65vh] overflow-y-auto">
        {loading ? (
          <div className="text-white/60">불러오는 중...</div>
        ) : msgs.length === 0 ? (
          <div className="text-white/60">첫 메시지를 보내보세요.</div>
        ) : (
          <div className="space-y-2">
            {msgs.map((m) => {
              const mine = m.user_id === uid;
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      mine ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white'
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">{m.body}</div>
                    <div className={`mt-1 text-[11px] ${mine ? 'text-black/60' : 'text-white/50'}`}>
                      {new Date(m.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* 입력 영역 */}
      <div className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="메시지를 입력하세요 (Enter 전송)"
          className="flex-1 rounded-xl bg-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/40"
        />
        <button
          onClick={send}
          disabled={sending || text.trim().length === 0}
          className="rounded-xl bg-emerald-500 px-4 py-3 text-black hover:bg-emerald-400 disabled:opacity-60"
        >
          {sending ? '전송중...' : '전송'}
        </button>
      </div>

      <p className="mt-2 text-xs text-white/40">
        내 UID: <span className="font-mono">{uid}</span>
      </p>
    </div>
  );
}
