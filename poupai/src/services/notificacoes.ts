import "server-only";
import { prisma } from "@/lib/prisma";
import { isPagoNoCiclo, vencimentoNoCiclo, isEncerrada } from "@/lib/fixas-ciclo";
import { mesRefFaturaAberta, mesRefToString, vencimentoDaFatura } from "@/lib/cartao-fatura";
import { getOrcamentosComGasto } from "./orcamentos";
import { getMetas } from "./metas";

export type NotificacaoUrgencia = "alta" | "media" | "baixa";

export interface Notificacao {
  id: string;
  texto: string;
  href: string;
  urgencia: NotificacaoUrgencia;
}

const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export async function getNotificacoes(userId: string): Promise<Notificacao[]> {
  const now = new Date();
  const em3dias = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 23, 59);

  const [fixas, cartoes, pagamentosFatura, orcamentos, metas] = await Promise.all([
    prisma.movimentacaoFixa.findMany({
      where: { userId, isDeleted: false, ativo: true },
      select: {
        id: true,
        nome: true,
        valor: true,
        pago: true,
        dataUltimoPagamento: true,
        diaVencimento: true,
        dataVencimento: true,
        dataFim: true,
      },
    }),
    prisma.cartao.findMany({
      where: { userId, isDeleted: false, ativo: true },
      select: { id: true, nome: true, diaFechamento: true, diaVencimento: true },
    }),
    prisma.faturaPagamento.findMany({
      where: { userId },
      select: { cartaoId: true, mesRef: true },
    }),
    getOrcamentosComGasto(userId),
    getMetas(userId),
  ]);

  const notificacoes: Notificacao[] = [];

  // ── Fixas vencidas / a vencer ──
  for (const f of fixas) {
    if (isEncerrada(f.dataFim, now)) continue;
    if (isPagoNoCiclo(f.pago, f.dataUltimoPagamento, now)) continue;
    const venc = vencimentoNoCiclo(f.diaVencimento, f.dataVencimento, now);
    if (!venc) continue;
    if (venc < now) {
      notificacoes.push({
        id: `fixa-vencida-${f.id}`,
        texto: `"${f.nome}" (${fmtBRL(Number(String(f.valor)))}) está vencida.`,
        href: "/movimentacoes-fixas",
        urgencia: "alta",
      });
    } else if (venc <= em3dias) {
      const dias = Math.ceil((venc.getTime() - now.getTime()) / 86_400_000);
      notificacoes.push({
        id: `fixa-vence-${f.id}`,
        texto: `"${f.nome}" vence ${dias <= 0 ? "hoje" : dias === 1 ? "amanhã" : `em ${dias} dias`}.`,
        href: "/movimentacoes-fixas",
        urgencia: "media",
      });
    }
  }

  // ── Faturas de cartão fechadas e não pagas ──
  const pagasSet = new Set(pagamentosFatura.map((p) => `${p.cartaoId}:${p.mesRef}`));
  for (const c of cartoes) {
    const abertaRef = mesRefToString(mesRefFaturaAberta(c.diaFechamento, now));
    // Fatura do mês anterior à aberta (a última fechada)
    const [ano, mes] = abertaRef.split("-").map(Number);
    const fechadaRef = `${mes === 1 ? ano - 1 : ano}-${String(mes === 1 ? 12 : mes - 1).padStart(2, "0")}`;
    if (!pagasSet.has(`${c.id}:${fechadaRef}`)) {
      // Só notifica se essa fatura tem compras
      const temCompra = await prisma.compraCartao.findFirst({
        where: { userId, cartaoId: c.id, isDeleted: false },
        select: { id: true },
      });
      if (temCompra) {
        const venc = vencimentoDaFatura(fechadaRef, c.diaFechamento, c.diaVencimento);
        if (venc >= new Date(now.getFullYear(), now.getMonth() - 1, 1)) {
          notificacoes.push({
            id: `fatura-${c.id}-${fechadaRef}`,
            texto: `Fatura do ${c.nome} fechada — ${venc < now ? "venceu" : "vence"} dia ${venc.getDate()}.`,
            href: "/cartoes",
            urgencia: venc < now ? "alta" : "media",
          });
        }
      }
    }
  }

  // ── Orçamentos estourados ──
  for (const cat of orcamentos.resumo.categoriasEstouradas) {
    notificacoes.push({
      id: `orcamento-${cat}`,
      texto: `Orçamento de "${cat}" estourado este mês.`,
      href: "/orcamento",
      urgencia: "media",
    });
  }

  // ── Metas atrasadas ──
  for (const m of metas.filter((x) => x.status === "atrasada")) {
    notificacoes.push({
      id: `meta-${m.id}`,
      texto: `Meta "${m.nome}" passou do prazo — faltam ${fmtBRL(m.restante)}.`,
      href: "/metas",
      urgencia: "baixa",
    });
  }

  const peso: Record<NotificacaoUrgencia, number> = { alta: 0, media: 1, baixa: 2 };
  return notificacoes.sort((a, b) => peso[a.urgencia] - peso[b.urgencia]).slice(0, 12);
}
