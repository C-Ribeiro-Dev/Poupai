import { z } from "zod";

export const novoUsuarioSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(100, "Máximo 100 caracteres"),
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "Mínimo de 6 caracteres").max(72, "Máximo 72 caracteres"),
});

export const editarUsuarioSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(100, "Máximo 100 caracteres"),
  email: z.string().email("E-mail inválido"),
  senha: z
    .string()
    .max(72, "Máximo 72 caracteres")
    .refine((v) => v === "" || v.length >= 6, { message: "Mínimo de 6 caracteres" })
    .optional(),
});

export type NovoUsuarioFormData = z.infer<typeof novoUsuarioSchema>;
export type EditarUsuarioFormData = z.infer<typeof editarUsuarioSchema>;

export interface UsuarioRow {
  id: string;
  email: string;
  nome: string | null;
  criadoEm: string;
  ultimoLogin: string | null;
  isAdmin: boolean;
  senhaTemp: string | null;
  acessoCompartilhado: boolean;
  contaCompartilhadaId: string | null;
}
