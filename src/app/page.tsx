"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  const [hasSession, setHasSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    async function verificarSesion() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setHasSession(Boolean(session));
      setCheckingSession(false);
    }

    verificarSesion();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-lg font-bold tracking-tight">PresupuestoIA</p>
            <p className="text-xs text-slate-400">Presupuestos profesionales, más rápido.</p>
          </div>

          <div className="flex items-center gap-3">
            {!checkingSession && hasSession ? (
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-200"
              >
                Ir a mi panel
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900 sm:inline-flex"
                >
                  Iniciar sesión
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/register")}
                  className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-200"
                >
                  Crear cuenta gratis
                </button>
              </>
            )}
          </div>
        </header>

        <div className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <div className="inline-flex rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1 text-sm font-medium text-violet-200">
              ✨ IA para redactar presupuestos profesionales
            </div>

            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Creá presupuestos claros y profesionales en segundos.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              PresupuestoIA te ayuda a generar, editar y descargar presupuestos en PDF para tu negocio. Ahorrá tiempo, mantené una presentación profesional y usá IA para mejorar la redacción cuando lo necesites.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {!checkingSession && hasSession ? (
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="rounded-xl bg-blue-600 px-6 py-3 text-center font-semibold text-white hover:bg-blue-500"
                >
                  Ir a mi panel
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => router.push("/register")}
                    className="rounded-xl bg-blue-600 px-6 py-3 text-center font-semibold text-white hover:bg-blue-500"
                  >
                    Empezar gratis
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="rounded-xl border border-slate-700 px-6 py-3 text-center font-semibold text-white hover:bg-slate-900"
                  >
                    Ya tengo cuenta
                  </button>
                </>
              )}
            </div>

            <p className="mt-4 text-sm text-slate-400">
              Plan Free disponible · Sin tarjeta para empezar
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-blue-950/30">
            <div className="rounded-2xl bg-white p-6 text-slate-900">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <p className="text-sm font-semibold text-blue-700">PresupuestoIA</p>
                  <p className="text-xs text-slate-500">Presupuesto Nº 000128</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Listo para enviar
                </span>
              </div>

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Cliente</p>
                <p className="mt-1 font-semibold">Cliente Ejemplo</p>
              </div>

              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-violet-700">
                  <span>✨</span>
                  <span>Descripción mejorada con IA</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Servicio profesional con detalle claro del trabajo, alcance y condiciones informadas por el usuario.
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">
                <span className="text-sm text-slate-500">Total</span>
                <span className="text-xl font-bold">ARS 150.000</span>
              </div>
            </div>
          </div>
        </div>

        <section className="pb-16">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="text-2xl">📄</div>
              <h2 className="mt-3 font-bold">PDF profesional</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Generá archivos listos para enviar a tus clientes.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="text-2xl">✨</div>
              <h2 className="mt-3 font-bold">Redacción con IA</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                En Pro, transformá una idea breve en una descripción clara y profesional.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="text-2xl">💱</div>
              <h2 className="mt-3 font-bold">Varias monedas</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Trabajá con ARS, USD, EUR, BRL, CLP y UYU.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="text-2xl">✏️</div>
              <h2 className="mt-3 font-bold">Editable</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Guardá, revisá y modificá tus presupuestos cuando lo necesites.
              </p>
            </article>
          </div>
        </section>

        <section className="mb-12 rounded-3xl border border-blue-500/20 bg-blue-500/10 p-8 text-center">
          <h2 className="text-2xl font-bold">Empezá con el Plan Free</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-300">
            Creá hasta 5 presupuestos por día y 50 por mes. Cuando necesites más capacidad y generación con IA, podés pasar a Pro.
          </p>
          <button
            type="button"
            onClick={() => router.push(hasSession ? "/dashboard" : "/register")}
            className="mt-6 rounded-xl bg-white px-6 py-3 font-semibold text-slate-950 hover:bg-slate-200"
          >
            {hasSession ? "Ir a mi panel" : "Crear cuenta gratis"}
          </button>
        </section>

        <footer className="border-t border-slate-800 py-6 text-center text-sm text-slate-500">
          PresupuestoIA · Creá presupuestos profesionales de forma simple.
        </footer>
      </section>
    </main>
  );
}
