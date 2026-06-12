import "server-only";
import { prisma } from "@/lib/prisma";
import {
  mesRefPrimeiraParcela,
  mesRefFaturaAberta,
  mesRefToString,
  addMeses,
  valorParcela,
  vencimentoDaFatura,
  getFaturaStatus,
} from "@/lib/cartao-fatura";
import type { CartaoRow, FaturaResumo, FaturaItem } from "@/types/cartoes";

export async function getCartoes(userId: string): Promise<CartaoRow[]> {
  const [cartoes, compras, pagamentos] = await Promise.all([
    prisma.cartao.findMany({
      where: { userId, isDeleted: false },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        nome: true,
        bandeira: true,
        limite: true,
        diaFechamento: true,
        diaVencimento: true,
        cor: true,
        ativo: true,
      },
    }),
    prisma.compraCartao.findMany({
      where: { userId, isDeleted: false },
      orderBy: { dataCompra: "desc" },
      select: {
        id: true,
        cartaoId: true,
        descricao: true,
        categoria: true,
        valorTotal: true,
        parcelas: true,
        dataCompra: true,
      },
    }),
    prisma.faturaPagamento.findMany({
      where: { userId },
      select: { cartaoId: true, mesRef: true },
    }),
  ]);

  const pagasSet = new Set(pagamentos.map((p) => `${p.cartaoId}:${p.mesRef}`));
  const now = new Date();

  return cartoes.map((c) => {
    // Distribui as parcelas de cada compra nas faturas (mesRef) correspondentes
    const faturasMap = new Map<string, FaturaItem[]>();
    for (const compra of compras.filter((x) => x.cartaoId === c.id)) {
      const total = Number(String(compra.valorTotal));
      const primeira = mesRefPrimeiraParcela(compra.dataCompra, c.diaFechamento);
      for (let i = 0; i < compra.parcelas; i++) {
        const ref = mesRefToString(addMeses(primeira, i));
        const itens = faturasMap.get(ref) ?? [];
        itens.push({
          compraId: compra.id,
          descricao: compra.descricao,
          categoria: compra.categoria,
          dataCompra: compra.dataCompra,
          parcelaNum: i + 1,
          totalParcelas: compra.parcelas,
          valorParcela: valorParcela(total, compra.parcelas, i),
        });
        faturasMap.set(ref, itens);
      }
    }

    const faturas: FaturaResumo[] = [...faturasMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mesRef, itens]) => {
        const paga = pagasSet.has(`${c.id}:${mesRef}`);
        return {
          mesRef,
          total: itens.reduce((acc, i) => acc + i.valorParcela, 0),
          paga,
          status: getFaturaStatus(mesRef, c.diaFechamento, paga, now),
          vencimento: vencimentoDaFatura(mesRef, c.diaFechamento, c.diaVencimento),
          itens,
        };
      });

    // Limite usado = soma das faturas ainda não pagas
    const usado = faturas.filter((f) => !f.paga).reduce((acc, f) => acc + f.total, 0);
    const limite = Number(String(c.limite));

    const refAberta = mesRefToString(mesRefFaturaAberta(c.diaFechamento, now));
    const faturaAtual =
      faturas.find((f) => f.mesRef === refAberta) ??
      faturas.filter((f) => !f.paga && f.mesRef < refAberta).at(-1) ??
      null;

    return {
      id: c.id,
      nome: c.nome,
      bandeira: c.bandeira,
      limite,
      diaFechamento: c.diaFechamento,
      diaVencimento: c.diaVencimento,
      cor: c.cor,
      ativo: c.ativo,
      usado,
      disponivel: limite - usado,
      faturaAtual,
      faturas,
    };
  });
}
