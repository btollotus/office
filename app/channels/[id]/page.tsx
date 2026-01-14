'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type Msg = {
  id: string;
  body: string;
  user_id: string;
  created_at: string;
};

export default function ChannelChatPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const channelId = params.id;

  const [loading, setLoading] = useState(true);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return router.replace('/login');

      const { data, error } = await supabase
        .from('messages')
        .select('id, body, user_id, created_at')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

      if (!mounted) return;

      if (error) console.error(error);
      setMsgs((data ?? []) as Msg[]);
      setLoading(false);

      setTimeout(scrollToBottom, 50);
    })();

    return () => {
      mounted = false;
    };
  }, [router, channelId]);

  // 실시간 구독(새 메시지 들어오면 append)
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${channelId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` },
        (payload) => {
          const m = payload.new as Msg;
          setMsgs((prev) => [...prev, m]);
          setTimeout(scrollToBottom, 50);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;

    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return router.replace('/login');

    setText('');

    const { error } = await supabase.from('messages').insert({
      channel_id: channelId,
      user_id: uid,
      body,
    });

    if (error) {
      console.error(error);
      // 실패하면 입력 복구
      setText(body);
      alert('전송 실패');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <div className="p-4 border-b border-white/10 flex items-center gap-3">
        <button
          onClick={() => router.push('/channels')}
          className="rounded-xl bg-white/10 px-3 py-2 hover:bg-white/15"
        >
          ←
        </button>
        <div className="font-semibold">채널 채팅</div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="text-white/60 font-mono">LOADING...</p>
        ) : msgs.length === 0 ? (
          <p className="text-white/60">첫 메시지를 보내보세요.</p>
        ) : (
          <div className="grid gap-2">
            {msgs.map((m) => (
              <div key={m.id} className="rounded-2xl bg-white/5 border border-white/10 p-3">
                <div className="text-xs text-white/40">{new Date(m.created_at).toLocaleString()}</div>
                <div className="mt-1">{m.body}</div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/10 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send();
          }}
          placeholder="메시지 입력..."
          className="flex-1 rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none"
        />
        <button
          onClick={send}
          className="rounded-xl bg-emerald-500/90 px-4 py-3 font-semibold hover:bg-emerald-500"
        >
          전송
        </button>
      </div>
    </div>
  );
}
