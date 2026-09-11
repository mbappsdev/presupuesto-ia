import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "@/lib/api-auth";

export const runtime = "nodejs";

const AI_DAILY_LIMIT = 20;

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Credenciales administrativas de Supabase no configuradas");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function getProUserContext(request: Request) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return {
      error: NextResponse.json(
        { ok: false, mensaje: "Sesión inválida o vencida" },
        { status: 401 }
      ),
    } as const;
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: empresa, error: empresaError } = await supabaseAdmin
    .from("empresa")
    .select("plan, subscription_status, subscription_expires_at")
    .eq("user_id", user.id)
    .single();

  if (empresaError || !empresa) {
    return {
      error: NextResponse.json(
        { ok: false, mensaje: "No se encontró la empresa del usuario" },
        { status: 404 }
      ),
    } as const;
  }

  const expiresAt = empresa.subscription_expires_at
    ? new Date(empresa.subscription_expires_at)
    : null;
  const tieneAccesoVigente = !expiresAt || expiresAt > new Date();
  const esPro = empresa.plan === "pro" && tieneAccesoVigente;

  if (!esPro) {
    return {
      error: NextResponse.json(
        { ok: false, mensaje: "Generar con IA es una función exclusiva del Plan Pro" },
        { status: 403 }
      ),
    } as const;
  }

  return { user, supabaseAdmin } as const;
}

export async function GET(request: Request) {
  try {
    const context = await getProUserContext(request);

    if ("error" in context) {
      return context.error;
    }

    const { data, error } = await context.supabaseAdmin.rpc(
      "get_ai_generation_remaining",
      {
        p_user_id: context.user.id,
        p_limit: AI_DAILY_LIMIT,
      }
    );

    if (error) {
      throw new Error(`No se pudo consultar el límite de IA: ${error.message}`);
    }

    return NextResponse.json({
      ok: true,
      dailyLimit: AI_DAILY_LIMIT,
      remaining: typeof data === "number" ? data : AI_DAILY_LIMIT,
    });
  } catch (error) {
    console.error("Error consultando límite de IA:", error);
    return NextResponse.json(
      { ok: false, mensaje: "No pudimos consultar el uso diario de IA" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const context = await getProUserContext(request);

    if ("error" in context) {
      return context.error;
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, mensaje: "La función de IA todavía no está configurada" },
        { status: 503 }
      );
    }

    const body = (await request.json()) as { detalle?: unknown };
    const detalle = typeof body.detalle === "string" ? body.detalle.trim() : "";

    if (detalle.length < 8) {
      return NextResponse.json(
        {
          ok: false,
          mensaje: "Contanos un poco más sobre el trabajo o producto a presupuestar",
        },
        { status: 400 }
      );
    }

    if (detalle.length > 800) {
      return NextResponse.json(
        { ok: false, mensaje: "La descripción inicial no puede superar 800 caracteres" },
        { status: 400 }
      );
    }

    const { data: remainingAfterConsume, error: consumeError } =
      await context.supabaseAdmin.rpc("consume_ai_generation", {
        p_user_id: context.user.id,
        p_limit: AI_DAILY_LIMIT,
      });

    if (consumeError) {
      throw new Error(`No se pudo registrar el uso de IA: ${consumeError.message}`);
    }

    if (remainingAfterConsume === -1) {
      return NextResponse.json(
        {
          ok: false,
          mensaje: `Llegaste al límite de ${AI_DAILY_LIMIT} generaciones con IA de hoy. Podés volver a usarla mañana.`,
          dailyLimit: AI_DAILY_LIMIT,
          remaining: 0,
        },
        { status: 429 }
      );
    }

    let usageConsumed = true;

    const releaseUsage = async () => {
      if (!usageConsumed) return;
      usageConsumed = false;

      const { error } = await context.supabaseAdmin.rpc("release_ai_generation", {
        p_user_id: context.user.id,
      });

      if (error) {
        console.error("No se pudo devolver el cupo de IA:", error.message);
      }
    };

    const prompt = `Redactá una descripción profesional para un presupuesto comercial en español de Argentina.

Información brindada por el usuario:
${detalle}

Reglas:
- Escribí solo la descripción final, sin títulos ni explicaciones.
- Usá un tono claro, profesional y fácil de entender.
- No inventes precios, cantidades, materiales, marcas, plazos, garantías, impuestos ni condiciones que el usuario no haya indicado.
- No menciones inteligencia artificial.
- Conservá todos los datos concretos que dio el usuario.
- Si falta información, redactá de forma general sin completar con datos inventados.
- Extensión ideal: entre 2 y 5 oraciones breves.`;

    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 300,
          },
        }),
        cache: "no-store",
      }
    );

    const data = (await geminiResponse.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
      error?: { message?: string };
    };

    if (!geminiResponse.ok) {
      await releaseUsage();
      console.error("Error Gemini:", data.error?.message ?? data);
      return NextResponse.json(
        {
          ok: false,
          mensaje: "No pudimos generar la descripción en este momento. Intentá nuevamente.",
        },
        { status: 502 }
      );
    }

    const descripcion =
      data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("")
        .trim() ?? "";

    if (!descripcion) {
      await releaseUsage();
      return NextResponse.json(
        {
          ok: false,
          mensaje: "La IA no devolvió una descripción. Intentá con más detalles.",
        },
        { status: 502 }
      );
    }

    usageConsumed = false;

    return NextResponse.json({
      ok: true,
      descripcion,
      dailyLimit: AI_DAILY_LIMIT,
      remaining:
        typeof remainingAfterConsume === "number"
          ? remainingAfterConsume
          : Math.max(AI_DAILY_LIMIT - 1, 0),
    });
  } catch (error) {
    console.error("Error generando descripción con IA:", error);
    return NextResponse.json(
      { ok: false, mensaje: "Error interno al generar la descripción" },
      { status: 500 }
    );
  }
}
