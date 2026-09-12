"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md"
      >
        <div className="mb-6 flex justify-center">
          <BrandLogo className="h-auto w-full max-w-[330px]" priority />
        </div>

        <h1 className="text-3xl font-bold text-center mb-6">
          Iniciar sesión
        </h1>

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
          required
        />

        <button
          className="bg-blue-600 text-white w-full py-3 rounded-lg"
          type="submit"
        >
          Entrar
        </button>

        {message && (
          <p className="mt-4 text-center text-sm text-red-600">
            {message}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-slate-600">
          ¿No tenés cuenta?{" "}
          <button
            type="button"
            onClick={() => router.push("/register")}
            className="font-semibold text-blue-700 hover:underline"
          >
            Crear cuenta
          </button>
        </p>
      </form>
    </main>
  );
}
