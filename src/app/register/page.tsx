"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Usuario creado. Revisa tu email para confirmar.");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <form
        onSubmit={handleRegister}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md"
      >
        <h1 className="text-3xl font-bold mb-6 text-center">
          Crear cuenta
        </h1>

        <input
          className="border p-3 rounded-lg w-full mb-4"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="border p-3 rounded-lg w-full mb-4"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="bg-blue-600 text-white w-full py-3 rounded-lg"
          type="submit"
        >
          Registrarme
        </button>

        {message && (
          <p className="mt-4 text-center text-sm">
            {message}
          </p>
        )}
      </form>
    </main>
  );
}