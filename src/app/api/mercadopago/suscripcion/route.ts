import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import {
  getEmpresaForUser,
  saveSubscriptionInEmpresa,
  type MercadoPagoSubscription,
} from "@/lib/mercadopago-subscription";

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
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { ok: false, mensaje: "Sesión inválida o vencida" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const requestedEmail =
      typeof body?.email === "string" ? body.email.trim() : "";
    const payerEmail =
      process.env.MERCADOPAGO_TEST_PAYER_EMAIL?.trim() ||
      requestedEmail ||
      user.email;

    if (!payerEmail) {
      return NextResponse.json(
        {
          ok: false,
          mensaje: "No se pudo determinar el email del pagador",
        },
        { status: 400 }
      );
    }

    const empresa = await getEmpresaForUser(user.id);

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
          payer_email: payerEmail,
          external_reference: empresa.id,

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

    const data = (await respuesta.json()) as MercadoPagoSubscription & {
      message?: string;
    };

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

    await saveSubscriptionInEmpresa(empresa.id, data);

    console.info("[mercadopago] Suscripción creada", {
      subscriptionId: data.id,
      applicationId: data.application_id,
      collectorId: data.collector_id,
      status: data.status,
    });

    return NextResponse.json({
      ok: true,
      subscriptionId: data.id,
      initPoint: data.init_point,
      status: data.status,
      applicationId: data.application_id,
      collectorId: data.collector_id,
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
