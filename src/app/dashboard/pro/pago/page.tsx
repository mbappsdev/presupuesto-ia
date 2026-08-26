"use client";

import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function PagoProPage() {
  const router = useRouter();

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
                Próximamente
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
            <p className="font-semibold text-blue-800">
                🧪 Modo de prueba
            </p>

            <p className="text-sm text-blue-700 mt-1">
                Esta pantalla es una simulación. No se realizará ningún cobro.
            </p>
          </div>

          <div className="mt-3 flex gap-3">
            <button
                type="button"
                onClick={() => router.push("/dashboard/pro")}
                className="w-full border border-slate-300 py-3 rounded-xl font-semibold hover:bg-slate-50"
            >
                ← Volver
            </button>

            <button
                type="button"
                onClick={() =>
                    alert("💳 El pago real se habilitará más adelante.")
                }
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700"
            >
                Continuar →
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}