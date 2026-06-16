import "server-only";
import { prisma } from "@/lib/prisma";
import { getDinheiroDisponivel } from "./dinheiro-disponivel";
import { getSaldoProjetado } from "./saldo-projetado";
import { getDividas } from "./dividas";
import { getMetas } from "./metas";
import { isEncerrada } from "@/lib/fixas-ciclo";
import type {
  SituacaoFinanceiraData,
  DiagnosticoGeral,
  Indicador,
  Problema,
  PontoPositivo,
  Recomendacao,
  StatusIndicador,
} from "@/types/situacao-financeira";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtPct = (v: number) => `${v.toFixed(0)}%`;
const fmtMeses = (v: number) => `${v.toFixed(1)} meses`;

function statusScore(s: StatusIndicador): number {
  return s === "verde" ? 100 : s === "amarelo" ? 50 : 0;
}

export async function getSituacaoFinanceira(userId: string): Promise<SituacaoFinanceiraData> {
  const now = new Date();

  const [disponivel, projetado, dividas, metas, todasFixas, cartoes] = await Promise.all([
    getDinheiroDisponivel(userId),
    getSaldoProjetado(userId),
    getDividas(userId),
    getMetas(userId),
    prisma.movimentacaoFixa.findMany({
      where: { userId, isDeleted: false, ativo: true },
      select: { valor: true, isEntrada: true, dataFim: true },
    }),
    prisma.cartao.findMany({
      where: { userId, isDeleted: false, ativo: true },
      select: { id: true },
    }),
  ]);

  // ── Métricas base ─────────────────────────────────────────────────────────
  const saldoAtual = disponivel.saldoAtual;

  // Renda e despesas mensais brutas (todas as fixas ativas, pagas ou não)
  const receitaMensal = todasFixas
    .filter((f) => f.isEntrada && !isEncerrada(f.dataFim, now))
    .reduce((acc, f) => acc + Number(String(f.valor)), 0);
  const despesasFixasMensais = todasFixas
    .filter((f) => !f.isEntrada && !isEncerrada(f.dataFim, now))
    .reduce((acc, f) => acc + Number(String(f.valor)), 0);

  // Parcelas de dívidas (mensal)
  const parcelasAtivasDividas = dividas.filter((d) => !d.quitada).length;
  const parcelasDividasMensal = dividas
    .filter((d) => !d.quitada)
    .reduce((acc, d) => acc + d.valorParcela, 0);

  const despesasMensais = despesasFixasMensais + parcelasDividasMensal;

  // Comprometimento da renda
  const comprometimentoPct =
    receitaMensal > 0 ? (despesasMensais / receitaMensal) * 100 : despesasMensais > 0 ? 100 : 0;

  // Reserva financeira em meses
  const burnMensal = despesasMensais > 0 ? despesasMensais : receitaMensal * 0.7;
  const mesesReserva = burnMensal > 0 ? saldoAtual / burnMensal : 99;

  // Saldo devedor total das dívidas
  const totalSaldoDevedor = dividas.filter((d) => !d.quitada).reduce((acc, d) => acc + d.saldoDevedor, 0);

  // Faturas de cartão abertas/fechadas não pagas
  const faturaCartaoTotal = disponivel.detalhes.faturasCartao.reduce((acc, f) => acc + f.valor, 0);

  // Metas ativas
  const metasAtivas = metas.filter((m) => m.status !== "concluida").length;

  // ── Indicadores ───────────────────────────────────────────────────────────

  // 1. Comprometimento da renda
  const stComprometimento: StatusIndicador =
    comprometimentoPct <= 35 ? "verde" : comprometimentoPct <= 60 ? "amarelo" : "vermelho";
  const indComprometimento: Indicador = {
    nome: "Comprometimento da renda",
    valor: fmtPct(comprometimentoPct),
    status: stComprometimento,
    descricao:
      stComprometimento === "verde"
        ? "Suas despesas fixas estão dentro de um limite saudável."
        : stComprometimento === "amarelo"
          ? "Atenção: suas despesas fixas estão consumindo uma parte considerável da sua renda."
          : "Crítico: suas despesas fixas comprometem a maior parte da sua renda.",
    detalhe: receitaMensal > 0 ? `${fmt(despesasMensais)} de ${fmt(receitaMensal)} ao mês` : undefined,
  };

  // 2. Reserva financeira
  const stReserva: StatusIndicador =
    mesesReserva >= 6 ? "verde" : mesesReserva >= 2 ? "amarelo" : "vermelho";
  const indReserva: Indicador = {
    nome: "Reserva financeira",
    valor: mesesReserva >= 99 ? "Adequada" : fmtMeses(mesesReserva),
    status: stReserva,
    descricao:
      stReserva === "verde"
        ? "Você tem uma reserva financeira robusta."
        : stReserva === "amarelo"
          ? "Sua reserva é limitada. Considere aumentá-la."
          : "Sua reserva financeira está baixa. Priorize formá-la.",
    detalhe: fmt(saldoAtual),
  };

  // 3. Saldo projetado
  const saldoFimMes = projetado.saldoFimMes;
  const tendenciaPositiva = saldoFimMes >= saldoAtual * 0.95;
  const stProjetado: StatusIndicador =
    saldoFimMes < 0 ? "vermelho" : tendenciaPositiva ? "verde" : "amarelo";
  const indProjetado: Indicador = {
    nome: "Saldo projetado",
    valor: fmt(saldoFimMes),
    status: stProjetado,
    descricao:
      stProjetado === "verde"
        ? "Seu saldo deve se manter ou crescer até o fim do mês."
        : stProjetado === "amarelo"
          ? "Seu saldo deve cair até o fim do mês."
          : "Seu saldo ficará negativo antes do fim do mês.",
    detalhe: `Atual: ${fmt(saldoAtual)}`,
  };

  // 4. Dinheiro disponível
  const dispPct = saldoAtual > 0 ? (disponivel.dinheiroDisponivel / saldoAtual) * 100 : 0;
  const stDisponivel: StatusIndicador =
    disponivel.dinheiroDisponivel < 0 ? "vermelho" : dispPct >= 20 ? "verde" : "amarelo";
  const indDisponivel: Indicador = {
    nome: "Dinheiro disponível",
    valor: fmt(disponivel.dinheiroDisponivel),
    status: stDisponivel,
    descricao:
      stDisponivel === "verde"
        ? "Você tem uma boa margem disponível após suas obrigações."
        : stDisponivel === "amarelo"
          ? "Sua margem disponível está estreita."
          : "Seu dinheiro disponível está negativo — há mais obrigações do que saldo.",
  };

  // 5. Endividamento
  const endividamentoPct =
    receitaMensal > 0 ? (totalSaldoDevedor / (receitaMensal * 12)) * 100 : 0;
  const stEndividamento: StatusIndicador =
    totalSaldoDevedor === 0
      ? "verde"
      : endividamentoPct <= 30
        ? "verde"
        : endividamentoPct <= 100
          ? "amarelo"
          : "vermelho";
  const indEndividamento: Indicador = {
    nome: "Endividamento",
    valor: totalSaldoDevedor === 0 ? "Sem dívidas" : fmt(totalSaldoDevedor),
    status: stEndividamento,
    descricao:
      stEndividamento === "verde"
        ? totalSaldoDevedor === 0
          ? "Você não possui dívidas ativas. Ótimo!"
          : "Seu nível de endividamento está sob controle."
        : stEndividamento === "amarelo"
          ? `Você tem ${parcelasAtivasDividas} dívida(s) ativa(s). Monitore de perto.`
          : "Seu endividamento está elevado em relação à sua renda.",
    detalhe: parcelasAtivasDividas > 0 ? `${parcelasAtivasDividas} dívida(s) ativa(s)` : undefined,
  };

  // 6. Fatura de cartão
  const faturaPctRenda = receitaMensal > 0 ? (faturaCartaoTotal / receitaMensal) * 100 : 0;
  const stFatura: StatusIndicador =
    faturaCartaoTotal === 0
      ? "verde"
      : faturaPctRenda <= 30
        ? "verde"
        : faturaPctRenda <= 80
          ? "amarelo"
          : "vermelho";
  const indFatura: Indicador = {
    nome: "Fatura de cartão",
    valor: faturaCartaoTotal === 0 ? "Em dia" : fmt(faturaCartaoTotal),
    status: stFatura,
    descricao:
      stFatura === "verde"
        ? faturaCartaoTotal === 0
          ? "Sem faturas pendentes no cartão."
          : "Sua fatura de cartão está em nível saudável."
        : stFatura === "amarelo"
          ? `Sua fatura representa ${fmtPct(faturaPctRenda)} da sua renda mensal.`
          : `Sua fatura é muito alta em relação à renda (${fmtPct(faturaPctRenda)}).`,
  };

  // ── Score e Diagnóstico ───────────────────────────────────────────────────
  const scores = [
    statusScore(stComprometimento),
    statusScore(stReserva),
    statusScore(stProjetado),
    statusScore(stDisponivel),
    statusScore(stEndividamento),
    statusScore(stFatura),
  ];
  const score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const diagnostico: DiagnosticoGeral =
    score >= 70 ? "estavel" : score >= 40 ? "atencao" : "critica";

  // ── Problemas ─────────────────────────────────────────────────────────────
  const problemas: Problema[] = [];

  if (stComprometimento === "vermelho") {
    problemas.push({
      titulo: "Comprometimento excessivo da renda",
      descricao: `Suas despesas fixas e parcelas consomem ${fmtPct(comprometimentoPct)} da sua renda. O ideal é manter abaixo de 35%.`,
      severidade: "critico",
    });
  } else if (stComprometimento === "amarelo") {
    problemas.push({
      titulo: "Renda comprometida acima do ideal",
      descricao: `${fmtPct(comprometimentoPct)} da sua renda está comprometida com despesas fixas e parcelas.`,
      severidade: "aviso",
    });
  }

  if (stProjetado === "vermelho") {
    problemas.push({
      titulo: "Saldo negativo previsto",
      descricao: `Seu saldo deve ficar negativo (${fmt(saldoFimMes)}) até o fim do mês com os compromissos atuais.`,
      severidade: "critico",
    });
  } else if (stProjetado === "amarelo") {
    problemas.push({
      titulo: "Saldo em queda",
      descricao: `Seu saldo deve cair de ${fmt(saldoAtual)} para ${fmt(saldoFimMes)} até o fim do mês.`,
      severidade: "aviso",
    });
  }

  if (stDisponivel === "vermelho") {
    problemas.push({
      titulo: "Dinheiro disponível negativo",
      descricao: "Suas obrigações financeiras superam seu saldo atual. Evite novos gastos.",
      severidade: "critico",
    });
  }

  if (stReserva === "vermelho") {
    problemas.push({
      titulo: "Reserva financeira insuficiente",
      descricao: `Seu saldo cobre menos de 2 meses de despesas (${fmtMeses(Math.max(0, mesesReserva))}). Uma emergência pode comprometer suas finanças.`,
      severidade: "critico",
    });
  }

  if (stFatura === "vermelho") {
    problemas.push({
      titulo: "Fatura de cartão elevada",
      descricao: `Sua fatura pendente (${fmt(faturaCartaoTotal)}) representa ${fmtPct(faturaPctRenda)} da sua renda mensal.`,
      severidade: "critico",
    });
  } else if (stFatura === "amarelo") {
    problemas.push({
      titulo: "Fatura de cartão acima do ideal",
      descricao: `Fatura pendente de ${fmt(faturaCartaoTotal)} (${fmtPct(faturaPctRenda)} da renda).`,
      severidade: "aviso",
    });
  }

  if (stEndividamento === "vermelho") {
    problemas.push({
      titulo: "Endividamento elevado",
      descricao: `Suas dívidas somam ${fmt(totalSaldoDevedor)}, equivalente a ${fmtPct(endividamentoPct)} da sua renda anual.`,
      severidade: "critico",
    });
  }

  // ── Pontos Positivos ──────────────────────────────────────────────────────
  const pontosPositivos: PontoPositivo[] = [];

  if (stComprometimento === "verde") {
    pontosPositivos.push({
      titulo: "Despesas fixas sob controle",
      descricao: `Apenas ${fmtPct(comprometimentoPct)} da sua renda está comprometida com despesas recorrentes.`,
    });
  }

  if (totalSaldoDevedor === 0) {
    pontosPositivos.push({
      titulo: "Sem dívidas ativas",
      descricao: "Você não possui dívidas em aberto. Continue assim!",
    });
  } else if (stEndividamento === "verde") {
    pontosPositivos.push({
      titulo: "Endividamento controlado",
      descricao: `Suas dívidas estão em um nível gerenciável em relação à sua renda.`,
    });
  }

  if (stProjetado === "verde") {
    pontosPositivos.push({
      titulo: "Fluxo financeiro positivo",
      descricao: `Seu saldo deve se manter ou crescer até o fim do mês (${fmt(saldoFimMes)}).`,
    });
  }

  if (stReserva === "verde") {
    pontosPositivos.push({
      titulo: "Reserva financeira adequada",
      descricao: `Você tem ${fmtMeses(mesesReserva)} de reserva. Isso é ótimo para lidar com imprevistos.`,
    });
  }

  if (faturaCartaoTotal === 0) {
    pontosPositivos.push({
      titulo: "Cartão em dia",
      descricao: "Sem faturas pendentes de cartão de crédito.",
    });
  }

  if (metasAtivas > 0) {
    pontosPositivos.push({
      titulo: "Metas financeiras ativas",
      descricao: `Você tem ${metasAtivas} meta(s) de poupança ativa(s). Manter o foco em objetivos é fundamental.`,
    });
  }

  // ── Recomendações ─────────────────────────────────────────────────────────
  const recomendacoes: Recomendacao[] = [];

  if (saldoFimMes < 0 || disponivel.dinheiroDisponivel < 0) {
    recomendacoes.push({
      prioridade: "alta",
      titulo: "Evite novos gastos imediatamente",
      descricao: "Seu saldo ou dinheiro disponível está negativo. Priorize pagar obrigações existentes antes de assumir novos compromissos.",
    });
  }

  if (faturaCartaoTotal > 0 && stFatura !== "verde") {
    recomendacoes.push({
      prioridade: "alta",
      titulo: "Quite a fatura do cartão",
      descricao: `Pague ${fmt(faturaCartaoTotal)} de fatura pendente para evitar juros e comprometimento do crédito.`,
    });
  }

  if (comprometimentoPct > 60) {
    recomendacoes.push({
      prioridade: "alta",
      titulo: "Reduza despesas fixas",
      descricao: `Com ${fmtPct(comprometimentoPct)} da renda comprometida, revise contratos recorrentes e identifique o que pode ser cortado.`,
    });
  } else if (comprometimentoPct > 35) {
    recomendacoes.push({
      prioridade: "media",
      titulo: "Reduza gradualmente os compromissos fixos",
      descricao: "Seu comprometimento de renda está acima do ideal. Evite novos gastos fixos.",
    });
  }

  if (stReserva !== "verde" && saldoAtual >= 0) {
    const metaMeses = stReserva === "vermelho" ? 3 : 6;
    const valorAlvoReserva = burnMensal * metaMeses;
    recomendacoes.push({
      prioridade: stReserva === "vermelho" ? "alta" : "media",
      titulo: `Monte uma reserva de ${metaMeses} meses`,
      descricao: `Objetivo: ${fmt(valorAlvoReserva)}. Separe ao menos 10% da sua renda mensal até atingir essa meta.`,
    });
  }

  if (parcelasAtivasDividas > 0 && stEndividamento !== "verde") {
    const maiorDivida = dividas
      .filter((d) => !d.quitada)
      .sort((a, b) => b.taxaJurosMensal - a.taxaJurosMensal)[0];
    recomendacoes.push({
      prioridade: stEndividamento === "vermelho" ? "alta" : "media",
      titulo: "Priorize quitar a dívida mais cara",
      descricao: maiorDivida
        ? `${maiorDivida.credor} tem taxa de ${maiorDivida.taxaJurosMensal.toFixed(1)}% a.m. Saldo devedor: ${fmt(maiorDivida.saldoDevedor)}.`
        : "Concentre esforços na dívida com maior taxa de juros.",
    });
  }

  if (comprometimentoPct < 50 && stReserva === "verde" && metasAtivas === 0) {
    recomendacoes.push({
      prioridade: "media",
      titulo: "Crie metas financeiras",
      descricao: "Sua situação está estável. Agora é hora de definir objetivos: reserva de emergência, viagem, imóvel ou aposentadoria.",
    });
  }

  if (stDisponivel === "amarelo" || comprometimentoPct > 40) {
    recomendacoes.push({
      prioridade: "media",
      titulo: "Evite novas compras parceladas",
      descricao: "Adicionar novas parcelas aumentaria ainda mais o comprometimento da sua renda.",
    });
  }

  if (stReserva === "verde" && stComprometimento === "verde" && totalSaldoDevedor === 0) {
    recomendacoes.push({
      prioridade: "baixa",
      titulo: "Considere investir o excedente",
      descricao: "Sua situação financeira está saudável. Investir o que sobra pode acelerar suas metas.",
    });
  }

  // Ordenar recomendações: alta → media → baixa
  const ordemPrio = { alta: 0, media: 1, baixa: 2 };
  recomendacoes.sort((a, b) => ordemPrio[a.prioridade] - ordemPrio[b.prioridade]);

  return {
    diagnostico,
    score,
    metricas: {
      saldoAtual,
      receitaMensal,
      despesasMensais,
      dinheiroDisponivel: disponivel.dinheiroDisponivel,
      saldoFimMes,
      totalSaldoDevedor,
      parcelasAtivasDividas,
      faturaCartaoTotal,
      metasAtivas,
      comprometimentoPct,
      mesesReserva: Math.max(0, mesesReserva),
    },
    indicadores: {
      comprometimentoRenda: indComprometimento,
      reservaFinanceira: indReserva,
      saldoProjetado: indProjetado,
      dinheiroDisponivel: indDisponivel,
      endividamento: indEndividamento,
      faturaCartao: indFatura,
    },
    problemas: problemas.sort((a, b) => (a.severidade === "critico" ? -1 : 1)),
    pontosPositivos,
    recomendacoes,
  };
}
