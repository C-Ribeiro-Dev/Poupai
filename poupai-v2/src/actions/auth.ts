"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type AuthState =
  | {
      error?: string;
      message?: string;
      fieldErrors?: {
        email?: string[];
        password?: string[];
        nome?: string[];
        confirmPassword?: string[];
      };
    }
  | undefined;

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

const registerSchema = z
  .object({
    nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
    email: z.string().email("E-mail inválido"),
    password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirme a senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não conferem",
    path: ["confirmPassword"],
  });

export async function loginAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const result = loginSchema.safeParse(raw);
  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  });

  if (error) {
    return { error: "E-mail ou senha incorretos." };
  }

  redirect("/");
}

export async function registerAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const raw = {
    nome: formData.get("nome") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const result = registerSchema.safeParse(raw);
  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error, data } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      data: { nome: result.data.nome },
    },
  });

  if (error) {
    if (error.code === "user_already_exists") {
      return { error: "Este e-mail já está cadastrado." };
    }
    return { error: "Erro ao criar conta. Tente novamente." };
  }

  // Confirmação de e-mail pendente (padrão do Supabase)
  if (data.user && !data.session) {
    return {
      message:
        "Conta criada! Verifique seu e-mail para confirmar o cadastro.",
    };
  }

  redirect("/");
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  await supabase.auth.signOut();
  redirect("/login");
}
