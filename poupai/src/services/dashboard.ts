import "server-only";
import { prisma } from "@/lib/prisma";
import type { DashboardData } from "@/types/dashboard";
import { getInsightsMes } from "./insights";
import { getOrcamentosComGasto } from "./orcamentos";
import { getMetasResumo } from "./metas";
import { isPagoNoCiclo, vencimentoNoCiclo, isEncerrada } from "@/lib/fixas-ciclo";
import { mesRefPrimeiraParcela, mesRefToString, addMeses, valorParcela } from "@/lib/cartao-fatura";

export async function getDashboardData(userId: string, mesRef?: Date): Promise<DashboardData> {
  const now = new Date();
  const ref = mesRef ?? now;
  const startOfMonth = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const startOfNextMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 1);

  const [
    receitasMesAgg,
    despesasMesAgg,
    totalEntradasAgg,
    totalSaidasAgg,
    ultimasMovimentacoes,
    fixasAtivas,
    proximosVencimentos,
    insights,
    orcamentosData,
    metas,
    cartoesAtivos,
    comprasCartao,
  ] = await Promise.all([
    prisma.movimentacao.aggregate({
      where: {
        userId,
        isDeleted: false,
        isEntrada: true,
        data: { gte: startOfMonth, lt: startOfNextMonth },
      },
      _sum: { valor: true },
    }),
    prisma.movimentacao.aggregate({
      where: {
        userId,
        isDeleted: false,
        isEntrada: false,
        data: { gte: startOfMonth, lt: startOfNextMonth },
      },
      _sum: { valor: true },
    }),
    prisma.movimentacao.aggregate({
      where: { userId, isDeleted: false, isEntrada: true },
      _sum: { valor: true },
    }),
    prisma.movimentacao.aggregate({
      where: { userId, isDeleted: false, isEntrada: false },
      _sum: { valor: true },
    }),
    prisma.movimentacao.findMany({
      where: { userId, isDeleted: false },
      orderBy: { data: "desc" },
      take: 7,
      select: {
        id: true,
        valor: true,
        isEntrada: true,
        data: true,
        categoria: true,
        descricao: true,
        isFixaOuDiaria: true,
        tipo: { select: { nome: true } },
      },
    }),
    prisma.movimentacaoFixa.findMany({
      where: { userId, isDeleted: false, ativo: true },
      select: {
        pago: true,
        dataUltimoPagamento: true,
        diaVencimento: true,
        dataVencimento: true,
        dataFim: true,
      },
    }),
    prisma.movimentacaoFixa.findMany({
      where: { userId, isDeleted: false, ativo: true },
      select: {
        id: true,
        nome: true,
        valor: true,
        isEntrada: true,
        diaVencimento: true,
        dataVencimento: true,
        dataFim: true,
        pago: true,
        dataUltimoPagamento: true,
        categoria: true,
        formaPagamento: true,
      },
    }),
    getInsightsMes(userId, ref),
    getOrcamentosComGasto(userId, ref),
    getMetasResumo(userId),
    prisma.cartao.findMany({
      where: { userId, isDeleted: false, ativo: true },
      select: { id: true, diaFechamento: true },
    }),
    prisma.compraCartao.findMany({
      where: { userId, isDeleted: false },
      select: {
        cartaoId: true,
        valorTotal: true,
        parcelas: true,
        dataCompra: true,
        recorrente: true,
      },
    }),
  ]);

  const receitasMes = Number(String(receitasMesAgg._sum.valor ?? 0));
  const despesasMes = Number(String(despesasMesAgg._sum.valor ?? 0));
  const totalEntradas = Number(String(totalEntradasAgg._sum.valor ?? 0));
  const totalSaidas = Number(String(totalSaidasAgg._sum.valor ?? 0));

  // Ciclo mensal: "pago" vale só no mês do último pagamento; encerradas ficam de fora
  const fixasDoCiclo = fixasAtivas.filter((f) => !isEncerrada(f.dataFim, now));
  const fixasPagas = fixasDoCiclo.filter((f) =>
    isPagoNoCiclo(f.pago, f.dataUltimoPagamento, now)
  ).length;
  const fixasPendentes = fixasDoCiclo.length - fixasPagas;
  const fixasVencidas = fixasDoCiclo.filter((f) => {
    if (isPagoNoCiclo(f.pago, f.dataUltimoPagamento, now)) return false;
    const venc = vencimentoNoCiclo(f.diaVencimento, f.dataVencimento, now);
    return venc !== null && venc < now;
  }).length;

  // ── Previsão próximo mês ─────────────────────────────────────────────────
  const proximoMes = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const proximoMesKey = mesRefToString({ ano: proximoMes.getFullYear(), mes: proximoMes.getMonth() });

  let receitasFixasProximoMes = 0;
  let despesasFixasProximoMes = 0;

  for (const f of proximosVencimentos) {
    if (isEncerrada(f.dataFim, proximoMes)) continue;
    const venc = vencimentoNoCiclo(f.diaVencimento, f.dataVencimento, proximoMes);
    if (venc === null) continue;
    // Fixas com data específica só entram se cair no próximo mês
    if (!f.diaVencimento && f.dataVencimento) {
      const vencDate = new Date(f.dataVencimento);
      if (vencDate.getFullYear() !== proximoMes.getFullYear() || vencDate.getMonth() !== proximoMes.getMonth()) continue;
    }
    const valor = Number(String(f.valor));
    if (f.isEntrada) receitasFixasProximoMes += valor;
    else despesasFixasProximoMes += valor;
  }

  let totalFaturasProximoMes = 0;
  for (const cartao of cartoesAtivos) {
    for (const compra of comprasCartao.filter((c) => c.cartaoId === cartao.id)) {
      const total = Number(String(compra.valorTotal));
      const primeira = mesRefPrimeiraParcela(compra.dataCompra, cartao.diaFechamento);
      if (compra.recorrente) {
        if (mesRefToString(primeira) <= proximoMesKey) totalFaturasProximoMes += total;
      } else {
        for (let i = 0; i < compra.parcelas; i++) {
          if (mesRefToString(addMeses(primeira, i)) === proximoMesKey) {
            totalFaturasProximoMes += valorParcela(total, compra.parcelas, i);
            break;
          }
        }
      }
    }
  }

  // ── Projeção fim do mês ──────────────────────────────────────────────────
  const proximosAll = proximosVencimentos.filter(
    (f) => !isEncerrada(f.dataFim, now) && !isPagoNoCiclo(f.pago, f.dataUltimoPagamento, now)
  );
  const receitasPendentes = proximosAll
    .filter((f) => f.isEntrada)
    .reduce((s, f) => s + Number(String(f.valor)), 0);
  const despesasPendentes = proximosAll
    .filter((f) => !f.isEntrada)
    .reduce((s, f) => s + Number(String(f.valor)), 0);
  const saldoTotal = totalEntradas - totalSaidas;

  return {
    resumoMes: {
      receitas: receitasMes,
      despesas: despesasMes,
      saldo: receitasMes - despesasMes,
    },
    saldoTotal,
    projecao: {
      saldoProjetado: saldoTotal + receitasPendentes - despesasPendentes,
      receitasPendentes,
      despesasPendentes,
    },
    fixasPendentes,
    fixasPagas,
    fixasVencidas,
    ultimasMovimentacoes: ultimasMovimentacoes.map((m) => ({
      id: m.id,
      descricao: m.descricao,
      tipoNome: m.tipo.nome,
      categoria: m.categoria,
      valor: Number(String(m.valor)),
      isEntrada: m.isEntrada,
      data: m.data,
      isFixaOuDiaria: m.isFixaOuDiaria,
    })),
    proximosVencimentos: proximosVencimentos
      .filter(
        (f) =>
          !isEncerrada(f.dataFim, now) &&
          !isPagoNoCiclo(f.pago, f.dataUltimoPagamento, now)
      )
      .map((f) => ({
        f,
        venc: vencimentoNoCiclo(f.diaVencimento, f.dataVencimento, now),
      }))
      .filter((x): x is typeof x & { venc: Date } => x.venc !== null)
      .sort((a, b) => a.venc.getTime() - b.venc.getTime())
      .slice(0, 5)
      .map(({ f, venc }) => ({
        id: f.id,
        nome: f.nome,
        valor: Number(String(f.valor)),
        isEntrada: f.isEntrada,
        diaVencimento: f.diaVencimento,
        dataVencimento: venc,
        categoria: f.categoria,
        formaPagamento: f.formaPagamento,
      })),
    previsaoProximoMes: {
      receitas: receitasFixasProximoMes,
      despesas: despesasFixasProximoMes + totalFaturasProximoMes,
      mesNome: new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(proximoMes),
    },
    mes: new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(ref),
    insights,
    orcamento:
      orcamentosData.orcamentos.length > 0
        ? {
            totalPlanejado: orcamentosData.resumo.totalPlanejado,
            totalGasto: orcamentosData.resumo.totalGasto,
            categoriasEstouradas: orcamentosData.resumo.categoriasEstouradas,
            categoriasEmAtencao: orcamentosData.resumo.categoriasEmAtencao,
          }
        : null,
    metas,
  };
}
