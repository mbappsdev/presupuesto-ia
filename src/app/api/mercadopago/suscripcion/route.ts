import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import {
  getEmpresaForUser,
  getMercadoPagoSubscription,
  getSubscriptionPricingPhase,
  saveSubscriptionInEmpresa,
  type MercadoPagoSubscription,
} from "@/lib/mercadopago-subscription";
import {
  getSubscriptionPlan,
  isBillingPeriod,
} from "@/lib/subscription-plans";

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

    const body = (await request.json()) as { period?: unknown };

    if (!isBillingPeriod(body.period)) {
      return NextResponse.json(
        { ok: false, mensaje: "Período de suscripción inválido" },
        { status: 400 }
      );
    }

    const payerEmail = user.email;

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
    const pricing = await getSubscriptionPricingPhase();
    const selectedPlan = getSubscriptionPlan(body.period, pricing.phase);

    if (empresa.subscription_id) {
      const currentSubscription = await getMercadoPagoSubscription(
        empresa.subscription_id
      );

      if (currentSubscription.external_reference !== empresa.id) {
        return NextResponse.json(
          { ok: false, mensaje: "La suscripción guardada no es válida" },
          { status: 409 }
        );
      }

      if (currentSubscription.status === "pending" && currentSubscription.init_point) {
        return NextResponse.json({
          ok: true,
          reused: true,
          subscriptionId: currentSubscription.id,
          initPoint: currentSubscription.init_point,
          status: currentSubscription.status,
        });
      }

      if (["authorized", "paused"].includes(currentSubscription.status)) {
        return NextResponse.json(
          {
            ok: false,
            mensaje:
              currentSubscription.status === "authorized"
                ? "La empresa ya tiene una suscripción activa"
                : "La empresa tiene una suscripción pausada que debe reactivar",
          },
          { status: 409 }
        );
      }
    }

    const appUrl = (
      process.env.NEXT_PUBLIC_APP_URL?.trim() || new URL(request.url).origin
    ).replace(/\/$/, "");

    const respuesta = await fetch(
      "https://api.mercadopago.com/preapproval",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: `PresupuestoIA Pro - ${selectedPlan.label}`,
          payer_email: payerEmail,
          external_reference: empresa.id,

          auto_recurring: {
            frequency: selectedPlan.months,
            frequency_type: "months",
            transaction_amount: selectedPlan.price,
            currency_id: "ARS",
          },

          back_url: `${appUrl}/dashboard/pro/pago?period=${selectedPlan.id}`,

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
          detalle: data.message ?? "Error desconocido",
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
      period: selectedPlan.id,
      amount: selectedPlan.price,
      currency: "ARS",
      pricingPhase: pricing.phase,
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
