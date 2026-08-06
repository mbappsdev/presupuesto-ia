"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

export default function DashboardPage() {
  const router = useRouter();
  const [presupuestos, setPresupuestos] = useState<any[]>([]);
  useEffect(() => {
  cargarPresupuestos();
}, []);

async function cargarPresupuestos() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data, error } = await supabase
    .from("presupuestos")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

console.log("ID del usuario conectado:", user.id);
console.log("Datos:", data);
console.log("Error:", error);

if (!error && data) {
 setPresupuestos(data);
}
}
  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }
async function eliminarPresupuesto(id: string) {
  const confirmar = window.confirm(
    "¿Seguro que deseas eliminar este presupuesto?"
  );

  if (!confirmar) return;

  const { error } = await supabase
    .from("presupuestos")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Error al eliminar el presupuesto");
    return;
  }

  alert("✅ Presupuesto eliminado");

  cargarPresupuestos();
}
  return (
    <main className="min-h-screen bg-slate-100">

  <Navbar />

    <div className="max-w-4xl mx-auto p-8">
 
        <h1 className="text-4xl font-bold mb-4">
          Bienvenido a PresupuestoIA 🚀
        </h1>

        <p className="text-lg mb-8">
          Genera presupuestos profesionales en segundos.
        </p>

        <button
          onClick={() => router.push("/dashboard/nuevo")}
  className="bg-blue-600 text-white px-6 py-3 rounded-xl"
>
  Crear presupuesto
        </button>
      <div className="mt-8">
  <h2 className="text-2xl font-bold mb-4">
    Mis presupuestos
  </h2>

  {presupuestos.length === 0 ? (
    <p>No hay presupuestos todavía.</p>
  ) : (
    presupuestos.map((p) => (
      <div
        key={p.id}
        className="border rounded-xl p-4 mb-4 bg-white shadow"
      >
        <h3 className="font-bold text-lg">
          {p.cliente}
        </h3>

        <p>{p.empresa}</p>

        <p>{p.descripcion}</p>

        <p className="font-bold mt-2">
          ${Number(p.precio).toLocaleString("es-AR")}
        </p>
        <div className="flex gap-2 mt-4">
  <button
    onClick={() => router.push(`/dashboard/editar/${p.id}`)}
    className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
  >
    ✏️ Editar
  </button>

  <button
    onClick={() => eliminarPresupuesto(p.id)}
    className="bg-red-600 text-white px-4 py-2 rounded-lg"
  >
    🗑️ Eliminar
  </button>
</div>
</div>
       
    ))
  )}
</div>
      </div>

    </main>
  );
}