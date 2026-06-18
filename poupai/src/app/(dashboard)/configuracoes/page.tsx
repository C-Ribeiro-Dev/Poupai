import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ConfiguracoesClient } from "./_components/configuracoes-client";

export const metadata: Metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const nome = (user.user_metadata?.nome as string | undefined) ?? "";
  const email = user.email ?? "";

  return <ConfiguracoesClient nome={nome} email={email} />;
}
