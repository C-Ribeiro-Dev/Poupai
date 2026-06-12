"use server";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { metaSchema, aporteSchema, type MetaFormData, type AporteFormData } from "@/types/metas";

export type MetaActionResult = { success: true } | { success: false; error: string };

const toNoonUTC = (dateStr: string) => new Date(`${dateStr}T12:00:00.000Z`);

export async function createMetaAction(data: MetaFormData): Promise<MetaActionResult> {
  const userId = await getCurrentUserId();

  const parsed = metaSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  await prisma.meta.create({
    data: {
      userId,
      nome: parsed.data.nome,
      descricao: parsed.data.descricao || null,
      valorAlvo: parsed.data.valorAlvo,
      dataAlvo: parsed.data.dataAlvo ? toNoonUTC(parsed.data.dataAlvo) : null,
      cor: parsed.data.cor,
    },
  });

  revalidatePath("/metas");
  revalidatePath("/");
  return { success: true };
}

export async function updateMetaAction(
  id: number,
  data: MetaFormData
): Promise<MetaActionResult> {
  const userId = await getCurrentUserId();

  const parsed = metaSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const existing = await prisma.meta.findFirst({
    where: { id, userId, isDeleted: false },
    select: { id: true },
  });
  if (!existing) return { success: false, error: "Meta não encontrada." };

  await prisma.meta.update({
    where: { id },
    data: {
      nome: parsed.data.nome,
      descricao: parsed.data.descricao || null,
      valorAlvo: parsed.data.valorAlvo,
      dataAlvo: parsed.data.dataAlvo ? toNoonUTC(parsed.data.dataAlvo) : null,
      cor: parsed.data.cor,
    },
  });

  revalidatePath("/metas");
  revalidatePath("/");
  return { success: true };
}

export async function deleteMetaAction(id: number): Promise<MetaActionResult> {
  const userId = await getCurrentUserId();

  const existing = await prisma.meta.findFirst({
    where: { id, userId, isDeleted: false },
    select: { id: true },
  });
  if (!existing) return { success: false, error: "Meta não encontrada." };

  await prisma.meta.update({ where: { id }, data: { isDeleted: true } });

  revalidatePath("/metas");
  revalidatePath("/");
  return { success: true };
}

export async function aportarMetaAction(
  metaId: number,
  data: AporteFormData
): Promise<MetaActionResult> {
  const userId = await getCurrentUserId();

  const parsed = aporteSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const meta = await prisma.meta.findFirst({
    where: { id: metaId, userId, isDeleted: false },
    select: { id: true },
  });
  if (!meta) return { success: false, error: "Meta não encontrada." };

  await prisma.metaAporte.create({
    data: {
      userId,
      metaId,
      valor: parsed.data.valor,
      data: toNoonUTC(parsed.data.data),
    },
  });

  revalidatePath("/metas");
  revalidatePath("/");
  return { success: true };
}
