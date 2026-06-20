"use server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { isAdminEmail, hasServiceRoleKey } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  novoUsuarioSchema,
  editarUsuarioSchema,
  type NovoUsuarioFormData,
  type EditarUsuarioFormData,
} from "@/types/admin";

export type AdminActionResult = { success: true } | { success: false; error: string };

async function requireAdmin(): Promise<AdminActionResult | null> {
  const user = await getCurrentUser();
  if (!isAdminEmail(user?.email)) {
    return { success: false, error: "Acesso restrito ao administrador." };
  }
  if (!hasServiceRoleKey()) {
    return {
      success: false,
      error: "SUPABASE_SERVICE_ROLE_KEY não configurada no servidor.",
    };
  }
  return null;
}

export async function createUsuarioAction(
  data: NovoUsuarioFormData
): Promise<AdminActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;

  const parsed = novoUsuarioSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.senha,
    email_confirm: true,
    user_metadata: {
      name: parsed.data.nome,
      temp_password: parsed.data.senha,
      shared_account_id: null,
    },
  });

  if (error) {
    const msg = error.message.includes("already been registered")
      ? "Já existe um usuário com este e-mail."
      : error.message;
    return { success: false, error: msg };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function updateUsuarioAction(
  userId: string,
  data: EditarUsuarioFormData
): Promise<AdminActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;

  const parsed = editarUsuarioSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    email: parsed.data.email,
    ...(parsed.data.senha ? { password: parsed.data.senha } : {}),
    user_metadata: {
      name: parsed.data.nome,
      ...(parsed.data.senha ? { temp_password: parsed.data.senha } : {}),
    },
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteUsuarioAction(userId: string): Promise<AdminActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;

  const current = await getCurrentUser();
  if (current?.id === userId) {
    return { success: false, error: "Você não pode excluir a sua própria conta." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin");
  return { success: true };
}

export async function setAcessoCompartilhadoAction(
  userId: string,
  contaId: string | null
): Promise<AdminActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: { shared_account_id: contaId },
  });
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin");
  return { success: true };
}
