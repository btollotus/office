'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState<Channel[]>([]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return router.replace('/login');

      // 내가 속한 채널만 가져오기: channel_members → channels join
      const { data, error } = await supabase
        .from('channel_members')
        .select('channels:channels(id,name,is_private,created_at)')
        .order('created_at', { ascending: true, referencedTable: 'channels' });

      if (!mounted) return;

      if (error) {
        console.error(error);
        setChannels([]);
      } else {
        const list =
          (data ?? [])
            .map((row: any) => row.channels)
            .filter(Boolean) as Channel[];
        setChannels(list);
      }

      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">채널</h1>

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

      {loading ? (
        <p className="mt-6 text-white/60 font-mono">LOADING...</p>
      ) : channels.length === 0 ? (
        <p className="mt-6 text-white/60">내 채널이 없습니다.</p>
      ) : (
        <div className="mt-6 grid gap-3">
          {channels.map((c) => (
            <Link
              key={c.id}
              href={`/channels/${c.id}`}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"
            >
              <div className="font-semibold">{c.name}</div>
              <div className="mt-1 text-sm text-white/50">
                {c.is_private ? '비공개' : '공개'}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
