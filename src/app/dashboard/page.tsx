"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { generarPDF } from "@/utils/pdf";
import { formatearMoneda } from "@/utils/moneda";

type Empresa = {
  nombre: string;
  cuit: string;
  direccion: string;
  ciudad: string;
  telefono: string;
  email: string;
  sitio_web: string;
};

export default function DashboardPage() {
  const router = useRouter();

  const [presupuestos, setPresupuestos] = useState<any[]>([]);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [cargandoPlan, setCargandoPlan] = useState(true);
  const [presupuestosHoy, setPresupuestosHoy] = useState(0);
  const [subscriptionStatus, setSubscriptionStatus] =
  useState<string | null>(null);
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] =
  useState<string | null>(null);
  

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

    // Cargar presupuestos
    const { data: presupuestosData, error: presupuestosError } =
      await supabase
        .from("presupuestos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    console.log("ID del usuario conectado:", user.id);
    console.log("Presupuestos:", presupuestosData);
    console.log("Error presupuestos:", presupuestosError);

    if (!presupuestosError && presupuestosData) {
      setPresupuestos(presupuestosData);
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const cantidadHoy = (presupuestosData || []).filter((p) => {
      const fecha = new Date(p.created_at);
      return fecha >= hoy;
    }).length;

    setPresupuestosHoy(cantidadHoy);

    // Cargar datos de la empresa
    const { data: empresaData, error: empresaError } = await supabase
      .from("empresa")
      .select("plan, subscription_status, subscription_expires_at")
      .eq("user_id", user.id)
      .single();

    console.log("Datos de empresa:", empresaData);
    console.log("Error empresa:", empresaError);

    if (!empresaError && empresaData) {
      setEmpresa(empresaData);
      setPlan(empresaData?.plan === "pro" ? "pro" : "free");
      setSubscriptionStatus(empresaData.subscription_status);
      setSubscriptionExpiresAt(empresaData.subscription_expires_at);
    }
    setCargandoPlan(false);
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

    cargarDatos();
  }

  function descargarPDF(presupuesto: any, empresa: Empresa | null) {
    generarPDF({
      ...presupuesto,
      empresaDatos: empresa,
    });
  }

  const suscripcionVencida =
  subscriptionExpiresAt &&
  new Date(subscriptionExpiresAt) < new Date();

  const esProActivo =
  plan === "pro" &&
  (subscriptionStatus === "active" ||
    subscriptionStatus === "cancelled") &&
  !suscripcionVencida;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-100">
        <div className="max-w-4xl mx-auto p-8">
          <h1 className="text-4xl font-bold mb-4">
            Bienvenido a PresupuestoIA 🚀
          </h1>

          <p className="text-lg mb-8">
            Genera presupuestos profesionales en segundos.
          </p>

          {!cargandoPlan && (
            <div className="mb-6">
              <span className="inline-block bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold">
                Plan: {esProActivo ? "⭐ Pro" : "🆓 Gratis"}
              </span>

              {plan === "pro" &&
                subscriptionStatus === "active" &&
                !suscripcionVencida && (
                  <div className="mt-2 text-green-700 font-medium">
                    🟢 Suscripción activa
                  </div>
              )}

              {plan === "pro" &&
                subscriptionStatus === "cancelled" &&
                !suscripcionVencida && (
                  <div className="mt-2 text-orange-700 font-medium">
                    🟠 Suscripción cancelada
                  </div>
              )}      

              {plan === "pro" &&
                  suscripcionVencida && (
                  <div className="mt-2 text-red-700 font-medium">
                    🔴 Suscripción vencida
                  </div>
              )}    

              {plan === "pro" &&
                subscriptionExpiresAt &&
                !suscripcionVencida && (
                  <div className="mt-1 text-slate-600">
                    📅 Acceso Pro hasta:{" "}
                    {new Date(subscriptionExpiresAt).toLocaleDateString("es-AR")}
                  </div>
              )}

              {!esProActivo && (
                <div className="mt-3 text-slate-600">
                  📄 Presupuestos hoy: {presupuestosHoy} / 5
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => router.push("/dashboard/nuevo")}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700"
          >
            ➕ Crear presupuesto
          </button>

          <h2 className="text-2xl font-bold mt-10 mb-6">
            Mis presupuestos
          </h2>

          {presupuestos.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-6">
              No hay presupuestos todavía.
            </div>
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
                  {p.moneda || "ARS"}{" "}
                  {formatearMoneda(p.precio, p.moneda || "ARS")}
                </p>
                <div className="flex gap-2 mt-4 flex-wrap">
                  <button
                    onClick={() =>
                      router.push(`/dashboard/editar/${p.id}`)
                    }
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
                  >
                    ✏️ Editar
                  </button>

                  <button
                    onClick={() => eliminarPresupuesto(p.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    🗑️ Eliminar
                  </button>

                  <button
                    onClick={() => descargarPDF(p, empresa)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg"
                  >
                    📄 PDF
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </>
    
  );
}