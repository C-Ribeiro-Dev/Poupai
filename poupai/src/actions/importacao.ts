"use server";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { importacaoSchema, type ImportacaoPayload } from "@/types/importacao";

export type ImportacaoResult =
  | { success: true; importadas: number; duplicadas: number }
  | { success: false; error: string };

export async function importarExtratoAction(
  payload: ImportacaoPayload
): Promise<ImportacaoResult> {
  const userId = await getCurrentUserId();

  const parsed = importacaoSchema.safeParse(payload);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const { contaId, itens } = parsed.data;

  if (contaId) {
    const conta = await prisma.conta.findFirst({
      where: { id: contaId, userId, isDeleted: false },
      select: { id: true },
    });
    if (!conta) return { success: false, error: "Conta não encontrada." };
  }

  // Dedup: ignora transações cujo identificador já foi importado
  const idsExternos = itens.map((i) => i.idExterno);
  const existentes = await prisma.movimentacao.findMany({
    where: { userId, idExterno: { in: idsExternos }, isDeleted: false },
    select: { idExterno: true },
  });
  const jaImportados = new Set(existentes.map((e) => e.idExterno));

  const novos = itens.filter((i) => !jaImportados.has(i.idExterno));
  const duplicadas = itens.length - novos.length;

  if (novos.length === 0) {
    return { success: false, error: "Todas as transações selecionadas já foram importadas." };
  }

  // Valida os tipos usados nos itens novos
  const tipoIds = [...new Set(novos.map((i) => i.tipoId))];
  const tipos = await prisma.tipoMovimentacao.findMany({
    where: { userId, isDeleted: false, id: { in: tipoIds } },
    select: { id: true },
  });
  if (tipos.length !== tipoIds.length) {
    return { success: false, error: "Tipo de movimentação não encontrado." };
  }

  await prisma.movimentacao.createMany({
    data: novos.map((i) => ({
      userId,
      tipoId: i.tipoId,
      valor: i.valor,
      data: new Date(`${i.data}T12:00:00.000Z`),
      categoria: i.categoria || null,
      descricao: i.descricao,
      isEntrada: i.isEntrada,
      contaId: contaId ?? null,
      idExterno: i.idExterno,
    })),
  });

  revalidatePath("/movimentacoes");
  revalidatePath("/");
  return { success: true, importadas: novos.length, duplicadas };
}
