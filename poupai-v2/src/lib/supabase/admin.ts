import "server-only";
import { createClient } from "@supabase/supabase-js";

// Cliente com service role: ignora RLS e acessa a Admin API de usuários.
// Uso exclusivo no servidor, protegido por verificação de admin.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
