import { NextResponse } from "next/server";

export async function POST() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!token) {
    return NextResponse.json(
      {
        ok: false,
        mensaje: "Access Token no configurado",
      },
      { status: 500 }
    );
  }

  try {
    const respuesta = await fetch(
      "https://api.mercadopago.com/users/test",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          site_id: "MLA",
          description: "Comprador PresupuestoIA API",
        }),
      }
    );

    const data = await respuesta.json();

    if (!respuesta.ok) {
      return NextResponse.json(
        {
          ok: false,
          mensaje: "No se pudo crear el usuario de prueba",
          error: data,
        },
        { status: respuesta.status }
      );
    }

    return NextResponse.json({
      ok: true,
      camposRecibidos: Object.keys(data),
      email: data.email ?? null,
      id: data.id,
      usuario: data.nickname,
      siteId: data.site_id,
    });
  } catch (error) {
    console.error("Error creando usuario de prueba:", error);

    return NextResponse.json(
      {
        ok: false,
        mensaje: "Error interno al crear el usuario de prueba",
      },
      { status: 500 }
    );
  }
}