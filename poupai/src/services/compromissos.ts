import "server-only";
import { prisma } from "@/lib/prisma";
import { getContas } from "./contas";
import { getCartoes } from "./cartoes";
import { getDividas } from "./dividas";
import { isPagoNoCiclo, vencimentoNoCiclo, isEncerrada } from "@/lib/fixas-ciclo";
import type {
  CompromissoItem,
  CompromissoStatus,
  CompromissoTipo,
  ProximosCompromissosData,
} from "@/types/compromissos";

function calcStatus(data: Date, pago: boolean, now: Date): CompromissoStatus {
  if (pago) return "pago";
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (diff < 0) return "vencido";
  if (diff === 0) return "hoje";
  if (diff <= 7) return "proximo";
  return "futuro";
}

export async function getProximosCompromissos(userId: string): Promise<ProximosCompromissosData> {
  const now = new Date();

  const [contasData, fixasRaw, cartoes, dividas, movsFuturas] = await Promise.all([
    getContas(userId),
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
    getCartoes(userId),
    getDividas(userId),
    prisma.movimentacao.findMany({
      where: {
        userId,
        isDeleted: false,
        data: { gt: now },
      },
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
  const compromissos: CompromissoItem[] = [];

  // ── Movimentações fixas ──────────────────────────────────────────────────
  for (const f of fixasRaw) {
    if (isEncerrada(f.dataFim, now)) continue;
    const pago = isPagoNoCiclo(f.pago, f.dataUltimoPagamento, now);
    const venc = vencimentoNoCiclo(f.diaVencimento, f.dataVencimento, now);
    if (!venc) continue;

    const tipo: CompromissoTipo = f.isEntrada ? "fixa_receita" : "fixa_despesa";
    compromissos.push({
      id: `fixa-${f.id}`,
      tipo,
      descricao: f.nome,
      categoria: f.categoria,
      valor: Number(String(f.valor)),
      dataVencimento: venc,
      status: calcStatus(venc, pago, now),
      pago,
      isEntrada: f.isEntrada,
      formaPagamento: f.formaPagamento,
      origem: {
        tipo: "fixa",
        id: f.id,
        href: "/movimentacoes-fixas",
        label: "Ver conta fixa",
      },
    });
  }

  // ── Faturas de cartão ────────────────────────────────────────────────────
  for (const cartao of cartoes.filter((c) => c.ativo)) {
    for (const fatura of cartao.faturas) {
      if (fatura.status === "paga") continue;
      if (fatura.status === "futura") continue; // só aberta, fechada, parcial
      const saldo = Math.max(0, fatura.total - fatura.totalPago);
      if (saldo < 0.01) continue;

      const pago = false;
      compromissos.push({
        id: `fatura-${cartao.id}-${fatura.mesRef}`,
        tipo: "fatura_cartao",
        descricao: `Fatura ${cartao.nome}`,
        categoria: "Cartão de crédito",
        valor: Math.round(saldo * 100) / 100,
        dataVencimento: fatura.vencimento,
        status: calcStatus(fatura.vencimento, pago, now),
        pago,
        isEntrada: false,
        cartaoNome: cartao.nome,
        origem: {
          tipo: "cartao",
          id: cartao.id,
          href: "/cartoes",
          label: "Ver fatura",
        },
      });
    }
  }

  // ── Dívidas ──────────────────────────────────────────────────────────────
  for (const d of dividas.filter((d) => !d.quitada)) {
    const venc = d.dataProxVencimento ?? null;
    compromissos.push({
      id: `divida-${d.id}`,
      tipo: "divida",
      descricao: `${d.credor}${d.descricao ? ` — ${d.descricao}` : ""}`,
      categoria: d.categoria,
      valor: Math.round(d.valorParcela * 100) / 100,
      dataVencimento: venc ?? now,
      status: calcStatus(venc ?? now, false, now),
      pago: false,
      isEntrada: false,
      origem: {
        tipo: "divida",
        id: d.id,
        href: "/dividas",
        label: "Ver dívida",
      },
    });
  }

  // ── Movimentações futuras cadastradas ────────────────────────────────────
  for (const m of movsFuturas) {
    compromissos.push({
      id: `mov-${m.id}`,
      tipo: "movimentacao_futura",
      descricao: m.descricao ?? m.tipo.nome,
      categoria: m.categoria,
      valor: Number(String(m.valor)),
      dataVencimento: m.data,
      status: calcStatus(m.data, false, now),
      pago: false,
      isEntrada: m.isEntrada,
      origem: {
        tipo: "movimentacao",
        id: m.id,
        href: "/movimentacoes",
        label: "Ver movimentação",
      },
    });
  }

  // Ordenar por data
  compromissos.sort((a, b) => a.dataVencimento.getTime() - b.dataVencimento.getTime());

  const pendentes = compromissos.filter((c) => !c.pago && !c.isEntrada);
  const totalPendente = pendentes.reduce((acc, c) => acc + c.valor, 0);
  const totalVencido = pendentes
    .filter((c) => c.status === "vencido")
    .reduce((acc, c) => acc + c.valor, 0);
  const totalProximo = pendentes
    .filter((c) => c.status === "hoje" || c.status === "proximo")
    .reduce((acc, c) => acc + c.valor, 0);

  return { compromissos, saldoAtual, totalPendente, totalVencido, totalProximo };
}
