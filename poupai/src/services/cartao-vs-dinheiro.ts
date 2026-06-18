import "server-only";
import { prisma } from "@/lib/prisma";

export interface CartaoVsDinheiroData {
  totalCartao: number;
  totalDinheiro: number;
  percentCartao: number;
  percentDinheiro: number;
  mes: string;
}

export async function getCartaoVsDinheiro(
  userId: string,
  mesRef?: Date
): Promise<CartaoVsDinheiroData> {
  const ref = mesRef ?? new Date();
  const startOfMonth = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const startOfNextMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 1);

  const mes = ref.toLocaleString("pt-BR", { month: "long", year: "numeric" });

  const [comprasCartao, saidasDinheiro] = await Promise.all([
    prisma.compraCartao.aggregate({
      where: {
        userId,
        isDeleted: false,
        dataCompra: { gte: startOfMonth, lt: startOfNextMonth },
      },
      _sum: { valorTotal: true },
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
  ]);

  const totalCartao = Number(comprasCartao._sum.valorTotal ?? 0);
  const totalDinheiro = Number(saidasDinheiro._sum.valor ?? 0);
  const total = totalCartao + totalDinheiro;

  return {
    totalCartao,
    totalDinheiro,
    percentCartao: total > 0 ? (totalCartao / total) * 100 : 0,
    percentDinheiro: total > 0 ? (totalDinheiro / total) * 100 : 0,
    mes,
  };
}
