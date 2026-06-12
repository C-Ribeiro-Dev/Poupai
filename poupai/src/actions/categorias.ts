"use server";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { categoriaSchema, type CategoriaFormData } from "@/types/categorias";

export type CategoriaActionResult = { success: true } | { success: false; error: string };

export async function createCategoriaAction(
  data: CategoriaFormData
): Promise<CategoriaActionResult> {
  const userId = await getCurrentUserId();

  const parsed = categoriaSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  await prisma.categoria.create({ data: { ...parsed.data, userId } });

  revalidatePath("/categorias");
  return { success: true };
}

export async function updateCategoriaAction(
  id: number,
  data: CategoriaFormData
): Promise<CategoriaActionResult> {
  const userId = await getCurrentUserId();

  const parsed = categoriaSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const existing = await prisma.categoria.findFirst({
    where: { id, userId, isDeleted: false },
    select: { id: true },
  });
  if (!existing) return { success: false, error: "Categoria não encontrada." };

  await prisma.categoria.update({ where: { id }, data: parsed.data });

  revalidatePath("/categorias");
  return { success: true };
}

export async function deleteCategoriaAction(id: number): Promise<CategoriaActionResult> {
  const userId = await getCurrentUserId();

  const existing = await prisma.categoria.findFirst({
    where: { id, userId, isDeleted: false },
    select: { id: true },
  });
  if (!existing) return { success: false, error: "Categoria não encontrada." };

  await prisma.categoria.update({ where: { id }, data: { isDeleted: true } });

  revalidatePath("/categorias");
  return { success: true };
}
