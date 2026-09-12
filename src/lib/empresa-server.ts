import { createClient } from "@supabase/supabase-js";

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

export async function ensureEmpresaForUser(userId: string) {
  const supabaseAdmin = getSupabaseAdmin();

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("empresa")
    .select("id, subscription_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) {
    throw new Error(
      `No se pudo consultar la empresa del usuario: ${existingError.message}`
    );
  }

  if (existing) {
    return existing as { id: string; subscription_id: string | null };
  }

  const { data: created, error: createError } = await supabaseAdmin
    .from("empresa")
    .insert({ user_id: userId })
    .select("id, subscription_id")
    .single();

  if (createError || !created) {
    throw new Error(
      `No se pudo crear la empresa del usuario: ${
        createError?.message ?? "error desconocido"
      }`
    );
  }

  return created as { id: string; subscription_id: string | null };
}
