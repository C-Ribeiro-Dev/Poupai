import type { Metadata } from "next";
import { getCurrentUserId } from "@/lib/auth";
import { getOrcamentosComGasto } from "@/services/orcamentos";
import { getCategorias } from "@/services/categorias";
import { OrcamentoClient } from "./_components/orcamento-client";

export const metadata: Metadata = { title: "Orçamento" };

export default async function OrcamentoPage() {
  const userId = await getCurrentUserId();
  const now = new Date();
  const meses = Array.from({ length: 6 }, (_, i) =>
    new Date(now.getFullYear(), now.getMonth() - i, 1)
  ).reverse();

  const [historicoRaw, categorias] = await Promise.all([
    Promise.all(meses.map((m) => getOrcamentosComGasto(userId, m))),
    getCategorias(userId),
  ]);

  const data = historicoRaw[historicoRaw.length - 1];
  const historico = historicoRaw.map((d) => ({
    mes: d.mes,
    planejado: d.resumo.totalPlanejado,
    gasto: d.resumo.totalGasto,
  }));

  return <OrcamentoClient data={data} categorias={categorias} historico={historico} />;
}
