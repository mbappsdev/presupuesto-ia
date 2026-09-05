"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

export default function PagoProPage() {
  const router = useRouter();

  const [cargando, setCargando] = useState(false);
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
          Authorization: `Bearer ${session.access_token}`,
        },
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

  async function iniciarSuscripcion() {
    try {
      setCargando(true);
      setError("");

      // 1. Obtener usuario logueado
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("No se pudo identificar tu usuario.");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Tu sesión venció. Iniciá sesión nuevamente.");
        return;
      }

      // 2. Buscar la empresa del usuario
      const { data: empresa, error: empresaError } = await supabase
        .from("empresa")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (empresaError || !empresa) {
        console.error("Error obteniendo empresa:", empresaError);
        setError("No se pudo encontrar tu empresa.");
        return;
      }

      // 3. Crear la suscripción en Mercado Pago
      const respuesta = await fetch("/api/mercadopago/suscripcion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: "test_user_1051359909508570515@testuser.com",
        }),
      });

      const data = await respuesta.json();

      if (!respuesta.ok || !data.ok) {
        console.error("Error creando suscripción:", data);
        setError("No se pudo iniciar la suscripción.");
        return;
      }

      // 4. Verificar que Mercado Pago devolvió el checkout
      if (!data.initPoint) {
        setError("Mercado Pago no devolvió el enlace de pago.");
        return;
      }

      // 5. Ir al checkout de Mercado Pago
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

      <div className="max-w-xl mx-auto px-5 py-4">
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <div className="text-center">
            <div className="text-4xl mb-2">💳</div>

            <h1 className="text-3xl font-bold text-blue-700">
              PresupuestoIA Pro
            </h1>

            <p className="text-slate-600 mt-3">
              Estás a un paso de acceder al Plan Pro.
            </p>
          </div>

          <div className="mt-4 border rounded-xl p-4 bg-slate-50">
            <h2 className="font-bold text-lg mb-2">
              Resumen
            </h2>

            <p>🚀 Presupuestos ilimitados</p>
            <p>💱 Todas las monedas</p>
            <p>📄 PDF profesional</p>
            <p>🏢 Funciones avanzadas para tu empresa</p>

            <div className="border-t mt-2 pt-2">
              <p className="text-slate-500">
                Precio
              </p>

              <p className="text-2xl font-bold">
                $100 / mes
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
            <p className="font-semibold text-blue-800">
              🧪 Modo de prueba
            </p>

            <p className="text-sm text-blue-700 mt-1">
              Estamos probando la integración con Mercado Pago.
            </p>
          </div>

          {error && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          )}

          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard/pro")}
              disabled={cargando}
              className="w-full border border-slate-300 py-3 rounded-xl font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              ← Volver
            </button>

            <button
              type="button"
              onClick={iniciarSuscripcion}
              disabled={cargando}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {cargando ? "Conectando..." : "Continuar →"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
