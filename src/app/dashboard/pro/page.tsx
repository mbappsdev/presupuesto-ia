"use client";

import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function ProPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-5">

        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">

          <div className="text-4xl mb-2">
            🚀
          </div>

          <h1 className="text-3xl font-bold text-blue-700">
            Plan Pro
          </h1>

          <p className="text-lg text-slate-600 mt-3">
            Llevá PresupuestoIA al siguiente nivel.
          </p>

          <div className="mt-5 text-left max-w-md mx-auto space-y-3">

            <p>♾️ Presupuestos ilimitados</p>

            <p>💱 Todas las monedas</p>

            <p>📄 Generación de PDF profesional</p>

            <p>✏️ Edición de presupuestos</p>

            <p>🚀 Próximas funciones exclusivas</p>

          </div>

          <div className="mt-5">

            <p className="text-slate-500">
              Plan Pro
            </p>

            <p className="text-2xl font-bold mt-1">
              Precio próximamente
            </p>

          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard/pro/pago")}
            className="mt-5 bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700"
          >
            Continuar
          </button>

        </div>

      </div>
    </main>
  );
}