import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import {
  getEmpresaForUser,
  getMercadoPagoSubscription,
  saveSubscriptionInEmpresa,
} from "@/lib/mercadopago-subscription";

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { ok: false, mensaje: "Sesión inválida o vencida" },
        { status: 401 }
      );
    }

    const empresa = await getEmpresaForUser(user.id);

    if (!empresa.subscription_id) {
      return NextResponse.json(
        { ok: false, mensaje: "La empresa todavía no tiene una suscripción" },
        { status: 404 }
      );
    }

    const subscription = await getMercadoPagoSubscription(
      empresa.subscription_id
    );

    if (subscription.external_reference !== empresa.id) {
      return NextResponse.json(
        { ok: false, mensaje: "La suscripción no pertenece a esta empresa" },
        { status: 409 }
      );
    }

    const result = await saveSubscriptionInEmpresa(empresa.id, subscription);

    return NextResponse.json({
      ok: true,
      status: subscription.status,
      plan: result.plan,
      subscriptionStatus: result.subscriptionStatus,
    });
  } catch (error) {
    console.error("[mercadopago] Error sincronizando suscripción", error);

    return NextResponse.json(
      { ok: false, mensaje: "No se pudo sincronizar la suscripción" },
      { status: 500 }
    );
  }
}
