"use server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface ConfigResult {
  success: boolean;
  error?: string;
}

export async function updateNomeAction(nome: string): Promise<ConfigResult> {
  if (!nome || nome.trim().length < 2) {
    return { success: false, error: "Nome deve ter ao menos 2 caracteres." };
  }
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase.auth.updateUser({
    data: { nome: nome.trim() },
  });
  if (error) return { success: false, error: "Erro ao atualizar nome." };
  revalidatePath("/configuracoes");
  return { success: true };
}

export async function updateSenhaAction(
  novaSenha: string,
  confirmar: string
): Promise<ConfigResult> {
  if (novaSenha.length < 6) {
    return { success: false, error: "A nova senha deve ter ao menos 6 caracteres." };
  }
  if (novaSenha !== confirmar) {
    return { success: false, error: "As senhas não conferem." };
  }
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase.auth.updateUser({ password: novaSenha });
  if (error) return { success: false, error: "Erro ao atualizar senha. Tente novamente." };
  return { success: true };
}

export async function exportMovimentacoesAction(): Promise<
  { success: true; csv: string } | { success: false; error: string }
> {
  const userId = await getCurrentUserId();
  const movs = await prisma.movimentacao.findMany({
    where: { userId, isDeleted: false },
    orderBy: { data: "asc" },
    select: {
      data: true,
      descricao: true,
      tipo: true,
      categoria: true,
      conta: true,
      valor: true,
      isEntrada: true,
    },
  });

  const header = "Data,Descrição,Tipo,Categoria,Conta,Valor,Tipo Mov";
  const rows = movs.map((m) =>
    [
      m.data.toLocaleDateString("pt-BR"),
      `"${(m.descricao ?? "").replace(/"/g, '""')}"`,
      `"${m.tipo ?? ""}"`,
      `"${m.categoria ?? ""}"`,
      `"${m.conta ?? ""}"`,
      m.valor.toFixed(2).replace(".", ","),
      m.isEntrada ? "Entrada" : "Saída",
    ].join(";")
  );

  return {
    success: true,
    csv: "﻿" + [header, ...rows].join("\n"),
  };
}
