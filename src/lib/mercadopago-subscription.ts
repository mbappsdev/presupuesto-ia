import { createClient } from "@supabase/supabase-js";
import {
  FOUNDER_CUSTOMER_LIMIT,
  type PricingPhase,
} from "@/lib/subscription-plans";

export type MercadoPagoSubscription = {
  id: string;
  status: string;
  external_reference?: string | null;
  date_created?: string | null;
  next_payment_date?: string | null;
  application_id?: number | null;
  collector_id?: number | null;
  init_point?: string | null;
};

function getMercadoPagoToken() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!token) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN no configurado");
  }

  return token;
}

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

export async function getMercadoPagoSubscription(subscriptionId: string) {
  const response = await fetch(
    `https://api.mercadopago.com/preapproval/${encodeURIComponent(subscriptionId)}`,
    {
      headers: {
        Authorization: `Bearer ${getMercadoPagoToken()}`,
      },
      cache: "no-store",
    }
  );

  const data = (await response.json()) as MercadoPagoSubscription & {
    message?: string;
  };

  if (!response.ok) {
    throw new Error(
      `Mercado Pago no pudo consultar la suscripción (${response.status}): ${
        data.message ?? "error desconocido"
      }`
    );
  }

  return data;
}

export async function findMercadoPagoSubscription(empresaId: string) {
  const search = new URL("https://api.mercadopago.com/preapproval/search");
  search.searchParams.set("q", empresaId);
  search.searchParams.set("limit", "100");

  const response = await fetch(search, {
    headers: {
      Authorization: `Bearer ${getMercadoPagoToken()}`,
    },
    cache: "no-store",
  });

  const data = (await response.json()) as {
    results?: MercadoPagoSubscription[];
    message?: string;
  };

  if (!response.ok) {
    throw new Error(
      `Mercado Pago no pudo buscar la suscripción (${response.status}): ${
        data.message ?? "error desconocido"
      }`
    );
  }

  return (data.results ?? [])
    .filter((subscription) => subscription.external_reference === empresaId)
    .sort((a, b) => {
      const aCreatedAt = a.date_created
        ? new Date(a.date_created).getTime()
        : 0;
      const bCreatedAt = b.date_created
        ? new Date(b.date_created).getTime()
        : 0;

      return bCreatedAt - aCreatedAt;
    })[0] ?? null;
}

async function ensureFounderStatus(empresaId: string) {
  const supabaseAdmin = getSupabaseAdmin();

  const { data: empresa, error: empresaError } = await supabaseAdmin
    .from("empresa")
    .select("id, is_founder, founder_started_at, founder_price_until")
    .eq("id", empresaId)
    .single();

  if (empresaError || !empresa) {
    throw new Error("No se pudo consultar el estado fundador de la empresa");
  }

  if (empresa.is_founder) {
    return;
  }

  const { count, error: countError } = await supabaseAdmin
    .from("empresa")
    .select("id", { count: "exact", head: true })
    .eq("is_founder", true);

  if (countError) {
    throw new Error(
      `Supabase no pudo contar los clientes fundadores: ${countError.message}`
    );
  }

  if ((count ?? 0) >= FOUNDER_CUSTOMER_LIMIT) {
    return;
  }

  const founderStartedAt = new Date();
  const founderPriceUntil = new Date(founderStartedAt);
  founderPriceUntil.setFullYear(founderPriceUntil.getFullYear() + 1);

  const { error: updateError } = await supabaseAdmin
    .from("empresa")
    .update({
      is_founder: true,
      founder_started_at: founderStartedAt.toISOString(),
      founder_price_until: founderPriceUntil.toISOString(),
    })
    .eq("id", empresaId)
    .eq("is_founder", false);

  if (updateError) {
    throw new Error(
      `Supabase no pudo asignar el beneficio fundador: ${updateError.message}`
    );
  }
}

export async function saveSubscriptionInEmpresa(
  empresaId: string,
  subscription: MercadoPagoSubscription
) {
  const now = new Date();
  const expiresAt = subscription.next_payment_date
    ? new Date(subscription.next_payment_date)
    : null;

  let plan = "free";
  let subscriptionStatus = subscription.status;

  if (subscription.status === "authorized") {
    plan = "pro";
    subscriptionStatus = "active";
  } else if (subscription.status === "paused") {
    subscriptionStatus = "paused";

    if (expiresAt && expiresAt > now) {
      plan = "pro";
    }
  }

  const { data, error } = await getSupabaseAdmin()
    .from("empresa")
    .update({
      plan,
      subscription_status: subscriptionStatus,
      subscription_started_at:
        subscription.date_created ?? new Date().toISOString(),
      subscription_expires_at: subscription.next_payment_date ?? null,
      subscription_provider: "mercadopago",
      subscription_id: subscription.id,
      subscription_external_reference:
        subscription.external_reference ?? empresaId,
    })
    .eq("id", empresaId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase no pudo actualizar la empresa: ${error.message}`);
  }

  if (!data) {
    throw new Error("La empresa indicada por Mercado Pago no existe");
  }

  if (subscription.status === "authorized") {
    await ensureFounderStatus(empresaId);
  }

  return { plan, subscriptionStatus };
}

export async function getEmpresaForUser(userId: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("empresa")
    .select("id, subscription_id")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    throw new Error("No se encontró la empresa del usuario");
  }

  return data as { id: string; subscription_id: string | null };
}

export async function getSubscriptionPricingPhase(): Promise<{
  phase: PricingPhase;
  subscribedCompanies: number;
  founderRemaining: number;
}> {
  const { count, error } = await getSupabaseAdmin()
    .from("empresa")
    .select("id", { count: "exact", head: true })
    .eq("is_founder", true);

  if (error) {
    throw new Error(
      `Supabase no pudo calcular el precio vigente: ${error.message}`
    );
  }

  const subscribedCompanies = count ?? 0;
  const founderRemaining = Math.max(
    FOUNDER_CUSTOMER_LIMIT - subscribedCompanies,
    0
  );

  return {
    phase: founderRemaining > 0 ? "founder" : "standard",
    subscribedCompanies,
    founderRemaining,
  };
}
