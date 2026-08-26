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
      "https://api.mercadopago.com/preapproval_plan",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: "PresupuestoIA Pro - Prueba",
          auto_recurring: {
            frequency: 1,
            frequency_type: "months",
            transaction_amount: 100,
            currency_id: "ARS",
          },
          back_url: "http://localhost:3000/dashboard/pro/pago",
        }),
      }
    );

    const data = await respuesta.json();

    if (!respuesta.ok) {
      console.error("Error Mercado Pago:", data);

      return NextResponse.json(
        {
          ok: false,
          mensaje: "No se pudo crear el plan de prueba",
          error: data,
        },
        { status: respuesta.status }
      );
    }

    return NextResponse.json({
      ok: true,
      planId: data.id,
      initPoint: data.init_point,
      status: data.status,
    });
  } catch (error) {
    console.error("Error creando plan:", error);

    return NextResponse.json(
      {
        ok: false,
        mensaje: "Error interno al crear el plan",
      },
      { status: 500 }
    );
  }
}