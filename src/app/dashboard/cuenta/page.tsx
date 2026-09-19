"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

export default function CuentaPage() {
  const router = useRouter();
  const [emailActual, setEmailActual] = useState("");
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarUsuario() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setEmailActual(user.email ?? "");
      setCargando(false);
    }

    void cargarUsuario();
  }, [router]);

  async function cambiarEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensaje("");
    setError("");

    const email = nuevoEmail.trim().toLowerCase();

    if (!email) {
      setError("Ingresá el nuevo correo electrónico.");
      return;
    }

    if (email === emailActual.toLowerCase()) {
      setError("El nuevo correo es igual al correo actual.");
      return;
    }

    setGuardando(true);

    try {
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("next", "/dashboard/cuenta");

      const { error: updateError } = await supabase.auth.updateUser(
        { email },
        { emailRedirectTo: callbackUrl.toString() }
      );

      if (updateError) {
        throw updateError;
      }

      setNuevoEmail("");
      setMensaje(
        "Solicitud enviada. Revisá el correo nuevo para confirmar el cambio. Supabase también puede pedir una confirmación en el correo actual."
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo cambiar el correo. Intentá nuevamente."
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />

      <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-800">👤 Mi cuenta</h1>
          <p className="mt-2 text-sm text-slate-600">
            Cambiá el correo de acceso sin perder tu empresa, plan ni presupuestos.
          </p>

          {cargando ? (
            <p className="mt-6 text-slate-500">Cargando cuenta...</p>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={cambiarEmail}>
              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  Correo actual
                </label>
                <input
                  value={emailActual}
                  disabled
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-100 p-3 text-slate-600"
                />
              </div>

              <div>
                <label
                  htmlFor="nuevo-email"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Nuevo correo
                </label>
                <input
                  id="nuevo-email"
                  type="email"
                  autoComplete="email"
                  value={nuevoEmail}
                  onChange={(event) => setNuevoEmail(event.target.value)}
                  placeholder="correo@tuempresa.com"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {mensaje && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                  {mensaje}
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={guardando}
                className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {guardando ? "Enviando confirmación..." : "Cambiar correo"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
