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
        responsavel: true,
        recorrente: true,
        valorTotal: true,
        parcelas: true,
        dataCompra: true,
      },
    }),
    prisma.faturaPagamento.findMany({
      where: { userId },
      select: { cartaoId: true, mesRef: true, valor: true },
    }),
  ]);

  // Mapa de total pago por fatura: "cartaoId:mesRef" → valor total pago
  const pagamentosMap = new Map<string, number>();
  for (const p of pagamentos) {
    const key = `${p.cartaoId}:${p.mesRef}`;
    pagamentosMap.set(key, (pagamentosMap.get(key) ?? 0) + Number(String(p.valor)));
  }

  const now = new Date();
  const horizonte = mesRefToString(addMeses({ ano: now.getFullYear(), mes: now.getMonth() }, 24));

  return cartoes.map((c) => {
    const faturasMap = new Map<string, FaturaItem[]>();
    for (const compra of compras.filter((x) => x.cartaoId === c.id)) {
      const total = Number(String(compra.valorTotal));
      const primeira = mesRefPrimeiraParcela(compra.dataCompra, c.diaFechamento);

      if (compra.recorrente) {
        let i = 0;
        while (true) {
          const ref = mesRefToString(addMeses(primeira, i));
          if (ref > horizonte) break;
          const itens = faturasMap.get(ref) ?? [];
          itens.push({
            compraId: compra.id,
            descricao: compra.descricao,
            categoria: compra.categoria,
            responsavel: compra.responsavel,
            recorrente: true,
            dataCompra: compra.dataCompra,
            parcelaNum: 1,
            totalParcelas: 1,
            valorParcela: total,
          });
          faturasMap.set(ref, itens);
          i++;
        }
      } else {
        for (let i = 0; i < compra.parcelas; i++) {
          const ref = mesRefToString(addMeses(primeira, i));
          const itens = faturasMap.get(ref) ?? [];
          itens.push({
            compraId: compra.id,
            descricao: compra.descricao,
            categoria: compra.categoria,
            responsavel: compra.responsavel,
            recorrente: false,
            dataCompra: compra.dataCompra,
            parcelaNum: i + 1,
            totalParcelas: compra.parcelas,
            valorParcela: valorParcela(total, compra.parcelas, i),
          });
          faturasMap.set(ref, itens);
        }
      }
    }

    const faturas: FaturaResumo[] = [...faturasMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mesRef, itens]) => {
        const total = itens.reduce((acc, i) => acc + i.valorParcela, 0);
        const totalPago = pagamentosMap.get(`${c.id}:${mesRef}`) ?? 0;
        const paga = Math.round(totalPago * 100) >= Math.round(total * 100);
        const baseStatus = getFaturaStatus(mesRef, c.diaFechamento, paga, now);
        // Sobrepõe status com "parcial" quando há pagamento parcial em fatura não futura
        const status =
          totalPago > 0 && !paga && baseStatus !== "futura" ? "parcial" : baseStatus;
        return {
          mesRef,
          total,
          totalPago,
          paga,
          status,
          vencimento: vencimentoDaFatura(mesRef, c.diaFechamento, c.diaVencimento),
          itens,
        };
      });

    // Limite usado = apenas faturas abertas e futuras (fechadas presumem-se pagas fora do sistema)
    // Desconta pagamentos parciais já realizados
    const usado = faturas
      .filter((f) => f.status === "aberta" || f.status === "futura" || f.status === "parcial")
      .reduce((acc, f) => acc + Math.max(0, f.total - f.totalPago), 0);
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
