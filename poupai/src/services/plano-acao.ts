import "server-only";
import { getDinheiroDisponivel } from "./dinheiro-disponivel";
import { getProximosCompromissos } from "./compromissos";
import { getSaldoProjetado } from "./saldo-projetado";
import { getSituacaoFinanceira } from "./situacao-financeira";
import type { AcaoPlano, LimiteDiario, PlanoAcaoData, PrioridadePlano, TipoAcao } from "@/types/plano-acao";
import type { CompromissoItem } from "@/types/compromissos";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function gerarId(base: string): string {
  let h = 0;
  for (let i = 0; i < base.length; i++) {
    h = Math.imul(31, h) + base.charCodeAt(i) | 0;
  }
  return Math.abs(h).toString(36);
}

function diasRestantesMes(now: Date): number {
  const ultimoDia = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return Math.max(1, ultimoDia - now.getDate() + 1);
}

function diffDias(a: Date, b: Date): number {
  const da = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const db = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((da.getTime() - db.getTime()) / 86_400_000);
}

function prioridadeComPromisso(c: CompromissoItem): PrioridadePlano {
  if (c.status === "vencido") return "urgente";
  if (c.status === "hoje") return "urgente";
  const diff = diffDias(c.dataVencimento, new Date());
  if (diff <= 2) return "alta";
  if (diff <= 7) return "alta";
  return "media";
}

export async function getPlanoAcao(userId: string): Promise<PlanoAcaoData> {
  const [dinheiro, compromissosData, projetado, situacao] = await Promise.all([
    getDinheiroDisponivel(userId),
    getProximosCompromissos(userId),
    getSaldoProjetado(userId),
    getSituacaoFinanceira(userId),
  ]);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const em7Dias = new Date(today); em7Dias.setDate(today.getDate() + 7);
  const em30Dias = new Date(today); em30Dias.setDate(today.getDate() + 30);

  // ── Limite diário ──────────────────────────────────────────────────────────
  const diasRestantes = diasRestantesMes(now);
  const limiteDiarioValor = Math.max(0, dinheiro.dinheiroDisponivel / diasRestantes);

  let explicacaoLimite: string;
  if (dinheiro.dinheiroDisponivel <= 0) {
    explicacaoLimite = "Dinheiro disponível esgotado. Evite qualquer gasto hoje.";
  } else {
    explicacaoLimite = `${fmt(dinheiro.dinheiroDisponivel)} disponíveis divididos por ${diasRestantes} dias restantes.`;
  }

  const limiteDiario: LimiteDiario = {
    valor: limiteDiarioValor,
    explicacao: explicacaoLimite,
  };

  // ── Compromissos separados por período ────────────────────────────────────
  const pendentes = compromissosData.compromissos.filter(
    (c) => !c.pago && !c.isEntrada
  );

  const comprHoje = pendentes.filter(
    (c) => c.status === "vencido" || c.status === "hoje"
  );
  const comprSemana = pendentes.filter((c) => {
    const diff = diffDias(c.dataVencimento, today);
    return diff > 0 && diff <= 7 && c.status !== "pago";
  });
  const comprMes = pendentes.filter((c) => {
    const diff = diffDias(c.dataVencimento, today);
    return diff > 7 && diff <= 30;
  });

  // ── Ações de HOJE ──────────────────────────────────────────────────────────
  const acoesHoje: AcaoPlano[] = [];

  for (const c of comprHoje.slice(0, 4)) {
    const tipo: TipoAcao = "pagar";
    const labelStatus = c.status === "vencido" ? "VENCIDA" : "vence hoje";
    acoesHoje.push({
      id: gerarId(`hoje-pagar-${c.id}`),
      titulo: `Pagar: ${c.descricao}`,
      descricao: `${fmt(c.valor)} — ${labelStatus}`,
      tipo,
      prioridade: prioridadeComPromisso(c),
      periodo: "hoje",
      valor: c.valor,
      impacto: c.status === "vencido"
        ? "Regularize para evitar juros e negativação"
        : "Pagamento no prazo evita multa",
      href: c.origem.href,
    });
  }

  if (limiteDiarioValor <= 0) {
    acoesHoje.push({
      id: gerarId("hoje-evitar-compras-critico"),
      titulo: "Não fazer nenhum gasto hoje",
      descricao: "Dinheiro disponível zerado. Qualquer gasto compromete suas obrigações.",
      tipo: "evitar_compra",
      prioridade: "urgente",
      periodo: "hoje",
      impacto: "Cada real poupado hoje melhora seu saldo futuro",
    });
  } else if (limiteDiarioValor < 30) {
    acoesHoje.push({
      id: gerarId("hoje-evitar-compras-baixo"),
      titulo: `Limite apertado: máximo ${fmt(limiteDiarioValor)} hoje`,
      descricao: "Seu orçamento está restrito. Evite compras não essenciais.",
      tipo: "evitar_compra",
      prioridade: "alta",
      periodo: "hoje",
      valor: limiteDiarioValor,
    });
  } else if (limiteDiarioValor < 80) {
    acoesHoje.push({
      id: gerarId("hoje-limite-moderado"),
      titulo: `Limite diário: ${fmt(limiteDiarioValor)}`,
      descricao: "Gastos dentro deste limite mantêm suas obrigações do mês cobertas.",
      tipo: "evitar_compra",
      prioridade: "media",
      periodo: "hoje",
      valor: limiteDiarioValor,
    });
  }

  if (projetado.temSaldoNegativo) {
    const alertaNeg = projetado.alertas.find((a) => a.tipo === "saldo_negativo");
    acoesHoje.push({
      id: gerarId("hoje-saldo-negativo"),
      titulo: "Saldo negativo previsto",
      descricao: alertaNeg?.descricao ?? "Seu saldo ficará negativo nos próximos dias. Reduza gastos agora.",
      tipo: "evitar_compra",
      prioridade: "urgente",
      periodo: "hoje",
      href: "/saldo-projetado",
    });
  }

  if (
    situacao.indicadores.comprometimentoRenda.status === "vermelho" &&
    acoesHoje.length < 5
  ) {
    acoesHoje.push({
      id: gerarId("hoje-comprometimento-alto"),
      titulo: "Evitar novos parcelamentos hoje",
      descricao: `${situacao.metricas.comprometimentoPct.toFixed(0)}% da renda comprometida. Não assuma mais dívidas.`,
      tipo: "evitar_compra",
      prioridade: "alta",
      periodo: "hoje",
      href: "/situacao-financeira",
    });
  }

  if (
    situacao.metricas.mesesReserva < 1 &&
    limiteDiarioValor > 50 &&
    acoesHoje.length < 5
  ) {
    const guardarHoje = Math.round(limiteDiarioValor * 0.2 / 10) * 10;
    if (guardarHoje > 0) {
      acoesHoje.push({
        id: gerarId("hoje-guardar-reserva"),
        titulo: `Guardar ${fmt(guardarHoje)} hoje`,
        descricao: "Sua reserva de emergência está zerada. Comece com pequenos valores.",
        tipo: "guardar",
        prioridade: "media",
        periodo: "hoje",
        valor: guardarHoje,
        impacto: "Cada real guardado reduz sua vulnerabilidade financeira",
      });
    }
  }

  // ── Ações da SEMANA ────────────────────────────────────────────────────────
  const acoesSemana: AcaoPlano[] = [];

  for (const c of comprSemana.slice(0, 4)) {
    const diff = diffDias(c.dataVencimento, today);
    const tipo: TipoAcao = c.status === "vencido" ? "antecipar" : "pagar";
    acoesSemana.push({
      id: gerarId(`semana-pagar-${c.id}`),
      titulo: `Pagar: ${c.descricao}`,
      descricao: `${fmt(c.valor)} — vence em ${diff} dia${diff > 1 ? "s" : ""}`,
      tipo,
      prioridade: prioridadeComPromisso(c),
      periodo: "semana",
      valor: c.valor,
      href: c.origem.href,
    });
  }

  if (situacao.metricas.comprometimentoPct > 50 && acoesSemana.length < 5) {
    acoesSemana.push({
      id: gerarId("semana-evitar-parcelamento"),
      titulo: "Evitar parcelamentos esta semana",
      descricao: "Renda muito comprometida. Priorize pagamentos já existentes.",
      tipo: "evitar_compra",
      prioridade: situacao.metricas.comprometimentoPct > 70 ? "alta" : "media",
      periodo: "semana",
      href: "/situacao-financeira",
    });
  }

  if (situacao.metricas.mesesReserva < 3 && acoesSemana.length < 5) {
    const receitaMensal = situacao.metricas.receitaMensal;
    const guardarSemana = Math.round(receitaMensal * 0.05 / 10) * 10;
    if (guardarSemana > 0) {
      acoesSemana.push({
        id: gerarId("semana-guardar"),
        titulo: `Guardar ${fmt(guardarSemana)} esta semana`,
        descricao: `Reserva atual: ${situacao.metricas.mesesReserva.toFixed(1)} meses. Meta: 6 meses.`,
        tipo: "guardar",
        prioridade: situacao.metricas.mesesReserva < 1 ? "alta" : "media",
        periodo: "semana",
        valor: guardarSemana,
        impacto: `Chegar a ${(situacao.metricas.mesesReserva + 0.1).toFixed(1)} meses de reserva`,
      });
    }
  }

  if (situacao.indicadores.faturaCartao.status !== "verde" && acoesSemana.length < 5) {
    acoesSemana.push({
      id: gerarId("semana-fatura-cartao"),
      titulo: "Evitar cartão de crédito esta semana",
      descricao: `Fatura alta: ${fmt(situacao.metricas.faturaCartaoTotal)}. Use dinheiro ou débito.`,
      tipo: "evitar_compra",
      prioridade: situacao.indicadores.faturaCartao.status === "vermelho" ? "alta" : "media",
      periodo: "semana",
      href: "/cartoes",
    });
  }

  const alertaAcumulo = projetado.alertas.find((a) => a.tipo === "acumulo_despesas");
  if (alertaAcumulo && acoesSemana.length < 5) {
    acoesSemana.push({
      id: gerarId("semana-acumulo-despesas"),
      titulo: "Semana com muitos vencimentos",
      descricao: alertaAcumulo.descricao,
      tipo: "revisar",
      prioridade: "alta",
      periodo: "semana",
      href: "/saldo-projetado",
    });
  }

  if (acoesSemana.length < 3) {
    acoesSemana.push({
      id: gerarId("semana-revisar-orcamento"),
      titulo: "Revisar orçamento da semana",
      descricao: "Verifique seus gastos planejados versus realizados.",
      tipo: "revisar",
      prioridade: "baixa",
      periodo: "semana",
      href: "/orcamento",
    });
  }

  // ── Ações do MÊS ──────────────────────────────────────────────────────────
  const acoesMes: AcaoPlano[] = [];

  for (const c of comprMes.slice(0, 2)) {
    const diff = diffDias(c.dataVencimento, today);
    acoesMes.push({
      id: gerarId(`mes-pagar-${c.id}`),
      titulo: `Pagar: ${c.descricao}`,
      descricao: `${fmt(c.valor)} — vence em ${diff} dias`,
      tipo: "pagar",
      prioridade: "media",
      periodo: "mes",
      valor: c.valor,
      href: c.origem.href,
    });
  }

  if (situacao.metricas.totalSaldoDevedor > 0) {
    const divida = situacao.metricas.totalSaldoDevedor;
    acoesMes.push({
      id: gerarId("mes-quitar-divida"),
      titulo: "Priorizar quitação de dívidas",
      descricao: `Saldo devedor total: ${fmt(divida)}. Pague o mínimo e tente antecipar parcelas.`,
      tipo: "pagar",
      prioridade: situacao.indicadores.endividamento.status === "vermelho" ? "alta" : "media",
      periodo: "mes",
      valor: divida,
      href: "/dividas",
      impacto: "Cada parcela antecipada reduz juros pagos no total",
    });
  }

  if (situacao.metricas.mesesReserva < 6 && acoesMes.length < 5) {
    const receitaMensal = situacao.metricas.receitaMensal;
    const guardarMes = Math.round(receitaMensal * 0.1 / 50) * 50;
    if (guardarMes > 0) {
      acoesMes.push({
        id: gerarId("mes-guardar-reserva"),
        titulo: `Guardar ${fmt(guardarMes)} este mês`,
        descricao: `Reserve ao menos 10% da renda. Reserva atual: ${situacao.metricas.mesesReserva.toFixed(1)} meses.`,
        tipo: "guardar",
        prioridade: situacao.metricas.mesesReserva < 2 ? "alta" : "media",
        periodo: "mes",
        valor: guardarMes,
        impacto: `Avançar para ${(situacao.metricas.mesesReserva + 1).toFixed(0)} meses de reserva`,
      });
    }
  }

  for (const rec of situacao.recomendacoes.slice(0, 3)) {
    if (acoesMes.length >= 6) break;
    const tipo: TipoAcao =
      rec.titulo.toLowerCase().includes("reduz") ? "reduzir_gastos"
      : rec.titulo.toLowerCase().includes("quit") ? "pagar"
      : rec.titulo.toLowerCase().includes("guard") ? "guardar"
      : "revisar";
    acoesMes.push({
      id: gerarId(`mes-rec-${rec.titulo}`),
      titulo: rec.titulo,
      descricao: rec.descricao,
      tipo,
      prioridade: rec.prioridade === "alta" ? "alta" : rec.prioridade === "media" ? "media" : "baixa",
      periodo: "mes",
      href: "/situacao-financeira",
    });
  }

  if (acoesMes.length < 3) {
    acoesMes.push({
      id: gerarId("mes-revisar-fixas"),
      titulo: "Revisar despesas fixas",
      descricao: "Identifique assinaturas e despesas que podem ser reduzidas ou canceladas.",
      tipo: "cancelar",
      prioridade: "baixa",
      periodo: "mes",
      href: "/movimentacoes-fixas",
    });
  }

  // ── Ordenar por prioridade ─────────────────────────────────────────────────
  const ordemPrio: Record<string, number> = { urgente: 0, alta: 1, media: 2, baixa: 3 };
  const sortAcoes = (a: AcaoPlano, b: AcaoPlano) =>
    ordemPrio[a.prioridade] - ordemPrio[b.prioridade];

  acoesHoje.sort(sortAcoes);
  acoesSemana.sort(sortAcoes);
  acoesMes.sort(sortAcoes);

  // ── Resumo ─────────────────────────────────────────────────────────────────
  const todas = [...acoesHoje, ...acoesSemana, ...acoesMes];
  const resumo = {
    urgentes: todas.filter((a) => a.prioridade === "urgente").length,
    altas: todas.filter((a) => a.prioridade === "alta").length,
    totalAcoes: todas.length,
    score: situacao.score,
    diagnostico: situacao.diagnostico,
  };

  return {
    limiteDiario,
    acoesHoje,
    acoesSemana,
    acoesMes,
    resumo,
  };
}
