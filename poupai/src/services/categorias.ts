import "server-only";
import { prisma } from "@/lib/prisma";
import type { CategoriaRow } from "@/types/categorias";

const CATEGORIAS_DEFAULT = [
  { nome: "Salário", cor: "#22c55e", icone: "briefcase", tipo: "entrada", isDefault: true },
  { nome: "Freelance", cor: "#3b82f6", icone: "laptop", tipo: "entrada", isDefault: true },
  { nome: "Investimentos", cor: "#8b5cf6", icone: "trending-up", tipo: "entrada", isDefault: true },
  { nome: "Vendas", cor: "#f59e0b", icone: "shopping-bag", tipo: "entrada", isDefault: true },
  { nome: "Outros +", cor: "#6b7280", icone: "plus-circle", tipo: "entrada", isDefault: true },
  { nome: "Alimentação", cor: "#ef4444", icone: "utensils", tipo: "saida", isDefault: true },
  { nome: "Transporte", cor: "#f97316", icone: "car", tipo: "saida", isDefault: true },
  { nome: "Moradia", cor: "#eab308", icone: "home", tipo: "saida", isDefault: true },
  { nome: "Saúde", cor: "#ec4899", icone: "heart-pulse", tipo: "saida", isDefault: true },
  { nome: "Educação", cor: "#06b6d4", icone: "book-open", tipo: "saida", isDefault: true },
  { nome: "Lazer", cor: "#8b5cf6", icone: "gamepad-2", tipo: "saida", isDefault: true },
  { nome: "Compras", cor: "#f59e0b", icone: "shopping-cart", tipo: "saida", isDefault: true },
  { nome: "Assinaturas", cor: "#6366f1", icone: "radio", tipo: "saida", isDefault: true },
  { nome: "Impostos", cor: "#64748b", icone: "receipt", tipo: "saida", isDefault: true },
  { nome: "Outros −", cor: "#6b7280", icone: "minus-circle", tipo: "saida", isDefault: true },
] as const;

async function seedCategoriasDefault(userId: string): Promise<void> {
  // Advisory lock + re-checagem dentro da transação: evita seed duplicado
  // quando duas requisições simultâneas encontram o banco vazio.
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
    const count = await tx.categoria.count({ where: { userId, isDeleted: false } });
    if (count > 0) return;
    await tx.categoria.createMany({
      data: CATEGORIAS_DEFAULT.map((c) => ({ ...c, userId })),
    });
  });
}

export async function getCategorias(userId: string): Promise<CategoriaRow[]> {
  const count = await prisma.categoria.count({ where: { userId, isDeleted: false } });
  if (count === 0) {
    await seedCategoriasDefault(userId);
  }

  const rows = await prisma.categoria.findMany({
    where: { userId, isDeleted: false },
    orderBy: [{ tipo: "asc" }, { nome: "asc" }],
    select: {
      id: true,
      nome: true,
      cor: true,
      icone: true,
      tipo: true,
      ativo: true,
      isDefault: true,
      createdAt: true,
    },
  });

  return rows.map((r) => ({
    ...r,
    tipo: r.tipo as "entrada" | "saida" | "ambos",
  }));
}
