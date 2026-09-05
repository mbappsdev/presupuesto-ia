import { createClient } from "@supabase/supabase-js";

export async function getAuthenticatedUser(request: Request) {
  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!accessToken || !supabaseUrl || !supabaseKey) {
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  return error ? null : user;
}
