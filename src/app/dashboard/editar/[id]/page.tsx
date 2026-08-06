"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";


export default function EditarPresupuestoPage() {
  const { id } = useParams();
  const router = useRouter();

  const [cliente, setCliente] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");

  useEffect(() => {
    cargarPresupuesto();
  }, []);

  async function cargarPresupuesto() {
    const { data, error } = await supabase
      .from("presupuestos")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      alert("Error al cargar el presupuesto");
      return;
    }

    setCliente(data.cliente);
    setEmpresa(data.empresa);
    setDescripcion(data.descripcion);
    setPrecio(data.precio.toString());
  }

  async function actualizarPresupuesto(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const { error } = await supabase
      .from("presupuestos")
      .update({
        cliente,
        empresa,
        descripcion,
        precio: Number(precio),
      })
      .eq("id", id);

    if (error) {
      alert("Error al actualizar");
      return;
    }

    alert("✅ Presupuesto actualizado");

    router.push("/dashboard");
  }

  return (
     <main className="min-h-screen bg-slate-100">
        
          <Navbar />
        
      <div className="max-w-4xl mx-auto p-8">
      <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow">

        <h1 className="text-3xl font-bold mb-6">
          Editar presupuesto
        </h1>

        <form
          onSubmit={actualizarPresupuesto}
          className="space-y-4"
        >
          <input
            className="w-full border p-3 rounded"
            placeholder="Cliente"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
          />

          <input
            className="w-full border p-3 rounded"
            placeholder="Empresa"
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
          />

          <textarea
            className="w-full border p-3 rounded"
            placeholder="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />

          <input
            type="number"
            className="w-full border p-3 rounded"
            placeholder="Precio"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
          />

          <button
            className="w-full bg-blue-600 text-white py-3 rounded-xl"
          >
            Guardar cambios
          </button>
        </form>

      </div>
    </main>
  );
}