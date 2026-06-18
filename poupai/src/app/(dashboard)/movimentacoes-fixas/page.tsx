import type { Metadata } from "next";
import { getCurrentUserId } from "@/lib/auth";
import { getMovimentacoesFixas } from "@/services/movimentacoes-fixas";
import { getTiposMovimentacao } from "@/services/tipos";
import { getCategorias } from "@/services/categorias";
import { detectarRecorrentes } from "@/services/recorrentes";
import { MovimentacoesFixasClient } from "./_components/movimentacoes-fixas-client";

export const metadata: Metadata = { title: "Movimentações Fixas" };

export default async function MovimentacoesFixasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const userId = await getCurrentUserId();
  const [{ q }, movimentacoesFixas, tipos, categorias, recorrentes] = await Promise.all([
    searchParams,
    getMovimentacoesFixas(userId),
    getTiposMovimentacao(userId),
    getCategorias(userId),
    detectarRecorrentes(userId),
  ]);
  return (
    <MovimentacoesFixasClient
      movimentacoesFixas={movimentacoesFixas}
      tipos={tipos}
      categorias={categorias}
      initialSearch={q}
      sugestoesRecorrentes={recorrentes}
    />
  );
}
