import { NextResponse } from "next/server";

export async function GET() {
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
      "https://api.mercadopago.com/users/me",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    const data = await respuesta.json();

    if (!respuesta.ok) {
      return NextResponse.json(
        {
          ok: false,
          mensaje: "Mercado Pago rechazó las credenciales",
          error: data,
        },
        { status: respuesta.status }
      );
    }

    return NextResponse.json({
      ok: true,
      mensaje: "Conexión con Mercado Pago correcta",
    });
  } catch (error) {
    console.error("Error al conectar con Mercado Pago:", error);

    return NextResponse.json(
      {
        ok: false,
        mensaje: "No se pudo conectar con Mercado Pago",
      },
      { status: 500 }
    );
  }
}