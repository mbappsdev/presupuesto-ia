import { NextResponse } from "next/server";
import { applyFounderLoyaltyPricing } from "@/lib/mercadopago-subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { ok: false, mensaje: "CRON_SECRET no configurado" },
      { status: 500 }
    );
  }

  const authorization = request.headers.get("authorization");

  if (authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { ok: false, mensaje: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    const result = await applyFounderLoyaltyPricing();

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error("[cron/founder-pricing]", error);

    return NextResponse.json(
      {
        ok: false,
        mensaje:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el precio fundador",
      },
      { status: 500 }
    );
  }
}
