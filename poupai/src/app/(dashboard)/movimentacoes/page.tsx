import type { Metadata } from "next";
import { getCurrentUser, getCurrentUserId } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { getMovimentacoes } from "@/services/movimentacoes";
import { getTiposMovimentacao } from "@/services/tipos";
import { getCategorias } from "@/services/categorias";
import { getContas } from "@/services/contas";
import { MovimentacoesClient } from "./_components/movimentacoes-client";

export const metadata: Metadata = { title: "Movimentações" };

export default async function MovimentacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [userId, user] = await Promise.all([getCurrentUserId(), getCurrentUser()]);
  const isAdmin = isAdminEmail(user?.email);
  const [{ q }, movimentacoes, tipos, categorias, contasData] = await Promise.all([
    searchParams,
    getMovimentacoes(userId),
    getTiposMovimentacao(userId),
    getCategorias(userId),
    getContas(userId),
  ]);
  return (
    <MovimentacoesClient
      movimentacoes={movimentacoes}
      tipos={tipos}
      categorias={categorias}
      contas={contasData.contas.filter((c) => c.ativo)}
      initialSearch={q}
      isAdmin={isAdmin}
    />
  );
}
