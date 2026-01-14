// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  // 기본 응답(그대로 통과)
  let response = NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // ✅ @supabase/ssr 방식: cookies는 getAll/setAll
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies) {
        // response에 쿠키 반영
        cookies.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const pathname = request.nextUrl.pathname;

  // ---- 보호할 경로들 ----
  const isAdmin = pathname.startsWith('/admin');
  const isChannels = pathname.startsWith('/channels');

  // 현재 로그인 유저 확인 (쿠키 기반)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 로그인 필요 페이지인데 로그인 안돼있으면 /login으로
  if ((isAdmin || isChannels) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ✅ 여기서 response 반환해야 setAll로 반영된 쿠키가 적용됩니다
  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/channels/:path*'],
};
