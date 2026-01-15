"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/channels");
      else router.replace("/login?next=/channels");
    });
  }, [router]);

  return <div className="min-h-screen bg-black" />;
}
