"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const linkClass = (href: string) =>
    `px-3 py-2 rounded-lg transition ${
      pathname === href
        ? "bg-blue-600 text-white"
        : "text-slate-700 hover:bg-slate-200"
    }`;

  return (
    <nav className="bg-white shadow mb-8">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl font-bold text-blue-600">
          PresupuestoIA
        </h1>

        <div className="flex gap-2">
          <Link href="/dashboard" className={linkClass("/dashboard")}>
            🏠 Inicio
          </Link>

          <Link href="/dashboard/nuevo" className={linkClass("/dashboard/nuevo")}>
            ➕ Nuevo
          </Link>

          <button
            onClick={cerrarSesion}
            className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            🚪 Salir
          </button>
        </div>
      </div>
    </nav>
  );
}