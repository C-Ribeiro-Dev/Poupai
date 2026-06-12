import { z } from "zod";

export const orcamentoSchema = z.object({
  categoria: z.string().min(1, "Selecione uma categoria").max(100),
  valor: z
    .number({ message: "Informe um valor válido" })
    .min(0.01, "O valor deve ser maior que zero")
    .max(999_999_999.99),
});

export type OrcamentoFormData = z.infer<typeof orcamentoSchema>;

export type OrcamentoStatus = "ok" | "atencao" | "estourado";

export interface OrcamentoRow {
  id: number;
  categoria: string;
  cor: string;
  icone: string;
  valor: number;
  gasto: number;
  disponivel: number;
  percentual: number;
  status: OrcamentoStatus;
}

export interface OrcamentoResumo {
  totalPlanejado: number;
  totalGasto: number;
  totalDisponivel: number;
  categoriasEstouradas: string[];
  categoriasEmAtencao: string[];
}

export function getOrcamentoStatus(percentual: number): OrcamentoStatus {
  if (percentual >= 100) return "estourado";
  if (percentual >= 80) return "atencao";
  return "ok";
}
