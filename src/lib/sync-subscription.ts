import { supabase } from "@/lib/supabase";

export async function syncMercadoPagoSubscription() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return false;

  const response = await fetch("/api/mercadopago/suscripcion/sync", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  // 404 significa que el usuario todavía no inició una suscripción.
  return response.ok || response.status === 404;
}
