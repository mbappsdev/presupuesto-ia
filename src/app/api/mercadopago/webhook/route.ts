import { NextResponse } from "next/server";
import { WebhookSignatureValidator } from "mercadopago";
import {
  getMercadoPagoSubscription,
  saveSubscriptionInEmpresa,
} from "@/lib/mercadopago-subscription";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    servicio: "mercadopago-webhook",
    configurado: Boolean(
      process.env.MERCADOPAGO_ACCESS_TOKEN &&
        process.env.MERCADOPAGO_WEBHOOK_SECRET &&
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.SUPABASE_SERVICE_ROLE_KEY
    ),
  });
}

export async function POST(request: Request) {
  try {
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    const url = new URL(request.url);
    const xSignature = request.headers.get("x-signature");
    const xRequestId = request.headers.get("x-request-id");
    const dataId = url.searchParams.get("data.id");

    if (!webhookSecret) {
      console.error("[mercadopago] MERCADOPAGO_WEBHOOK_SECRET no configurado");
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    if (!xSignature || !xRequestId || !dataId) {
      return NextResponse.json(
        { ok: false, mensaje: "Firma de webhook incompleta" },
        { status: 401 }
      );
    }

    try {
      WebhookSignatureValidator.validate({
        xSignature,
        xRequestId,
        dataId,
        secret: webhookSecret,
      });
    } catch {
      console.warn("[mercadopago] Firma inválida", { xRequestId, dataId });
      return NextResponse.json(
        { ok: false, mensaje: "Firma de webhook inválida" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      type?: string;
      action?: string;
      data?: { id?: string };
    };
    const topic = url.searchParams.get("type") ?? body.type;

    console.info("[mercadopago] Webhook válido recibido", {
      topic,
      action: body.action,
      dataId,
      xRequestId,
    });

    // Los IDs de payment y authorized_payment no son IDs de preapproval.
    // Se confirman para evitar reintentos; el estado de la suscripción se
    // procesa exclusivamente con subscription_preapproval.
    if (topic !== "subscription_preapproval") {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const subscription = await getMercadoPagoSubscription(dataId);
    const empresaId = subscription.external_reference;

    if (!empresaId) {
      console.warn("[mercadopago] Suscripción sin external_reference", {
        subscriptionId: subscription.id,
      });
      return NextResponse.json({ ok: true, ignored: true });
    }

    await saveSubscriptionInEmpresa(empresaId, subscription);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[mercadopago] Error procesando webhook", error);

    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
