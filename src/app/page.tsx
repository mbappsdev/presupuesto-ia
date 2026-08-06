"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    async function verificarSesion() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }

    verificarSesion();
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-lg">Cargando...</p>
    </main>
  );
}