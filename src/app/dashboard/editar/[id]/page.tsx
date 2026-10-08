"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { syncMercadoPagoSubscription } from "@/lib/sync-subscription";

type Plan = "free" | "pro" | "owner";

export default function EditarPresupuestoPage() {
  const { id } = useParams();
  const router = useRouter();

  const [cliente, setCliente] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [items, setItems] = useState([{ id: 1, nombre: "", precio: "" }]);
  const [itemIAObjetivoId, setItemIAObjetivoId] = useState<number | null>(null);
  const total = items.reduce((sum, item) => sum + (Number(item.precio) || 0), 0);
  const [moneda, setMoneda] = useState("ARS");
  const [plan, setPlan] = useState<Plan>("free");
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState<string | null>(null);
  const [detalleIA, setDetalleIA] = useState("");
  const [generandoIA, setGenerandoIA] = useState(false);
  const [errorIA, setErrorIA] = useState("");
  const [aiRemaining, setAiRemaining] = useState<number | null>(null);
  const [aiDailyLimit, setAiDailyLimit] = useState(20);
  const [cargandoPlan, setCargandoPlan] = useState(true);

  const suscripcionVencida = subscriptionExpiresAt !== null && new Date(subscriptionExpiresAt) < new Date();
  const esOwner = plan === "owner";
  const esProActivo = esOwner || (plan === "pro" && (subscriptionStatus === "active" || subscriptionStatus === "paused" || subscriptionStatus === "cancelled") && !suscripcionVencida);

  useEffect(() => {
    cargarPresupuesto();
    cargarPlan();
  }, []);

  useEffect(() => {
    if (esProActivo) cargarUsoIA();
    else setAiRemaining(null);
  }, [esProActivo]);

  async function cargarPlan() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    await syncMercadoPagoSubscription();
    const { data } = await supabase
      .from("empresa")
      .select("plan, subscription_status, subscription_expires_at")
      .eq("user_id", user.id)
      .single();

    setPlan(data?.plan === "owner" ? "owner" : data?.plan === "pro" ? "pro" : "free");
    setSubscriptionStatus(data?.subscription_status || null);
    setSubscriptionExpiresAt(data?.subscription_expires_at || null);
    setCargandoPlan(false);
  }

  async function cargarUsoIA() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const response = await fetch("/api/ia/presupuesto", {
        method: "GET",
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });
      if (!response.ok) return;
      const data = await response.json() as { dailyLimit?: number; remaining?: number };
      if (typeof data.dailyLimit === "number") setAiDailyLimit(data.dailyLimit);
      if (typeof data.remaining === "number") setAiRemaining(data.remaining);
    } catch (error) {
      console.error("No se pudo cargar el uso de IA:", error);
    }
  }

  async function generarDescripcionIA() {
    setErrorIA("");
    if (!esProActivo) {
      router.push("/dashboard/planes");
      return;
    }
    if (!esOwner && aiRemaining === 0) {
      setErrorIA(`Llegaste al límite de ${aiDailyLimit} generaciones con IA de hoy. Podés volver a usarla mañana.`);
      return;
    }
    if (detalleIA.trim().length < 8) {
      setErrorIA("Contanos un poco más sobre el trabajo que querés describir.");
      return;
    }

    setGenerandoIA(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Tu sesión venció. Volvé a iniciar sesión.");
      const response = await fetch("/api/ia/presupuesto", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ detalle: detalleIA }),
      });
      const data = await response.json() as { descripcion?: string; mensaje?: string; dailyLimit?: number; remaining?: number };
      if (typeof data.dailyLimit === "number") setAiDailyLimit(data.dailyLimit);
      if (typeof data.remaining === "number") setAiRemaining(data.remaining);
      if (!response.ok || !data.descripcion) throw new Error(data.mensaje || "No pudimos generar la descripción.");
      setDescripcion(data.descripcion);
      setDetalleIA("");
      if (itemIAObjetivoId !== null) {
        setItems((actuales) =>
          actuales.map((item) =>
            item.id === itemIAObjetivoId
              ? { ...item, nombre: data.descripcion! }
              : item
          )
        );
      }
    } catch (error) {
      setErrorIA(error instanceof Error ? error.message : "No pudimos generar la descripción. Intentá nuevamente.");
    } finally {
      setGenerandoIA(false);
    }
  }

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

    const itemsIniciales = itemsGuardados.length
      ? itemsGuardados
      : [{ id: 1, nombre: "", precio: String(data.precio ?? 0) }];

    setDescripcion(descripcionBase);
    setItems(itemsIniciales);
    setItemIAObjetivoId(null);
    setMoneda(monedaGuardada);
  }

  async function actualizarPresupuesto(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const itemsParaGuardar =
      items.length === 1 && !items[0].nombre.trim() && descripcion.trim()
        ? [{ ...items[0], nombre: descripcion.trim() }]
        : items;

    if (itemsParaGuardar.length === 0 || itemsParaGuardar.some((item) => !item.nombre.trim() || item.precio === "" || !Number.isFinite(Number(item.precio)) || Number(item.precio) < 0)) {
      alert("Completá la descripción y el importe de todos los ítems.");
      return;
    }

    const descripcionCompleta = [
      descripcion.trim(),
      "Detalle de ítems:",
      ...itemsParaGuardar.map((item, index) => `${index + 1}. ${item.nombre.trim()} — ${moneda} ${Number(item.precio).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`),
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

          <section className={`mb-5 rounded-2xl border p-5 ${esProActivo ? "border-violet-200 bg-violet-50" : "border-slate-200 bg-white"}`}>
            {cargandoPlan ? (
              <div className="animate-pulse">
                <h2 className="font-bold text-slate-800">✨ Generar descripción con IA</h2>
                <p className="mt-1 text-sm text-slate-500">Verificando tu cuenta y disponibilidad...</p>
              </div>
            ) : <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-800">✨ Generar descripción con IA</h2>
                <p className="mt-1 text-sm text-slate-600">Describí el trabajo y la IA redactará un texto profesional. Podés editarlo antes de guardar.</p>
                {esProActivo && <p className="mt-2 text-xs font-medium text-violet-700">{esOwner ? "Generaciones con IA ilimitadas" : aiRemaining === null ? "Consultando cupo de IA..." : `Generaciones disponibles hoy: ${aiRemaining} / ${aiDailyLimit}`}</p>}
              </div>
              {!esProActivo && <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">Solo Pro</span>}
            </div>
            {esProActivo ? <>
              <textarea className="mt-4 min-h-24 w-full rounded-xl border border-violet-200 bg-white p-3" placeholder="Ej.: Cambio de pantalla, revisión de conectores y pruebas de funcionamiento." value={detalleIA} maxLength={800} onChange={(e) => setDetalleIA(e.target.value)} />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-slate-500">{detalleIA.length}/800 caracteres</span>
                <button type="button" onClick={generarDescripcionIA} disabled={generandoIA || (!esOwner && aiRemaining === 0)} className="rounded-xl bg-violet-600 px-4 py-2 font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300">{generandoIA ? "✨ Generando..." : !esOwner && aiRemaining === 0 ? "🔒 Límite diario alcanzado" : descripcion ? "✨ Generar / regenerar con IA" : "✨ Generar con IA"}</button>
              </div>
              {errorIA && <p className="mt-2 text-sm font-medium text-red-600">{errorIA}</p>}
            </> : <button type="button" onClick={() => router.push("/dashboard/planes")} className="mt-4 rounded-xl bg-slate-800 px-4 py-2 font-semibold text-white hover:bg-slate-900">🚀 Desbloquear con Pro</button>}
            </>}
          </section>

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
              onChange={(e) => {
                const valor = e.target.value;
                setDescripcion(valor);
                if (itemIAObjetivoId !== null) {
                  setItems((actuales) =>
                    actuales.map((item) =>
                      item.id === itemIAObjetivoId
                        ? { ...item, nombre: valor }
                        : item
                    )
                  );
                }
              }}
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
                <button
                  type="button"
                  onClick={() => {
                    const nuevoId = Math.max(0, ...items.map((item) => item.id)) + 1;
                    const descripcionActual = descripcion.trim();

                    setItems((actuales) => {
                      if (!descripcionActual) {
                        return [...actuales, { id: nuevoId, nombre: "", precio: "" }];
                      }

                      const primerItemLibre = actuales.find((item) => !item.nombre.trim());
                      if (primerItemLibre) {
                        return [
                          ...actuales.map((item) =>
                            item.id === primerItemLibre.id
                              ? { ...item, nombre: descripcionActual }
                              : item
                          ),
                          { id: nuevoId, nombre: "", precio: "" },
                        ];
                      }

                      return [
                        ...actuales,
                        { id: nuevoId, nombre: "", precio: "" },
                      ];
                    });

                    setDescripcion("");
                    setItemIAObjetivoId(nuevoId);
                  }}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                >
                  + Agregar ítem
                </button>
              </div>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-1 gap-3 rounded-lg border bg-white p-3 sm:grid-cols-[1fr_150px_auto]">
                    <input className="w-full rounded-lg border p-3" placeholder={`Descripción del ítem ${index + 1}`} aria-label={`Descripción del ítem ${index + 1}`} value={item.nombre} onChange={(e) => {
                      const valor = e.target.value;
                      setItems((actuales) => actuales.map((actual) => actual.id === item.id ? { ...actual, nombre: valor } : actual));
                      if (item.id === itemIAObjetivoId) setDescripcion(valor);
                    }} required />
                    <input type="number" min="0" step="0.01" className="w-full rounded-lg border p-3" placeholder="Importe" aria-label={`Importe del ítem ${index + 1}`} value={item.precio} onChange={(e) => setItems((actuales) => actuales.map((actual) => actual.id === item.id ? { ...actual, precio: e.target.value } : actual))} required />
                    <button
                      type="button"
                      onClick={() => {
                        if (items.length <= 1) return;
                        setItems((actuales) => actuales.filter((actual) => actual.id !== item.id));
                        if (item.id === itemIAObjetivoId) {
                          setItemIAObjetivoId(null);
                          setDescripcion("");
                        }
                      }}
                      className="rounded-lg border border-red-200 px-3 py-2 text-red-600 hover:bg-red-50"
                    >
                      Eliminar
                    </button>
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