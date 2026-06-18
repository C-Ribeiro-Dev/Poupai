import { Suspense } from "react";
import type { Metadata } from "next";
import { getCurrentUser, getCurrentUserId } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { getMovimentacoesPaginadas } from "@/services/movimentacoes";
import { getTiposMovimentacao } from "@/services/tipos";
import { getCategorias } from "@/services/categorias";
import { getContas } from "@/services/contas";
import { MovimentacoesClient } from "./_components/movimentacoes-client";
import MovimentacoesLoading from "./loading";

export const metadata: Metadata = { title: "Movimentações" };

type SearchParams = {
  q?: string;
  period?: string;
  start?: string;
  end?: string;
  dir?: string;
  tipo?: string;
  cat?: string;
  sort?: string;
  order?: string;
  page?: string;
};

export default async function MovimentacoesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [userId, user, sp] = await Promise.all([getCurrentUserId(), getCurrentUser(), searchParams]);
  const isAdmin = isAdminEmail(user?.email);

  const [result, tipos, categorias, contasData] = await Promise.all([
    getMovimentacoesPaginadas(userId, {
      q: sp.q,
      period: sp.period,
      start: sp.start,
      end: sp.end,
      dir: sp.dir,
      tipoId: sp.tipo,
      cat: sp.cat,
      sort: sp.sort,
      order: sp.order,
      page: sp.page ? parseInt(sp.page, 10) : 1,
    }),
    getTiposMovimentacao(userId),
    getCategorias(userId),
    getContas(userId),
  ]);

  return (
    <Suspense fallback={<MovimentacoesLoading />}>
      <MovimentacoesClient
        movimentacoes={result.items}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        tipos={tipos}
        categorias={categorias}
        contas={contasData.contas.filter((c) => c.ativo)}
        isAdmin={isAdmin}
      />
    </Suspense>
  );
}
