"use client";

import { useEffect, useState, FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

export default function EmpresaPage() {
  const [nombre, setNombre] = useState("");
  const [cuit, setCuit] = useState("");
  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [sitioWeb, setSitioWeb] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const [subiendoLogo, setSubiendoLogo] = useState(false);

  useEffect(() => {
    cargarEmpresa();
  }, []);

  async function cargarEmpresa() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("empresa")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error || !data) return;

    setNombre(data.nombre || "");
    setCuit(data.cuit || "");
    setDireccion(data.direccion || "");
    setCiudad(data.ciudad || "");
    setTelefono(data.telefono || "");
    setEmail(data.email || "");
    setSitioWeb(data.sitio_web || "");
    setLogoUrl(data.logo_url || "");
  }

  async function subirLogo(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const archivo = e.target.files?.[0];

    if (!archivo) return;

    if (!archivo.type.startsWith("image/")) {
      alert("Por favor seleccioná una imagen.");
      return;
    }

    if (archivo.size > 2 * 1024 * 1024) {
      alert("El logo no puede superar los 2 MB.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("No hay usuario conectado.");
      return;
    }

    setSubiendoLogo(true);

    try {
      const extension =
        archivo.name.split(".").pop() || "png";

      const nombreArchivo = `${user.id}-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(nombreArchivo, archivo, {
          upsert: false,
        });

      if (uploadError) {
        console.error(uploadError);
        alert("Error al subir el logo.");
        return;
      }

      const { data } = supabase.storage
        .from("logos")
        .getPublicUrl(nombreArchivo);

      setLogoUrl(data.publicUrl);

      const { error: updateError } = await supabase
        .from("empresa")
        .upsert(
          {
            user_id: user.id,
            nombre,
            cuit,
            direccion,
            ciudad,
            telefono,
            email,
            sitio_web: sitioWeb,
            logo_url: data.publicUrl,
          },
          {
            onConflict: "user_id",
          }
        );

      if (updateError) {
        console.error(updateError);
        alert("El logo se subió, pero no se pudo guardar en la empresa.");
        return;
      }

      alert("✅ Logo guardado correctamente");
    } finally {
      setSubiendoLogo(false);
    }
  }

  async function guardarEmpresa(e: FormEvent) {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("No hay usuario conectado.");
      return;
    }

    const datos = {
      user_id: user.id,
      nombre,
      cuit,
      direccion,
      ciudad,
      telefono,
      email,
      sitio_web: sitioWeb,
      logo_url: logoUrl || null,
    };

    const { error } = await supabase
      .from("empresa")
      .upsert(datos, {
        onConflict: "user_id",
      });

    if (error) {
      console.error(error);
      alert("Error al guardar los datos");
      return;
    }

    alert("✅ Datos de la empresa guardados");
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-100">
        <div className="max-w-3xl mx-auto p-8">
          <h1 className="text-3xl font-bold mb-6">
            🏢 Mi empresa
          </h1>

          <form
            onSubmit={guardarEmpresa}
            className="space-y-4 bg-white p-6 rounded-xl shadow"
          >
            {/* LOGO */}

            <div className="border rounded-xl p-5 bg-slate-50">
              <h2 className="text-lg font-bold mb-3">
                🖼️ Logo de la empresa
              </h2>

              {logoUrl && (
                <div className="mb-4">
                  <img
                    src={logoUrl}
                    alt="Logo de la empresa"
                    className="max-h-32 max-w-xs object-contain border rounded-lg bg-white p-2"
                  />
                </div>
              )}

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={subirLogo}
                disabled={subiendoLogo}
                className="w-full border p-3 rounded-lg bg-white"
              />

              <p className="text-sm text-slate-500 mt-2">
                PNG, JPG o WEBP. Máximo 2 MB.
              </p>

              {subiendoLogo && (
                <p className="text-sm text-blue-600 mt-2">
                  Subiendo logo...
                </p>
              )}
            </div>

            <input
              className="w-full border p-3 rounded"
              placeholder="Nombre de la empresa"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />

            <input
              className="w-full border p-3 rounded"
              placeholder="CUIT"
              value={cuit}
              onChange={(e) => setCuit(e.target.value)}
            />

            <input
              className="w-full border p-3 rounded"
              placeholder="Dirección"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
            />

            <input
              className="w-full border p-3 rounded"
              placeholder="Ciudad"
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
            />

            <input
              className="w-full border p-3 rounded"
              placeholder="Teléfono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />

            <input
              className="w-full border p-3 rounded"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              className="w-full border p-3 rounded"
              placeholder="Sitio web"
              value={sitioWeb}
              onChange={(e) => setSitioWeb(e.target.value)}
            />

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700"
            >
              Guardar datos
            </button>
          </form>
        </div>
      </main>
    </>
  );
}