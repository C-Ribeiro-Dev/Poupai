import "server-only";
import { prisma } from "@/lib/prisma";
import {
  mesRefFaturaAberta,
  mesRefPrimeiraParcela,
  mesRefToString,
  addMeses,
  valorParcela,
} from "@/lib/cartao-fatura";

export type PeriodoCartao = "aberta" | "1m" | "6m" | "12m";

export interface CategoriaCartaoItem {
  categoria: string;
  total: number;
  percentual: number;
  quantidade: number;
}

export interface GastosCartaoCategoriaData {
  categorias: CategoriaCartaoItem[];
  totalGeral: number;
  periodo: PeriodoCartao;
}

export async function getGastosCartaoPorCategoria(
  userId: string,
  periodo: PeriodoCartao = "aberta"
): Promise<GastosCartaoCategoriaData> {
  const now = new Date();
  const map = new Map<string, { total: number; quantidade: number }>();

  if (periodo === "aberta") {
    const [cartoes, compras] = await Promise.all([
      prisma.cartao.findMany({
        where: { userId, isDeleted: false, ativo: true },
        select: { id: true, diaFechamento: true },
      }),
      prisma.compraCartao.findMany({
        where: { userId, isDeleted: false },
        select: {
          cartaoId: true,
          categoria: true,
          valorTotal: true,
          parcelas: true,
          dataCompra: true,
          recorrente: true,
        },
      }),
    ]);

    const openMesRefMap = new Map<number, string>();
    for (const c of cartoes) {
      openMesRefMap.set(c.id, mesRefToString(mesRefFaturaAberta(c.diaFechamento, now)));
    }

    for (const compra of compras) {
      const openMesRef = openMesRefMap.get(compra.cartaoId);
      if (!openMesRef) continue;

      const cartao = cartoes.find((c) => c.id === compra.cartaoId);
      if (!cartao) continue;

      const total = Number(String(compra.valorTotal));
      const primeira = mesRefPrimeiraParcela(compra.dataCompra, cartao.diaFechamento);

      let parcela = 0;
      if (compra.recorrente) {
        if (mesRefToString(primeira) <= openMesRef) parcela = total;
      } else {
        for (let i = 0; i < compra.parcelas; i++) {
          if (mesRefToString(addMeses(primeira, i)) === openMesRef) {
            parcela = valorParcela(total, compra.parcelas, i);
            break;
          }
        }
      }

      if (parcela <= 0) continue;

      const cat = compra.categoria?.trim() || "Sem categoria";
      const existing = map.get(cat) ?? { total: 0, quantidade: 0 };
      existing.total += parcela;
      existing.quantidade += 1;
      map.set(cat, existing);
    }
  } else {
    let dataInicio: Date;
    if (periodo === "1m") dataInicio = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (periodo === "6m") dataInicio = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    else dataInicio = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const compras = await prisma.compraCartao.findMany({
      where: { userId, isDeleted: false, dataCompra: { gte: dataInicio } },
      select: { categoria: true, valorTotal: true },
    });

    for (const c of compras) {
      const cat = c.categoria?.trim() || "Sem categoria";
      const existing = map.get(cat) ?? { total: 0, quantidade: 0 };
      existing.total += Number(String(c.valorTotal));
      existing.quantidade += 1;
      map.set(cat, existing);
    }
  }

  const totalGeral = [...map.values()].reduce((s, v) => s + v.total, 0);

  const categorias: CategoriaCartaoItem[] = [...map.entries()]
    .map(([categoria, { total, quantidade }]) => ({
      categoria,
      total,
      quantidade,
      percentual: totalGeral > 0 ? (total / totalGeral) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return { categorias, totalGeral, periodo };
}
