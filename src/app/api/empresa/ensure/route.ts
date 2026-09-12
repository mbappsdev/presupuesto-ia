import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { ensureEmpresaForUser } from "@/lib/empresa-server";

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { ok: false, mensaje: "Sesión inválida o vencida" },
        { status: 401 }
      );
    }

    const empresa = await ensureEmpresaForUser(user.id);

    return NextResponse.json({
      ok: true,
      empresaId: empresa.id,
    });
  } catch (error) {
    console.error("[empresa] Error asegurando empresa", error);

    return NextResponse.json(
      { ok: false, mensaje: "No se pudo preparar la empresa del usuario" },
      { status: 500 }
    );
  }
}
