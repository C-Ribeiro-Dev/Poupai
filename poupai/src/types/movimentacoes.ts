import { z } from "zod";

export const movimentacaoSchema = z.object({
  tipoId: z.number().int().min(1, "Selecione um tipo"),
  valor: z.number({ message: "Informe um valor válido" })
    .min(0.01, "Valor deve ser maior que zero")
    .max(999_999_999.99, "Valor muito alto"),
  data: z.string().min(1, "Data é obrigatória"),
  categoria: z.string().max(100, "Máximo 100 caracteres").optional(),
  descricao: z.string().max(500, "Máximo 500 caracteres").optional(),
  contaId: z.number().int().optional(),
});

export type MovimentacaoFormData = z.infer<typeof movimentacaoSchema>;

export interface MovimentacaoRow {
  id: number;
  valor: number;
  tipoId: number;
  tipoNome: string;
  isEntrada: boolean;
  data: Date;
  categoria: string | null;
  descricao: string | null;
  isFixaOuDiaria: boolean;
  movimentacaoFixaId: number | null;
  contaId: number | null;
  contaNome: string | null;
  createdAt: Date;
}
