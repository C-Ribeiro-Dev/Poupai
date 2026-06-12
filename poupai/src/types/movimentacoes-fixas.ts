import { z } from "zod";
import { isPagoNoCiclo, vencimentoNoCiclo, isEncerrada } from "@/lib/fixas-ciclo";

export const movimentacaoFixaSchema = z.object({
  tipoMovimentacaoId: z.number().int().min(1, "Selecione um tipo"),
  nome: z.string().min(1, "Nome é obrigatório").max(200, "Máximo 200 caracteres"),
  valor: z
    .number({ message: "Informe um valor válido" })
    .min(0.01, "Valor deve ser maior que zero")
    .max(999_999_999.99, "Valor muito alto"),
  diaVencimento: z
    .number()
    .int()
    .min(1, "Entre 1 e 31")
    .max(31, "Entre 1 e 31")
    .optional(),
  dataFim: z.string().optional(),
  categoria: z.string().max(100, "Máximo 100 caracteres").optional(),
  formaPagamento: z.string().max(100, "Máximo 100 caracteres").optional(),
  observacoes: z.string().max(1000, "Máximo 1000 caracteres").optional(),
  ativo: z.boolean(),
});

export type MovimentacaoFixaFormData = z.infer<typeof movimentacaoFixaSchema>;

export interface MovimentacaoFixaRow {
  id: number;
  nome: string;
  valor: number;
  tipoMovimentacaoId: number;
  tipoNome: string;
  isEntrada: boolean;
  diaVencimento: number | null;
  dataVencimento: Date | null;
  dataFim: Date | null;
  categoria: string | null;
  formaPagamento: string | null;
  observacoes: string | null;
  ativo: boolean;
  pago: boolean;
  dataUltimoPagamento: Date | null;
  createdAt: Date;
}

export type MovimentacaoFixaStatus = "pago" | "vencido" | "pendente" | "inativo";

export function getMovimentacaoFixaStatus(row: MovimentacaoFixaRow): MovimentacaoFixaStatus {
  if (!row.ativo || isEncerrada(row.dataFim)) return "inativo";
  // "Pago" vale apenas dentro do mês do último pagamento — vira pendente no mês seguinte
  if (isPagoNoCiclo(row.pago, row.dataUltimoPagamento)) return "pago";
  const venc = vencimentoNoCiclo(row.diaVencimento, row.dataVencimento);
  if (venc && venc < new Date()) return "vencido";
  return "pendente";
}
