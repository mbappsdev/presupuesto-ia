import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { WebhookSignatureValidator } from "mercadopago";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const mercadoPagoToken = process.env.MERCADOPAGO_ACCESS_TOKEN!;
const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET!;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export async function POST(request: Request) {
  try {
        const url = new URL(request.url);

    const xSignature = request.headers.get("x-signature");
    const xRequestId = request.headers.get("x-request-id");
    const dataId = url.searchParams.get("data.id");

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
      return NextResponse.json(
        { ok: false, mensaje: "Firma de webhook inválida" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const subscriptionId =
      body?.data?.id ||
      body?.id ||
      null;

    if (!subscriptionId) {
      return NextResponse.json({ ok: true });
    }

    const respuesta = await fetch(
      `https://api.mercadopago.com/preapproval/${subscriptionId}`,
      {
        headers: {
          Authorization: `Bearer ${mercadoPagoToken}`,
        },
      }
    );

    const suscripcion = await respuesta.json();

    if (!respuesta.ok) {
      console.error("Error consultando suscripción:", suscripcion);

      return NextResponse.json(
        { ok: false },
        { status: 500 }
      );
    }

    const empresaId = suscripcion.external_reference;

    if (!empresaId) {
      return NextResponse.json({ ok: true });
    }

    let subscriptionStatus = suscripcion.status;

    if (suscripcion.status === "authorized") {
      subscriptionStatus = "active";
    }

    const { error } = await supabaseAdmin
      .from("empresa")
      .update({
        plan: suscripcion.status === "authorized" ? "pro" : "free",
        subscription_status: subscriptionStatus,
        subscription_started_at:
          suscripcion.date_created ?? new Date().toISOString(),
        subscription_expires_at:
          suscripcion.next_payment_date ?? null,
        subscription_provider: "mercadopago",
        subscription_id: suscripcion.id,
        subscription_external_reference:
          suscripcion.external_reference,
      })
      .eq("id", empresaId);

    if (error) {
      console.error("Error actualizando empresa:", error);

      return NextResponse.json(
        { ok: false },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error webhook Mercado Pago:", error);

    return NextResponse.json(
      { ok: false },
      { status: 500 }
    );
  }

}