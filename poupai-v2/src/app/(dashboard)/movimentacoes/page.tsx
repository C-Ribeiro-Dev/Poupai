import type { Metadata } from "next";
import { getCurrentUserId } from "@/lib/auth";
import { getMovimentacoes } from "@/services/movimentacoes";
import { getTiposMovimentacao } from "@/services/tipos";
import { getCategorias } from "@/services/categorias";
import { MovimentacoesClient } from "./_components/movimentacoes-client";

export const metadata: Metadata = { title: "Movimentações" };

export default async function MovimentacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const userId = await getCurrentUserId();
  const [{ q }, movimentacoes, tipos, categorias] = await Promise.all([
    searchParams,
    getMovimentacoes(userId),
    getTiposMovimentacao(userId),
    getCategorias(userId),
  ]);
  return (
    <MovimentacoesClient
      movimentacoes={movimentacoes}
      tipos={tipos}
      categorias={categorias}
      initialSearch={q}
    />
  );
}
