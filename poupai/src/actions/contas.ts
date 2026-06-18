"use server";
import { revalidateDashboard } from "@/lib/revalidate";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  contaSchema,
  transferenciaSchema,
  type ContaFormData,
  type TransferenciaFormData,
} from "@/types/contas";

export type ContaActionResult = { success: true } | { success: false; error: string };

const toNoonUTC = (dateStr: string) => new Date(`${dateStr}T12:00:00.000Z`);

export async function createContaAction(data: ContaFormData): Promise<ContaActionResult> {
  const userId = await getCurrentUserId();

  const parsed = contaSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  await prisma.conta.create({
    data: {
      userId,
      nome: parsed.data.nome,
      tipo: parsed.data.tipo,
      instituicao: parsed.data.instituicao || null,
      cor: parsed.data.cor,
      saldoInicial: parsed.data.saldoInicial,
      ativo: parsed.data.ativo,
    },
  });

  revalidateDashboard("/contas");
  return { success: true };
}

export async function updateContaAction(
  id: number,
  data: ContaFormData
): Promise<ContaActionResult> {
  const userId = await getCurrentUserId();

  const parsed = contaSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const existing = await prisma.conta.findFirst({
    where: { id, userId, isDeleted: false },
    select: { id: true },
  });
  if (!existing) return { success: false, error: "Conta não encontrada." };

  await prisma.conta.update({
    where: { id },
    data: {
      nome: parsed.data.nome,
      tipo: parsed.data.tipo,
      instituicao: parsed.data.instituicao || null,
      cor: parsed.data.cor,
      saldoInicial: parsed.data.saldoInicial,
      ativo: parsed.data.ativo,
    },
  });

  revalidateDashboard("/contas");
  return { success: true };
}

export async function deleteContaAction(id: number): Promise<ContaActionResult> {
  const userId = await getCurrentUserId();

  const existing = await prisma.conta.findFirst({
    where: { id, userId, isDeleted: false },
    select: { id: true },
  });
  if (!existing) return { success: false, error: "Conta não encontrada." };

  await prisma.conta.update({ where: { id }, data: { isDeleted: true } });

  revalidateDashboard("/contas");
  return { success: true };
}

export async function transferirAction(
  data: TransferenciaFormData
): Promise<ContaActionResult> {
  const userId = await getCurrentUserId();

  const parsed = transferenciaSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const contas = await prisma.conta.findMany({
    where: {
      userId,
      isDeleted: false,
      id: { in: [parsed.data.deContaId, parsed.data.paraContaId] },
    },
    select: { id: true },
  });
  if (contas.length !== 2) {
    return { success: false, error: "Conta de origem ou destino não encontrada." };
  }

  await prisma.transferencia.create({
    data: {
      userId,
      deContaId: parsed.data.deContaId,
      paraContaId: parsed.data.paraContaId,
      valor: parsed.data.valor,
      data: toNoonUTC(parsed.data.data),
      descricao: parsed.data.descricao || null,
    },
  });

  revalidateDashboard("/contas");
  return { success: true };
}
