"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    (async () => {
      const { data } = await supabase.auth.getSession();

      // ✅ /login에선 이 로직이 돌지 않으니 루프 없음
      if (data.session) router.replace("/channels");
      else router.replace("/login?next=/channels");
    })();
  }, [router]);

  return <div className="min-h-screen bg-black" />;
}
