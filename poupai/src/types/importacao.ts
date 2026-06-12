import { z } from "zod";

export const importacaoItemSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  valor: z.number().min(0.01).max(999_999_999.99),
  isEntrada: z.boolean(),
  descricao: z.string().min(1).max(200),
  categoria: z.string().max(100).optional(),
  idExterno: z.string().min(1).max(150),
  tipoId: z.number().int().min(1),
});

export const importacaoSchema = z.object({
  contaId: z.number().int().optional(),
  itens: z.array(importacaoItemSchema).min(1, "Nenhuma transação selecionada").max(1000),
});

export type ImportacaoItem = z.infer<typeof importacaoItemSchema>;
export type ImportacaoPayload = z.infer<typeof importacaoSchema>;
