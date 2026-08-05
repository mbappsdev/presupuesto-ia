"use client";
import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function NuevoPresupuestoPage() {
  const router = useRouter();
  const [cliente, setCliente] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");

  async function crearPresupuesto(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    alert("No hay usuario conectado");
    return;
  }

  const { error } = await supabase
    .from("presupuestos")
    .insert({
      user_id: user.id,
      cliente,
      empresa,
      descripcion,
      precio: Number(precio),
    });

  if (error) {
  console.error(error);
  alert(error.message);
  return;
}


  alert("Presupuesto guardado correctamente");

  router.push("/dashboard");
}

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow">

        <h1 className="text-3xl font-bold mb-6">
          Nuevo presupuesto 📄
        </h1>

        <form onSubmit={crearPresupuesto}>

          <input
            className="border p-3 rounded-lg w-full mb-4"
            placeholder="Cliente"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
          />

          <input
            className="border p-3 rounded-lg w-full mb-4"
            placeholder="Empresa"
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
          />

          <textarea
            className="border p-3 rounded-lg w-full mb-4"
            placeholder="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />

          <input
            className="border p-3 rounded-lg w-full mb-6"
            placeholder="Precio"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
          />

          <button
            className="bg-blue-600 text-white px-6 py-3 rounded-xl w-full"
            type="submit"
          >
            Generar presupuesto
          </button>

        </form>

      </div>
    </main>
  );
}