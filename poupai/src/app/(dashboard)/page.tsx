import type { Metadata } from "next";
import { getCurrentUserId } from "@/lib/auth";
import { getDashboardData } from "@/services/dashboard";
import { getAnalyticsData } from "@/services/analytics";
import { getContas } from "@/services/contas";
import { getCartoes } from "@/services/cartoes";
import { DashboardClient } from "./_components/dashboard-client";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const userId = await getCurrentUserId();
  const [dashData, analytics, contasData, cartoes] = await Promise.all([
    getDashboardData(userId),
    getAnalyticsData(userId, "6m"),
    getContas(userId),
    getCartoes(userId),
  ]);

  const totalFaturas = cartoes
    .filter((c) => c.ativo && c.faturaAtual && !c.faturaAtual.paga)
    .reduce((acc, c) => acc + (c.faturaAtual ? Math.max(0, c.faturaAtual.total - c.faturaAtual.totalPago) : 0), 0);

  return (
    <DashboardClient
      resumoMes={dashData.resumoMes}
      saldoTotal={dashData.saldoTotal}
      projecao={dashData.projecao}
      fixasPendentes={dashData.fixasPendentes}
      fixasPagas={dashData.fixasPagas}
      fixasVencidas={dashData.fixasVencidas}
      mes={dashData.mes}
      insights={dashData.insights}
      orcamento={dashData.orcamento}
      metas={dashData.metas}
      ultimasMovimentacoes={dashData.ultimasMovimentacoes.map((m) => ({
        ...m,
        data: m.data.toISOString(),
      }))}
      proximosVencimentos={dashData.proximosVencimentos.map((v) => ({
        ...v,
        dataVencimento: v.dataVencimento.toISOString(),
      }))}
      tendencia={analytics.meses}
      saldoConsolidado={contasData.saldoConsolidado}
      contas={contasData.contas
        .filter((c) => c.ativo)
        .map((c) => ({ id: c.id, nome: c.nome, cor: c.cor, saldoAtual: c.saldoAtual }))}
      totalFaturas={totalFaturas}
    />
  );
}
