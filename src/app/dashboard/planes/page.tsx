"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { syncMercadoPagoSubscription } from "@/lib/sync-subscription";
import {
  fetchSubscriptionPricing,
  formatArs,
} from "@/lib/subscription-pricing-client";

export default function PlanesPage() {
  const router = useRouter();

  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [monthlyPrice, setMonthlyPrice] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarPlan() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      await syncMercadoPagoSubscription();

      const { data, error } = await supabase
        .from("empresa")
        .select("plan")
        .eq("user_id", user.id)
        .single();

      if (!error && data) {
        setPlan(data.plan === "pro" ? "pro" : "free");
      }

      try {
        const pricing = await fetchSubscriptionPricing();
        setMonthlyPrice(pricing.plans[0]?.price ?? null);
      } catch {
        setMonthlyPrice(null);
      }

      setCargando(false);
    }

    void cargarPlan();
  }, [router]);

  if (cargando) {
    return (
      <main className="min-h-screen bg-slate-100">
        <Navbar />
        <div className="flex items-center justify-center p-8">
          <p>Cargando planes...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
        <div className="mb-4 text-center">
          <h1 className="text-3xl font-bold text-slate-800">
            Planes de PresupuestoIA
          </h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Elegí el plan que mejor se adapte a tu negocio.
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
          {/* PLAN FREE */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="text-center">
              <h2 className="text-xl font-bold">🆓 Free</h2>
              <p className="mt-2 text-3xl font-bold">$0</p>
              <p className="text-sm text-slate-500">Para empezar</p>
            </div>

            <div className="mt-4 space-y-2 text-sm sm:text-base">
              <p>✅ 5 presupuestos por día</p>
              <p>✅ 50 presupuestos por mes</p>
              <p>✅ Diferentes monedas</p>
              <p>✅ Generación de PDF</p>
              <p>✅ Edición de presupuestos</p>
            </div>

            <button
              disabled
              className="mt-4 w-full rounded-xl bg-slate-200 py-2.5 text-sm font-medium text-slate-600 sm:text-base"
            >
              {plan === "free" ? "Plan actual" : "Plan gratuito"}
            </button>
          </div>

          {/* PLAN PRO */}
          <div className="relative rounded-2xl border-2 border-blue-600 bg-white p-5 shadow-md">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="whitespace-nowrap rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">
                ⭐ RECOMENDADO
              </span>
            </div>

            <div className="text-center">
              <h2 className="text-xl font-bold text-blue-700">🚀 Pro</h2>
              <p className="mt-2 text-3xl font-bold">
                {monthlyPrice ? `Desde ${formatArs(monthlyPrice)}` : "Ver precios"}
              </p>
              <p className="text-sm text-slate-500">
                Frecuencias mensual, trimestral, semestral y anual
              </p>
            </div>

            <div className="mt-4 space-y-2 text-sm sm:text-base">
              <p>✅ Presupuestos sin límites diarios</p>
              <p>✅ Sin límite diario</p>
              <p>✅ Todas las monedas</p>
              <p>✅ Generación de PDF</p>
              <p>✅ Edición de presupuestos</p>
              <p>🚀 Próximas funciones exclusivas</p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/dashboard/pro")}
              className="mt-4 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 sm:text-base"
            >
              {plan === "pro" ? "Plan actual" : "Ver precios Pro"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
