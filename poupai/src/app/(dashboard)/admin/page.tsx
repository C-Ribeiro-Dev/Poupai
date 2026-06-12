import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { isAdminEmail, hasServiceRoleKey } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UsuarioRow } from "@/types/admin";
import { AdminClient } from "./_components/admin-client";

export const metadata: Metadata = { title: "Administração" };

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!isAdminEmail(user?.email)) redirect("/");

  if (!hasServiceRoleKey()) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-amber-500/10">
          <KeyRound className="size-6 text-amber-500" />
        </div>
        <div className="max-w-md">
          <h1 className="text-lg font-semibold">Falta configurar a chave secreta</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Para gerenciar usuários, adicione a variável{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              SUPABASE_SERVICE_ROLE_KEY
            </code>{" "}
            no arquivo <code className="rounded bg-muted px-1.5 py-0.5 text-xs">.env.local</code>.
            Você encontra a chave em{" "}
            <span className="font-medium text-foreground">
              Supabase → Settings → API Keys → secret
            </span>
            . Depois reinicie o servidor.
          </p>
        </div>
      </div>
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 100 });

  const usuarios: UsuarioRow[] = error
    ? []
    : data.users.map((u) => ({
        id: u.id,
        email: u.email ?? "—",
        nome: (u.user_metadata?.nome as string | undefined) ?? null,
        criadoEm: u.created_at,
        ultimoLogin: u.last_sign_in_at ?? null,
        isAdmin: isAdminEmail(u.email),
        senhaTemp: (u.user_metadata?.senha_temp as string | undefined) ?? null,
        acessoCompartilhado: !!(u.user_metadata?.acesso_compartilhado as boolean | undefined),
      }));

  return (
    <AdminClient
      usuarios={usuarios}
      currentUserId={user!.id}
      loadError={error ? error.message : null}
    />
  );
}
