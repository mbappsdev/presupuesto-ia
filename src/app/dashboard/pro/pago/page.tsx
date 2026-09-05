"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import {
  fetchSubscriptionPricing,
  formatArs,
  type PublicSubscriptionPlan,
} from "@/lib/subscription-pricing-client";
import type { BillingPeriod } from "@/lib/subscription-plans";

const validPeriods: BillingPeriod[] = [
  "monthly",
  "quarterly",
  "semiannual",
  "annual",
];

function getPeriodFromUrl() {
  const value = new URLSearchParams(window.location.search).get("period");
  return validPeriods.includes(value as BillingPeriod)
    ? (value as BillingPeriod)
    : "monthly";
}

export default function PagoProPage() {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [cargandoPrecio, setCargandoPrecio] = useState(true);
  const [selectedPlan, setSelectedPlan] =
    useState<PublicSubscriptionPlan | null>(null);
  const [founderPrice, setFounderPrice] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const regresoDeMercadoPago =
      params.has("preapproval_id") ||
      params.has("status") ||
      params.has("external_reference");

    if (!regresoDeMercadoPago) return;

    async function sincronizarSuscripcion() {
      setCargando(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Tu sesión venció. Iniciá sesión nuevamente.");
        setCargando(false);
        return;
      }

      const response = await fetch("/api/mercadopago/suscripcion/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          subscriptionId: params.get("preapproval_id"),
        }),
      });
      const data = await response.json();

      if (response.ok && data.ok) {
        router.replace("/dashboard/planes");
        router.refresh();
        return;
      }

      setError(
        data.mensaje ?? "No pudimos confirmar todavía el estado del pago."
      );
      setCargando(false);
    }

    void sincronizarSuscripcion();
  }, [router]);

  useEffect(() => {
    const period = getPeriodFromUrl();

    fetchSubscriptionPricing()
      .then((pricing) => {
        setSelectedPlan(
          pricing.plans.find((plan) => plan.id === period) ?? pricing.plans[0]
        );
        setFounderPrice(pricing.phase === "founder");
      })
      .catch(() => setError("No pudimos cargar el precio seleccionado."))
      .finally(() => setCargandoPrecio(false));
  }, []);

  async function iniciarSuscripcion() {
    if (!selectedPlan) return;

    try {
      setCargando(true);
      setError("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Tu sesión venció. Iniciá sesión nuevamente.");
        return;
      }

      const respuesta = await fetch("/api/mercadopago/suscripcion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          period: selectedPlan.id,
        }),
      });

      const data = await respuesta.json();

      if (!respuesta.ok || !data.ok) {
        setError(data.mensaje ?? "No se pudo iniciar la suscripción.");
        return;
      }

      if (!data.initPoint) {
        setError("Mercado Pago no devolvió el enlace de pago.");
        return;
      }

      window.location.href = data.initPoint;
    } catch (error) {
      console.error("Error iniciando suscripción:", error);
      setError("Ocurrió un error al iniciar el pago.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />

      <div className="mx-auto max-w-xl px-5 py-8">
        <div className="rounded-2xl bg-white p-6 shadow-lg">
          <div className="text-center">
            <div className="text-4xl">💳</div>
            <h1 className="mt-2 text-3xl font-bold text-blue-700">
              Confirmá tu Plan Pro
            </h1>
            <p className="mt-2 text-slate-600">
              El cobro se procesa de forma segura en Mercado Pago.
            </p>
          </div>

          {cargandoPrecio ? (
            <p className="mt-6 text-center text-slate-500">Cargando precio...</p>
          ) : (
            selectedPlan && (
              <div className="mt-6 rounded-xl border bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-slate-800">
                      Pro {selectedPlan.label}
                    </p>
                    <p className="text-sm text-slate-500">
                      Renovación cada {selectedPlan.shortLabel.toLowerCase()}
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">
                    {formatArs(selectedPlan.price)}
                  </p>
                </div>

                {founderPrice && (
                  <p className="mt-3 text-sm font-semibold text-amber-800">
                    Incluye tu precio fundador durante los primeros 12 meses.
                  </p>
                )}

                <div className="mt-4 space-y-2 border-t pt-4 text-sm text-slate-700">
                  <p>✅ Presupuestos sin límites diarios</p>
                  <p>✅ Todas las monedas</p>
                  <p>✅ PDF profesional y edición</p>
                </div>
              </div>
            )
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <p className="mt-4 text-xs text-slate-500">
            Al continuar aceptás la renovación automática. Podés cancelar cuando
            quieras antes del próximo cobro.
          </p>

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard/pro")}
              disabled={cargando}
              className="w-full rounded-xl border border-slate-300 py-3 font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              ← Volver
            </button>

            <button
              type="button"
              onClick={iniciarSuscripcion}
              disabled={cargando || cargandoPrecio || !selectedPlan}
              className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {cargando ? "Conectando..." : "Pagar con Mercado Pago"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
