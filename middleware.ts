import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const path = req.nextUrl.pathname;

  // ✅ 1) 홈(/)은 항상 channels로 보내기 (로그인 여부에 따라)
  if (path === "/") {
    const url = req.nextUrl.clone();
    if (user) url.pathname = "/channels";
    else {
      url.pathname = "/login";
      url.searchParams.set("next", "/channels");
    }
    return NextResponse.redirect(url);
  }

  // ✅ 2) 보호 라우트: channels/admin
  const isProtected = path.startsWith("/channels") || path.startsWith("/admin");
  if (isProtected && !user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/", "/channels/:path*", "/admin/:path*"],
};
