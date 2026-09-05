"use client";
import { useState, useEffect, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { syncMercadoPagoSubscription } from "@/lib/sync-subscription";


export default function NuevoPresupuestoPage() {
  const router = useRouter();
  const [cliente, setCliente] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [moneda, setMoneda] = useState("ARS");

  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [presupuestosHoy, setPresupuestosHoy] = useState(0);
  const [presupuestosMes, setPresupuestosMes] = useState(0);

  const [subscriptionStatus, setSubscriptionStatus] =
    useState<string | null>(null);

  const [subscriptionExpiresAt, setSubscriptionExpiresAt] =
    useState<string | null>(null);

  const [cargandoPlan, setCargandoPlan] = useState(true);

  const suscripcionVencida =
  subscriptionExpiresAt !== null &&
  new Date(subscriptionExpiresAt) < new Date();

  const esProActivo =
    plan === "pro" &&
    (subscriptionStatus === "active" ||
      subscriptionStatus === "cancelled") &&
    !suscripcionVencida;

    useEffect(() => {
    cargarDatos();
  }, []);

async function cargarDatos() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    router.push("/login");
    return;
  }

  await syncMercadoPagoSubscription();

  // Obtener plan
 const { data: empresaData } = await supabase
  .from("empresa")
  .select("plan, subscription_status, subscription_expires_at")
  .eq("user_id", user.id)
  .single();

  setPlan(empresaData?.plan === "pro" ? "pro" : "free");
  setSubscriptionStatus(empresaData?.subscription_status || null);
  setSubscriptionExpiresAt(empresaData?.subscription_expires_at || null);
  
  setCargandoPlan(false);
  
  // Obtener presupuestos
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

  async function crearPresupuesto(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    alert("No hay usuario conectado");
    return;
  }

  if (!esProActivo && presupuestosHoy >= 5) {
  alert(
    "⚡ Llegaste al límite de 5 presupuestos diarios."
  );
  router.push("/dashboard/planes");
  return;
  }

  if (!esProActivo && presupuestosMes >= 50) {
  alert(
    "📅 Llegaste al límite de 50 presupuestos mensuales."
  );
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
      descripcion,
      precio: Number(precio),
      moneda,
    });

  if (error) {
  console.error(error);
  alert(error.message);
  return;
}


  alert(`✅ Presupuesto Nº ${String(nuevoNumero).padStart(6, "0")} guardado correctamente`);

  router.push("/dashboard");
}
  
  return (
     <main className="min-h-screen bg-slate-100">
    
      <Navbar />
    
        <div className="max-w-4xl mx-auto p-8">

        <h1 className="text-3xl font-bold mb-6">
          Nuevo presupuesto 📄
        </h1>

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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">

          <select
          className="border p-3 rounded-lg"
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

          <input
          className="border p-3 rounded-lg md:col-span-2"
          placeholder="Precio"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
            />

          </div>

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
