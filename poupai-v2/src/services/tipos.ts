import "server-only";
import { prisma } from "@/lib/prisma";
import type { TipoMovimentacaoRow } from "@/types/tipos";

const select = {
  id: true,
  nome: true,
  isEntrada: true,
  descricao: true,
  createdAt: true,
} as const;

export async function getTiposMovimentacao(
  userId: string
): Promise<TipoMovimentacaoRow[]> {
  return prisma.tipoMovimentacao.findMany({
    where: { userId, isDeleted: false },
    orderBy: { createdAt: "desc" },
    select,
  });
}

export async function checkNomeDuplicado(
  nome: string,
  userId: string,
  excludeId?: number
): Promise<boolean> {
  const existing = await prisma.tipoMovimentacao.findFirst({
    where: {
      userId,
      isDeleted: false,
      nome: { equals: nome, mode: "insensitive" },
      ...(excludeId !== undefined ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
  return existing !== null;
}
