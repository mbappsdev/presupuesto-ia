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
  const [items, setItems] = useState([{ id: 1, nombre: "", precio: "" }]);
  const total = items.reduce((sum, item) => sum + (Number(item.precio) || 0), 0);
  const [moneda, setMoneda] = useState("ARS");

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
    const monedaGuardada = data.moneda || "ARS";
    const partesDescripcion = (data.descripcion || "").split(/\n\s*\nDetalle de ítems:\n/);
    const descripcionBase = partesDescripcion[0] || "";
    const detalleGuardado = partesDescripcion.length > 1 ? partesDescripcion.slice(1).join("\n\nDetalle de ítems:\n") : "";
    const itemsGuardados = detalleGuardado.split("\n").map((linea: string, index: number) => {
      const match = linea.match(/^\d+\.\s*(.*?)\s+—\s*[A-Z]{3}\s+([\d.,]+)$/);
      if (!match) return null;
      const importe = Number(match[2].replace(/\./g, "").replace(",", "."));
      if (!Number.isFinite(importe)) return null;
      return { id: index + 1, nombre: match[1], precio: String(importe) };
    }).filter((item: { id: number; nombre: string; precio: string } | null): item is { id: number; nombre: string; precio: string } => item !== null);

    setDescripcion(descripcionBase);
    setItems(itemsGuardados.length ? itemsGuardados : [{ id: 1, nombre: "Trabajo o servicio presupuestado", precio: String(data.precio ?? 0) }]);
    setMoneda(monedaGuardada);
  }

  async function actualizarPresupuesto(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (items.length === 0 || items.some((item) => !item.nombre.trim() || item.precio === "" || !Number.isFinite(Number(item.precio)) || Number(item.precio) < 0)) {
      alert("Completá la descripción y el importe de todos los ítems.");
      return;
    }

    const descripcionCompleta = [
      descripcion.trim(),
      "Detalle de ítems:",
      ...items.map((item, index) => `${index + 1}. ${item.nombre.trim()} — ${moneda} ${Number(item.precio).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`),
    ].filter(Boolean).join("\n\n");

    const { error } = await supabase
      .from("presupuestos")
      .update({
        cliente,
        empresa,
        descripcion: descripcionCompleta,
        precio: total,
        moneda,
      })
      .eq("id", id);

    if (error) {
      alert("Error al actualizar el presupuesto");
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

<div>
              <label className="mb-2 block font-semibold text-slate-700">Moneda del presupuesto</label>
              <select className="w-full border p-3 rounded" value={moneda} onChange={(e) => setMoneda(e.target.value)}>
                <option value="ARS">🇦🇷 ARS - Peso argentino</option>
                <option value="USD">🇺🇸 USD - Dólar estadounidense</option>
                <option value="EUR">🇪🇺 EUR - Euro</option>
                <option value="BRL">🇧🇷 BRL - Real brasileño</option>
                <option value="CLP">🇨🇱 CLP - Peso chileno</option>
                <option value="UYU">🇺🇾 UYU - Peso uruguayo</option>
              </select>
            </div>

            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="font-bold text-slate-800">Ítems del presupuesto</h2><p className="text-sm text-slate-500">Agregá o quitá trabajos, productos y repuestos.</p></div>
                <button type="button" onClick={() => setItems((actuales) => [...actuales, { id: Math.max(0, ...actuales.map((item) => item.id)) + 1, nombre: "", precio: "" }])} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">+ Agregar ítem</button>
              </div>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-1 gap-3 rounded-lg border bg-white p-3 sm:grid-cols-[1fr_150px_auto]">
                    <input className="w-full rounded-lg border p-3" placeholder={`Descripción del ítem ${index + 1}`} aria-label={`Descripción del ítem ${index + 1}`} value={item.nombre} onChange={(e) => setItems((actuales) => actuales.map((actual) => actual.id === item.id ? { ...actual, nombre: e.target.value } : actual))} required />
                    <input type="number" min="0" step="0.01" className="w-full rounded-lg border p-3" placeholder="Importe" aria-label={`Importe del ítem ${index + 1}`} value={item.precio} onChange={(e) => setItems((actuales) => actuales.map((actual) => actual.id === item.id ? { ...actual, precio: e.target.value } : actual))} required />
                    <button type="button" onClick={() => setItems((actuales) => actuales.filter((actual) => actual.id !== item.id))} disabled={items.length === 1} className="rounded-lg border border-red-200 px-3 py-2 text-red-600 hover:bg-red-50 disabled:opacity-40">Eliminar</button>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between gap-3 border-t pt-4"><span className="font-semibold text-slate-700">Total del presupuesto</span><span className="text-xl font-bold text-blue-700">{moneda} {total.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            </section>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700"
            >
              Guardar cambios
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}