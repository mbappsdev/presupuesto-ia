import { NextResponse } from "next/server";

export async function POST(request: Request) {
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
    const body = await request.json();

    const { email, externalReference } = body;

    if (!email || !externalReference) {
      return NextResponse.json(
        {
          ok: false,
          mensaje: "Faltan email o externalReference",
        },
        { status: 400 }
      );
    }

    const respuesta = await fetch(
      "https://api.mercadopago.com/preapproval",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: "PresupuestoIA Pro - Prueba",
          payer_email: email,
          external_reference: externalReference,
          
          notification_url:
           "https://presupuesto-ia-cyan.vercel.app/api/mercadopago/webhook",

          auto_recurring: {
            frequency: 1,
            frequency_type: "months",
            transaction_amount: 100,
            currency_id: "ARS",
          },

          back_url:
            "https://presupuesto-ia-cyan.vercel.app/dashboard/pro/pago",

          status: "pending",
        }),
      }
    );

    const data = await respuesta.json();

    if (!respuesta.ok) {
      console.error("Error Mercado Pago:", data);

      return NextResponse.json(
        {
          ok: false,
          mensaje: "No se pudo crear la suscripción",
          error: data,
        },
        { status: respuesta.status }
      );
    }

    return NextResponse.json({
      ok: true,
      subscriptionId: data.id,
      initPoint: data.init_point,
      status: data.status,
    });
  } catch (error) {
    console.error("Error creando suscripción:", error);

    return NextResponse.json(
      {
        ok: false,
        mensaje: "Error interno al crear la suscripción",
      },
      { status: 500 }
    );
  }
}