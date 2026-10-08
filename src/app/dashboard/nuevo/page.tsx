"use client";
import { useState, useEffect, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { syncMercadoPagoSubscription } from "@/lib/sync-subscription";

type Plan = "free" | "pro" | "owner";

export default function NuevoPresupuestoPage() {
  const router = useRouter();
  const [cliente, setCliente] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [items, setItems] = useState([{ id: 1, nombre: "", precio: "" }]);
  const total = items.reduce((sum, item) => sum + (Number(item.precio) || 0), 0);
  const [moneda, setMoneda] = useState("ARS");

  const [plan, setPlan] = useState<Plan>("free");
  const [presupuestosHoy, setPresupuestosHoy] = useState(0);
  const [presupuestosMes, setPresupuestosMes] = useState(0);

  const [subscriptionStatus, setSubscriptionStatus] =
    useState<string | null>(null);
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] =
    useState<string | null>(null);
  const [cargandoPlan, setCargandoPlan] = useState(true);

  const [detalleIA, setDetalleIA] = useState("");
  const [generandoIA, setGenerandoIA] = useState(false);
  const [errorIA, setErrorIA] = useState("");
  const [aiRemaining, setAiRemaining] = useState<number | null>(null);
  const [aiDailyLimit, setAiDailyLimit] = useState(20);

  const suscripcionVencida =
    subscriptionExpiresAt !== null &&
    new Date(subscriptionExpiresAt) < new Date();

  const esOwner = plan === "owner";
  const esProActivo =
    esOwner ||
    (plan === "pro" &&
      (subscriptionStatus === "active" ||
        subscriptionStatus === "paused" ||
        subscriptionStatus === "cancelled") &&
      !suscripcionVencida);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (esProActivo) {
      cargarUsoIA();
    } else {
      setAiRemaining(null);
    }
  }, [esProActivo]);

  async function cargarDatos() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    await syncMercadoPagoSubscription();

    const { data: empresaData } = await supabase
      .from("empresa")
      .select("plan, subscription_status, subscription_expires_at")
      .eq("user_id", user.id)
      .single();

    setPlan(
      empresaData?.plan === "owner"
        ? "owner"
        : empresaData?.plan === "pro"
          ? "pro"
          : "free"
    );
    setSubscriptionStatus(empresaData?.subscription_status || null);
    setSubscriptionExpiresAt(empresaData?.subscription_expires_at || null);
    setCargandoPlan(false);

    const { data: presupuestosData } = await supabase
      .from("presupuestos")
      .select("created_at")
      .eq("user_id", user.id);

    const ahora = new Date();
    const inicioHoy = new Date(ahora);
    inicioHoy.setHours(0, 0, 0, 0);

    const inicioMes = new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      1
    );

    const cantidadHoy = (presupuestosData || []).filter((p) => {
      const fecha = new Date(p.created_at);
      return fecha >= inicioHoy;
    }).length;

    const cantidadMes = (presupuestosData || []).filter((p) => {
      const fecha = new Date(p.created_at);
      return fecha >= inicioMes;
    }).length;

    setPresupuestosHoy(cantidadHoy);
    setPresupuestosMes(cantidadMes);
  }

  async function cargarUsoIA() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const response = await fetch("/api/ia/presupuesto", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
      });

      if (!response.ok) return;

      const data = (await response.json()) as {
        dailyLimit?: number;
        remaining?: number;
      };

      if (typeof data.dailyLimit === "number") {
        setAiDailyLimit(data.dailyLimit);
      }

      if (typeof data.remaining === "number") {
        setAiRemaining(data.remaining);
      }
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
      setErrorIA(
        `Llegaste al límite de ${aiDailyLimit} generaciones con IA de hoy. Podés volver a usarla mañana.`
      );
      return;
    }

    if (detalleIA.trim().length < 8) {
      setErrorIA("Contanos un poco más sobre lo que vas a presupuestar.");
      return;
    }

    setGenerandoIA(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Tu sesión venció. Volvé a iniciar sesión.");
      }

      const response = await fetch("/api/ia/presupuesto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ detalle: detalleIA }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        descripcion?: string;
        mensaje?: string;
        dailyLimit?: number;
        remaining?: number;
      };

      if (typeof data.dailyLimit === "number") {
        setAiDailyLimit(data.dailyLimit);
      }

      if (typeof data.remaining === "number") {
        setAiRemaining(data.remaining);
      }

      if (!response.ok || !data.descripcion) {
        throw new Error(data.mensaje || "No pudimos generar la descripción.");
      }

      setDescripcion(data.descripcion);
    } catch (error) {
      setErrorIA(
        error instanceof Error
          ? error.message
          : "No pudimos generar la descripción. Intentá nuevamente."
      );
    } finally {
      setGenerandoIA(false);
    }
  }

  async function crearPresupuesto(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const itemsValidos = items.filter((item) => item.nombre.trim() && item.precio !== "" && Number(item.precio) >= 0);
    if (itemsValidos.length === 0) {
      alert("Agregá al menos un ítem con descripción e importe.");
      return;
    }
    if (itemsValidos.length !== items.length) {
      alert("Completá la descripción y el importe de todos los ítems, o eliminá los que no uses.");
      return;
    }

    const descripcionCompleta = [
      descripcion.trim(),
      "Detalle de ítems:",
      ...itemsValidos.map((item, index) => `${index + 1}. ${item.nombre.trim()} — ${moneda} ${Number(item.precio).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`),
    ].filter(Boolean).join("\n\n");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("No hay usuario conectado");
      return;
    }

    if (!esProActivo && presupuestosHoy >= 5) {
      alert("⚡ Llegaste al límite de 5 presupuestos diarios.");
      router.push("/dashboard/planes");
      return;
    }

    if (!esProActivo && presupuestosMes >= 50) {
      alert("📅 Llegaste al límite de 50 presupuestos mensuales.");
      router.push("/dashboard/planes");
      return;
    }

    const { data: ultimo } = await supabase
      .from("presupuestos")
      .select("numero")
      .eq("user_id", user.id)
      .order("numero", { ascending: false })
      .limit(1)
      .single();

    const nuevoNumero = ultimo ? ultimo.numero + 1 : 1;
    const { error } = await supabase
      .from("presupuestos")
      .insert({
        user_id: user.id,
        numero: nuevoNumero,
        cliente,
        empresa,
        descripcion: descripcionCompleta,
        precio: total,
        moneda,
      });

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    alert(
      `✅ Presupuesto Nº ${String(nuevoNumero).padStart(6, "0")} guardado correctamente`
    );

    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <Navbar />

      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Nuevo presupuesto 📄</h1>

        {!cargandoPlan && !esProActivo && (
          <div className="mb-6 space-y-2">
            <div className="text-slate-600">
              📄 Presupuestos hoy: {presupuestosHoy} / 5
            </div>

            <div className="text-slate-600">
              📅 Presupuestos este mes: {presupuestosMes} / 50
            </div>

            {presupuestosMes >= 50 && (
              <div className="mt-4 rounded-xl border border-orange-300 bg-orange-50 p-4">
                <p className="font-semibold text-orange-800">
                  📅 Alcanzaste el límite mensual del plan Free
                </p>
                <p className="mt-1 text-sm text-orange-700">
                  Podés actualizar a Pro para continuar creando presupuestos.
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/planes")}
                  className="mt-3 rounded-lg bg-orange-600 px-4 py-2 text-white hover:bg-orange-700"
                >
                  🚀 Ver Plan Pro
                </button>
              </div>
            )}

            {presupuestosMes < 50 && presupuestosHoy >= 5 && (
              <div className="mt-4 rounded-xl border border-orange-300 bg-orange-50 p-4">
                <p className="font-semibold text-orange-800">
                  ⚡ Alcanzaste el límite de 5 presupuestos de hoy
                </p>
                <p className="mt-1 text-sm text-orange-700">
                  Podrás crear nuevos presupuestos mañana.
                </p>
              </div>
            )}
          </div>
        )}

        {!cargandoPlan && (
          <div
            className={`mb-6 rounded-2xl border p-5 ${
              esProActivo
                ? "border-violet-200 bg-violet-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-bold text-slate-800">
                  ✨ Generar descripción con IA
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Contanos brevemente qué vas a presupuestar y la IA redactará una
                  descripción profesional que después podés editar.
                </p>
                {esProActivo && (
                  <p className="mt-2 text-xs font-medium text-violet-700">
                    {esOwner
                      ? "Generaciones con IA ilimitadas"
                      : aiRemaining === null
                      ? "Consultando cupo de IA..."
                      : `Generaciones disponibles hoy: ${aiRemaining} / ${aiDailyLimit}`}
                  </p>
                )}
              </div>
              {!esProActivo && (
                <span className="whitespace-nowrap rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                  Solo Pro
                </span>
              )}
            </div>

            {esProActivo ? (
              <>
                <textarea
                  className="mt-4 min-h-24 w-full rounded-xl border border-violet-200 bg-white p-3"
                  placeholder="Ej.: Instalación de 3 aires acondicionados. Incluye colocación, materiales y puesta en marcha."
                  value={detalleIA}
                  maxLength={800}
                  onChange={(e) => setDetalleIA(e.target.value)}
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-slate-500">
                    {detalleIA.length}/800 caracteres
                  </span>
                  <button
                    type="button"
                    onClick={generarDescripcionIA}
                    disabled={generandoIA || (!esOwner && aiRemaining === 0)}
                    className="rounded-xl bg-violet-600 px-4 py-2 font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300"
                  >
                    {generandoIA
                      ? "✨ Generando..."
                      : !esOwner && aiRemaining === 0
                        ? "🔒 Límite diario alcanzado"
                        : descripcion
                          ? "✨ Regenerar con IA"
                          : "✨ Generar con IA"}
                  </button>
                </div>
                {errorIA && (
                  <p className="mt-2 text-sm font-medium text-red-600">{errorIA}</p>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => router.push("/dashboard/planes")}
                className="mt-4 rounded-xl bg-slate-800 px-4 py-2 font-semibold text-white hover:bg-slate-900"
              >
                🚀 Desbloquear con Pro
              </button>
            )}
          </div>
        )}

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
            className="border p-3 rounded-lg w-full mb-4 min-h-28"
            placeholder="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />

          <div className="mb-4">
            <label className="mb-2 block font-semibold text-slate-700">Moneda del presupuesto</label>
            <select
              className="border p-3 rounded-lg w-full"
              value={moneda}
              onChange={(e) => setMoneda(e.target.value)}
            >
              <option value="ARS">🇦🇷 ARS - Peso argentino</option>
              <option value="USD">🇺🇸 USD - Dólar estadounidense</option>
              <option value="EUR">🇪🇺 EUR - Euro</option>
              <option value="BRL">🇧🇷 BRL - Real brasileño</option>
              <option value="CLP">🇨🇱 CLP - Peso chileno</option>
              <option value="UYU">🇺🇾 UYU - Peso uruguayo</option>
            </select>
          </div>

          <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Ítems del presupuesto</h2>
                <p className="text-sm text-slate-500">Agregá todos los trabajos, productos o repuestos que necesites.</p>
              </div>
              <button
                type="button"
                onClick={() => setItems((actuales) => [...actuales, { id: Math.max(0, ...actuales.map((item) => item.id)) + 1, nombre: "", precio: "" }])}
                className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
              >
                + Agregar ítem
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-[1fr_180px_auto]">
                  <input
                    className="w-full rounded-lg border p-3"
                    placeholder={`Descripción del ítem ${index + 1}`}
                    aria-label={`Descripción del ítem ${index + 1}`}
                    value={item.nombre}
                    onChange={(e) => setItems((actuales) => actuales.map((actual) => actual.id === item.id ? { ...actual, nombre: e.target.value } : actual))}
                    required
                  />
                  <input
                    className="w-full rounded-lg border p-3"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Importe"
                    aria-label={`Importe del ítem ${index + 1}`}
                    value={item.precio}
                    onChange={(e) => setItems((actuales) => actuales.map((actual) => actual.id === item.id ? { ...actual, precio: e.target.value } : actual))}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setItems((actuales) => actuales.filter((actual) => actual.id !== item.id))}
                    disabled={items.length === 1}
                    className="rounded-lg border border-red-200 px-3 py-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Eliminar ítem ${index + 1}`}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <span className="font-semibold text-slate-700">Total del presupuesto</span>
              <span className="text-2xl font-bold text-blue-700">{moneda} {total.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </section>

          <button
            className="bg-blue-600 text-white px-6 py-3 rounded-xl w-full disabled:bg-slate-400 disabled:cursor-not-allowed"
            type="submit"
            disabled={
              !cargandoPlan &&
              !esProActivo &&
              (presupuestosHoy >= 5 || presupuestosMes >= 50)
            }
          >
            {!cargandoPlan &&
            !esProActivo &&
            (presupuestosHoy >= 5 || presupuestosMes >= 50)
              ? "🔒 Límite alcanzado"
              : "Generar presupuesto"}
          </button>
        </form>
      </div>
    </main>
  );
}
