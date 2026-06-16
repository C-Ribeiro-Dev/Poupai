import "server-only";
import { prisma } from "@/lib/prisma";
import { getContas } from "./contas";
import { getCartoes } from "./cartoes";
import { getDividas } from "./dividas";
import { isPagoNoCiclo, isEncerrada } from "@/lib/fixas-ciclo";
import { mesRefToString, addMeses, mesRefFaturaAberta } from "@/lib/cartao-fatura";
import type {
  EventoProjetado,
  EventoTipo,
  AlertaSaldoProjetado,
  SaldoProjetadoData,
} from "@/types/saldo-projetado";

// Gera todas as ocorrências mensais de uma fixa dentro do intervalo [inicio, fim]
function gerarOcorrenciasFixa(
  fixa: {
    diaVencimento: number | null;
    dataVencimento: Date | null;
    dataFim: Date | null;
    pago: boolean;
    dataUltimoPagamento: Date | null | undefined;
  },
  inicio: Date,
  fim: Date
): Date[] {
  const ocorrencias: Date[] = [];

  if (fixa.diaVencimento) {
    let cursor = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
    while (cursor <= fim) {
      if (isEncerrada(fixa.dataFim, cursor)) {
        cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
        continue;
      }
      const ultimoDia = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
      const dia = Math.min(fixa.diaVencimento, ultimoDia);
      const venc = new Date(cursor.getFullYear(), cursor.getMonth(), dia, 12);
      if (venc >= inicio && venc <= fim) {
        const pagoNesteMes = isPagoNoCiclo(fixa.pago, fixa.dataUltimoPagamento ?? null, cursor);
        if (!pagoNesteMes) ocorrencias.push(venc);
      }
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }
  } else if (fixa.dataVencimento) {
    const venc = new Date(fixa.dataVencimento);
    if (venc >= inicio && venc <= fim) {
      const pagoNesteMes = isPagoNoCiclo(fixa.pago, fixa.dataUltimoPagamento ?? null, venc);
      if (!pagoNesteMes) ocorrencias.push(venc);
    }
  }

  return ocorrencias;
}

export async function getSaldoProjetado(userId: string): Promise<SaldoProjetadoData> {
  const now = new Date();
  const hoje = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  // Busca sempre 90 dias para o cliente filtrar conforme o período selecionado
  const fim = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 90, 23, 59, 59);

  const [contasData, cartoes, dividas, fixasRaw, movsFuturas] = await Promise.all([
    getContas(userId),
    getCartoes(userId),
    getDividas(userId),
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
    prisma.movimentacao.findMany({
      where: { userId, isDeleted: false, data: { gte: hoje, lte: fim } },
      orderBy: { data: "asc" },
      select: {
        id: true,
        valor: true,
        isEntrada: true,
        data: true,
        categoria: true,
        descricao: true,
        tipo: { select: { nome: true } },
      },
    }),
  ]);

  const saldoAtual = contasData.saldoConsolidado;
  const eventos: Omit<EventoProjetado, "saldoAntes" | "saldoDepois" | "variacao">[] = [];

  // ── Movimentações fixas ───────────────────────────────────────────────────
  for (const f of fixasRaw) {
    const ocorrencias = gerarOcorrenciasFixa(
      {
        diaVencimento: f.diaVencimento,
        dataVencimento: f.dataVencimento,
        dataFim: f.dataFim,
        pago: f.pago,
        dataUltimoPagamento: f.dataUltimoPagamento,
      },
      hoje,
      fim
    );
    for (const [i, data] of ocorrencias.entries()) {
      const tipo: EventoTipo = f.isEntrada ? "fixa_receita" : "fixa_despesa";
      eventos.push({
        id: `fixa-${f.id}-${i}`,
        tipo,
        descricao: f.nome,
        categoria: f.categoria,
        valor: Number(String(f.valor)),
        isEntrada: f.isEntrada,
        data,
        pago: false,
        origem: { href: "/movimentacoes-fixas", label: "Ver conta fixa" },
      });
    }
  }

  // ── Faturas de cartão ─────────────────────────────────────────────────────
  const refAtual = mesRefToString(mesRefFaturaAberta(0, now)); // referência para comparação
  for (const cartao of cartoes.filter((c) => c.ativo)) {
    for (const fatura of cartao.faturas) {
      if (fatura.paga) continue;
      const saldoFatura = Math.max(0, fatura.total - fatura.totalPago);
      if (saldoFatura < 0.01) continue;
      if (fatura.vencimento < hoje || fatura.vencimento > fim) continue;

      eventos.push({
        id: `fatura-${cartao.id}-${fatura.mesRef}`,
        tipo: "fatura_cartao",
        descricao: `Fatura ${cartao.nome}`,
        categoria: "Cartão de crédito",
        valor: Math.round(saldoFatura * 100) / 100,
        isEntrada: false,
        data: fatura.vencimento,
        pago: false,
        origem: { href: "/cartoes", label: "Ver fatura" },
      });
    }
  }

  // ── Dívidas — parcelas futuras ────────────────────────────────────────────
  for (const d of dividas.filter((d) => !d.quitada)) {
    if (!d.dataProxVencimento) continue;
    const parcelasRestantes = d.nParcelas - d.parcelasPagas;
    for (let i = 0; i < parcelasRestantes; i++) {
      const base = new Date(d.dataProxVencimento);
      const data = new Date(base.getFullYear(), base.getMonth() + i, base.getDate(), 12);
      if (data < hoje) continue;
      if (data > fim) break;
      eventos.push({
        id: `divida-${d.id}-${i}`,
        tipo: "divida",
        descricao: `${d.credor}${d.descricao ? ` — ${d.descricao}` : ""} (${d.parcelasPagas + i + 1}/${d.nParcelas})`,
        categoria: d.categoria,
        valor: Math.round(d.valorParcela * 100) / 100,
        isEntrada: false,
        data,
        pago: false,
        origem: { href: "/dividas", label: "Ver dívida" },
      });
    }
  }

  // ── Movimentações futuras avulsas ─────────────────────────────────────────
  for (const m of movsFuturas) {
    eventos.push({
      id: `mov-${m.id}`,
      tipo: m.isEntrada ? "movimentacao_entrada" : "movimentacao_saida",
      descricao: m.descricao ?? m.tipo.nome,
      categoria: m.categoria,
      valor: Number(String(m.valor)),
      isEntrada: m.isEntrada,
      data: m.data,
      pago: false,
      origem: { href: "/movimentacoes", label: "Ver movimentação" },
    });
  }

  // ── Ordenar e calcular saldo acumulado ────────────────────────────────────
  eventos.sort((a, b) => a.data.getTime() - b.data.getTime());

  let saldoCorrente = saldoAtual;
  const eventosCompletos: EventoProjetado[] = eventos.map((e) => {
    const saldoAntes = saldoCorrente;
    const variacao = e.isEntrada ? e.valor : -e.valor;
    saldoCorrente += variacao;
    return { ...e, saldoAntes, saldoDepois: saldoCorrente, variacao };
  });

  // ── Estatísticas globais (90 dias) ─────────────────────────────────────────
  const saldosComData = [
    { valor: saldoAtual, data: hoje },
    ...eventosCompletos.map((e) => ({ valor: e.saldoDepois, data: e.data })),
  ];

  const maiorEntry = saldosComData.reduce((a, b) => (b.valor > a.valor ? b : a));
  const menorEntry = saldosComData.reduce((a, b) => (b.valor < a.valor ? b : a));

  const fimMesAtual = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const fimProxMes = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);

  const calcSaldoEm = (dataFim: Date) => {
    const eventosFiltrados = eventosCompletos.filter((e) => e.data <= dataFim);
    if (!eventosFiltrados.length) return saldoAtual;
    return eventosFiltrados[eventosFiltrados.length - 1].saldoDepois;
  };

  const saldoFimMes = calcSaldoEm(fimMesAtual);
  const saldoProxMes = calcSaldoEm(fimProxMes);

  const temSaldoNegativo = saldosComData.some((s) => s.valor < 0);

  // ── Alertas ───────────────────────────────────────────────────────────────
  const alertas: AlertaSaldoProjetado[] = [];

  const primeiroNegativo = saldosComData.find((s) => s.valor < 0);
  if (primeiroNegativo) {
    alertas.push({
      tipo: "saldo_negativo",
      descricao: `Saldo negativo previsto a partir de ${primeiroNegativo.data.toLocaleDateString("pt-BR")}`,
      data: primeiroNegativo.data,
      valor: primeiroNegativo.valor,
      severidade: "critico",
    });
  }

  const GRANDE_VENCIMENTO_THRESHOLD = saldoAtual * 0.3;
  const grandesVencimentos = eventosCompletos.filter(
    (e) => !e.isEntrada && e.valor >= Math.max(500, GRANDE_VENCIMENTO_THRESHOLD)
  );
  for (const gv of grandesVencimentos.slice(0, 2)) {
    alertas.push({
      tipo: "grande_vencimento",
      descricao: `${gv.descricao}: R$ ${gv.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} em ${gv.data.toLocaleDateString("pt-BR")}`,
      data: gv.data,
      valor: gv.valor,
      severidade: "aviso",
    });
  }

  // Acúmulo: mais de 3 eventos de saída no mesmo dia somando >20% do saldo
  const eventosPorDia = new Map<string, number>();
  for (const e of eventosCompletos.filter((e) => !e.isEntrada)) {
    const key = e.data.toISOString().slice(0, 10);
    eventosPorDia.set(key, (eventosPorDia.get(key) ?? 0) + e.valor);
  }
  for (const [dia, total] of eventosPorDia) {
    if (total > saldoAtual * 0.2 && total > 300) {
      alertas.push({
        tipo: "acumulo_despesas",
        descricao: `Dia ${new Date(dia + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}: R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} em despesas`,
        data: new Date(dia + "T12:00:00"),
        valor: total,
        severidade: "aviso",
      });
      break; // máximo 1 alerta de acúmulo
    }
  }

  return {
    saldoAtual,
    eventos: eventosCompletos,
    saldoFimMes,
    saldoProxMes,
    maiorSaldo: { valor: maiorEntry.valor, data: maiorEntry.data },
    menorSaldo: { valor: menorEntry.valor, data: menorEntry.data },
    temSaldoNegativo,
    alertas,
  };
}
