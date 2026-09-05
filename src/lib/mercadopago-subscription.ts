import { createClient } from "@supabase/supabase-js";

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
