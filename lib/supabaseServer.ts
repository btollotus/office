// lib/supabaseServer.ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function createSupabaseServer() {
  const cookieStore = await cookies(); // ✅ 중요: await

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        // Server Component에서는 set/remove가 "실제 응답"에 반영되지 않을 수 있음
        // (미들웨어/라우트핸들러에서 처리하는 게 정석)
        // 그래도 타입상 필요해서 안전하게 try 처리
        try {
          cookieStore.set({ name, value, ...options });
        } catch {}
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch {}
      },
    },
  });
}
