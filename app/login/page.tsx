"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const supabase = useMemo(() => createClient(), []);

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const next = searchParams.get("next") || "/channels";

  useEffect(() => {
    // 이미 로그인 상태면 next로 이동
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace(next);
    });
  }, [router, next, supabase]);

  const submit = async () => {
    setLoading(true);
    setMsg(null);

    try {
      if (!email || !pw) {
        setMsg("이메일/비밀번호를 입력해주세요.");
        return;
      }

      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: pw,
        });
        if (error) {
          setMsg(error.message);
          return;
        }
        window.location.assign(next);
      } else {
        // ✅ 회원가입: 인증메일 클릭 후 /auth/callback 로 돌아오게 설정
        const origin = window.location.origin;

        const { error } = await supabase.auth.signUp({
          email,
          password: pw,
          options: {
            emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(
              next
            )}`,
          },
        });

        if (error) {
          setMsg(error.message);
          return;
        }

        setMsg("인증 메일을 보냈습니다. 메일에서 인증 후 다시 돌아오세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
      <div className="w-full max-w-md rounded-2xl bg-zinc-900/40 border border-zinc-800 p-8 shadow-xl">
        <div className="text-xs tracking-widest text-zinc-400 mb-2">OFFICE</div>
        <div className="text-3xl font-bold mb-2">
          {mode === "login" ? "로그인" : "회원가입"}
        </div>
        <div className="text-sm text-zinc-400 mb-6">
          이동 대상: <span className="text-zinc-200">{next}</span>
        </div>

        <div className="space-y-3">
          <input
            className="w-full rounded-xl bg-black/40 border border-zinc-700 px-4 py-3 outline-none focus:border-emerald-500"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <input
            className="w-full rounded-xl bg-black/40 border border-zinc-700 px-4 py-3 outline-none focus:border-emerald-500"
            placeholder="비밀번호"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />

          <button
            onClick={submit}
            disabled={loading}
            className="w-full rounded-xl bg-emerald-500 text-black font-bold py-3 disabled:opacity-60"
          >
            {loading ? "처리중..." : mode === "login" ? "로그인" : "회원가입"}
          </button>

          <button
            onClick={() => {
              setMsg(null);
              setMode((m) => (m === "login" ? "signup" : "login"));
            }}
            className="w-full rounded-xl bg-zinc-700/50 border border-zinc-600 py-3"
          >
            {mode === "login" ? "처음이신가요? 회원가입" : "이미 계정이 있나요? 로그인"}
          </button>

          {msg && (
            <div className="text-sm mt-2 text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
              {msg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  // ✅ useSearchParams 때문에 Suspense로 감싸기
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <LoginInner />
    </Suspense>
  );
}
