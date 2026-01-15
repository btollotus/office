"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      // ✅ 홈(/)에서는 "리다이렉트"를 하지 않는다 (루프 방지)
      setChecking(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      {checking ? "CHECKING SESSION ..." : ""}
    </div>
  );
}
