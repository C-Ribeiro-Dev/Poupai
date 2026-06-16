import "server-only";
import { prisma } from "@/lib/prisma";

export interface CategoriaCartaoItem {
  categoria: string;
  total: number;
  percentual: number;
  quantidade: number;
}

export interface GastosCartaoCategoriaData {
  categorias: CategoriaCartaoItem[];
  totalGeral: number;
  periodo: "3m" | "6m" | "12m" | "total";
}

export async function getGastosCartaoPorCategoria(
  userId: string,
  periodo: "3m" | "6m" | "12m" | "total" = "6m"
): Promise<GastosCartaoCategoriaData> {
  const now = new Date();
  let dataInicio: Date | undefined;

  if (periodo === "3m") dataInicio = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  else if (periodo === "6m") dataInicio = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  else if (periodo === "12m") dataInicio = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const compras = await prisma.compraCartao.findMany({
    where: {
      userId,
      isDeleted: false,
      ...(dataInicio ? { dataCompra: { gte: dataInicio } } : {}),
    },
    select: {
      categoria: true,
      valorTotal: true,
    },
  });

  const map = new Map<string, { total: number; quantidade: number }>();

  for (const c of compras) {
    const cat = c.categoria?.trim() || "Sem categoria";
    const existing = map.get(cat) ?? { total: 0, quantidade: 0 };
    existing.total += Number(String(c.valorTotal));
    existing.quantidade += 1;
    map.set(cat, existing);
  }

  const totalGeral = [...map.values()].reduce((s, v) => s + v.total, 0);

  const categorias: CategoriaCartaoItem[] = [...map.entries()]
    .map(([categoria, { total, quantidade }]) => ({
      categoria,
      total,
      quantidade,
      percentual: totalGeral > 0 ? (total / totalGeral) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 7);

  return { categorias, totalGeral, periodo };
}
