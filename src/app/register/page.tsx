"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setSuccess(false);
    setHasSession(false);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    const sessionCreated = Boolean(data.session);
    setHasSession(sessionCreated);
    setSuccess(true);
    setMessage(
      sessionCreated
        ? "Cuenta creada correctamente. Ya podés empezar a usar PresupuestoIA."
        : "Cuenta creada correctamente. Ya podés iniciar sesión."
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <form
        onSubmit={handleRegister}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md"
      >
        <div className="mb-6 flex justify-center">
          <BrandLogo className="h-auto w-full max-w-[330px]" priority />
        </div>

        <h1 className="text-3xl font-bold mb-2 text-center">
          Crear cuenta
        </h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          Empezá gratis con PresupuestoIA.
        </p>

        <input
          className="border p-3 rounded-lg w-full mb-4"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="border p-3 rounded-lg w-full mb-4"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />

        <button
          className="bg-blue-600 text-white w-full py-3 rounded-lg disabled:bg-slate-400"
          type="submit"
          disabled={loading}
        >
          {loading ? "Creando cuenta..." : "Registrarme"}
        </button>

        {message && (
          <div
            className={`mt-4 rounded-lg p-3 text-center text-sm ${
              success
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        {success && (
          <button
            type="button"
            onClick={() => router.push(hasSession ? "/dashboard" : "/login")}
            className="mt-4 w-full rounded-lg border border-blue-600 py-3 font-semibold text-blue-700 hover:bg-blue-50"
          >
            Continuar
          </button>
        )}

        <p className="mt-6 text-center text-sm text-slate-600">
          ¿Ya tenés cuenta?{" "}
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="font-semibold text-blue-700 hover:underline"
          >
            Iniciar sesión
          </button>
        </p>
      </form>
    </main>
  );
}
