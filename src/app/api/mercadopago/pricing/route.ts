import { NextResponse } from "next/server";
import { getSubscriptionPricingPhase } from "@/lib/mercadopago-subscription";
import { getSubscriptionPlans } from "@/lib/subscription-plans";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pricing = await getSubscriptionPricingPhase();

    return NextResponse.json(
      {
        ok: true,
        currency: "ARS",
        ...pricing,
        plans: getSubscriptionPlans(pricing.phase),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("[mercadopago] Error obteniendo precios", error);

    return NextResponse.json(
      { ok: false, mensaje: "No se pudieron cargar los precios" },
      { status: 500 }
    );
  }
}
