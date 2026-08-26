"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

export default function PlanesPage() {
  const router = useRouter();

  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarPlan();
  }, []);

  async function cargarPlan() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("empresa")
      .select("plan")
      .eq("user_id", user.id)
      .single();

    if (!error && data) {
      setPlan(data.plan === "pro" ? "pro" : "free");
    }

    setCargando(false);
  }

  if (cargando) {
    return (
      <main className="min-h-screen bg-slate-100">
        <Navbar />

        <div className="flex justify-center items-center p-10">
          <p>Cargando planes...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-6">

        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-slate-800">
            Planes de PresupuestoIA
          </h1>

          <p className="text-slate-600 mt-3">
            Elegí el plan que mejor se adapte a tu negocio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">

          {/* PLAN FREE */}

          <div className="bg-white rounded-2xl shadow p-6 border">

            <div className="text-center">
              <h2 className="text-2xl font-bold">
                🆓 Free
              </h2>

              <p className="text-4xl font-bold mt-4">
                $0
              </p>

              <p className="text-slate-500">
                Para empezar
              </p>
            </div>

            <div className="mt-5 space-y-3">

              <p>✅ 5 presupuestos por día</p>

              <p>✅ 50 presupuestos por mes</p>

              <p>✅ Diferentes monedas</p>

              <p>✅ Generación de PDF</p>

              <p>✅ Edición de presupuestos</p>

            </div>

            <button
              disabled
              className="mt-5 w-full bg-slate-200 text-slate-600 py-3 rounded-xl"
            >
              {plan === "free"
                ? "Plan actual"
                : "Plan gratuito"}
            </button>

          </div>


          {/* PLAN PRO */}

          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-600 relative">

            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                ⭐ RECOMENDADO
              </span>
            </div>

            <div className="text-center">

              <h2 className="text-2xl font-bold text-blue-700">
                🚀 Pro
              </h2>

              <p className="text-3xl font-bold mt-3">
                Próximamente
              </p>

              <p className="text-slate-500">
                Para negocios que necesitan más
              </p>

            </div>

            <div className="mt-5 space-y-3">

              <p>✅ Presupuestos ilimitados</p>

              <p>✅ Sin límite diario</p>

              <p>✅ Sin límite mensual</p>

              <p>✅ Todas las monedas</p>

              <p>✅ Generación de PDF</p>

              <p>✅ Edición de presupuestos</p>

              <p>🚀 Próximas funciones exclusivas</p>

            </div>

            <button
              type="button"
              onClick={() => router.push("/dashboard/pro")}
              className="mt-5 w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700"
            >
              Plan Pro
            </button>

          </div>

        </div>

      </div>
    </main>
  );
}