import { z } from "zod";

export const tipoMovimentacaoSchema = z.object({
  nome: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(100, "Máximo 100 caracteres"),
  descricao: z.string().max(500, "Máximo 500 caracteres").optional(),
  isEntrada: z.boolean(),
});

export type TipoMovimentacaoFormData = z.infer<typeof tipoMovimentacaoSchema>;

export interface TipoMovimentacaoRow {
  id: number;
  nome: string;
  isEntrada: boolean;
  descricao: string | null;
  createdAt: Date;
}
