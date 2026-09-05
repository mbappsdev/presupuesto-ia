"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  fetchSubscriptionPricing,
  formatArs,
  type SubscriptionPricing,
} from "@/lib/subscription-pricing-client";

export default function ProPage() {
  const router = useRouter();
  const [pricing, setPricing] = useState<SubscriptionPricing | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSubscriptionPricing()
      .then(setPricing)
      .catch(() => setError("No pudimos cargar los precios. Intentá nuevamente."));
  }, []);

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />

      <div className="mx-auto max-w-6xl px-5 py-8">
        <div className="text-center">
          <div className="text-4xl">🚀</div>
          <h1 className="mt-2 text-3xl font-bold text-blue-700">
            PresupuestoIA Pro
          </h1>
          <p className="mt-2 text-slate-600">
            Elegí la frecuencia que mejor se adapte a tu negocio.
          </p>

          {pricing?.phase === "founder" && (
            <p className="mt-3 inline-block rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900">
              Precio fundador · quedan {pricing.founderRemaining} lugares
            </p>
          )}
        </div>

        {error && (
          <div className="mx-auto mt-6 max-w-xl rounded-xl border border-red-200 bg-red-50 p-4 text-center text-red-700">
            {error}
          </div>
        )}

        {!pricing && !error && (
          <p className="mt-8 text-center text-slate-500">Cargando precios...</p>
        )}

        {pricing && (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {pricing.plans.map((plan) => (
              <article
                key={plan.id}
                className={`relative rounded-2xl bg-white p-5 shadow-sm ${
                  plan.featured
                    ? "border-2 border-blue-600"
                    : "border border-slate-200"
                }`}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                    Mejor precio
                  </span>
                )}

                <h2 className="text-xl font-bold text-slate-800">{plan.label}</h2>
                <p className="mt-3 text-3xl font-bold text-blue-700">
                  {formatArs(plan.price)}
                </p>
                <p className="text-sm text-slate-500">
                  cada {plan.shortLabel.toLowerCase()}
                </p>

                {plan.months > 1 && (
                  <div className="mt-3 text-sm">
                    <p className="font-semibold text-emerald-700">
                      Ahorrás {plan.discount}%
                    </p>
                    <p className="text-slate-500">
                      Equivale a {formatArs(plan.monthlyEquivalent)}/mes
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() =>
                    router.push(`/dashboard/pro/pago?period=${plan.id}`)
                  }
                  className={`mt-5 w-full rounded-xl py-3 font-semibold text-white ${
                    plan.featured
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-slate-800 hover:bg-slate-900"
                  }`}
                >
                  Elegir {plan.label.toLowerCase()}
                </button>
              </article>
            ))}
          </div>
        )}

        <div className="mx-auto mt-8 max-w-2xl rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-800">Incluido en Pro</h2>
          <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
            <p>✅ Presupuestos sin límites diarios</p>
            <p>✅ Todas las monedas</p>
            <p>✅ PDF profesional</p>
            <p>✅ Edición de presupuestos</p>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Sujeto a una política de uso razonable. Podés gestionar o cancelar la
            suscripción desde Mercado Pago.
          </p>
        </div>
      </div>
    </main>
  );
}
