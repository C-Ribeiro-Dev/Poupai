import { z } from "zod";

export const dividaSchema = z.object({
  credor: z.string().min(1, "Credor é obrigatório").max(100),
  descricao: z.string().max(200).optional().or(z.literal("")),
  valorTotal: z.number().positive("Valor deve ser positivo"),
  taxaJurosMensal: z.number().min(0).max(100),
  nParcelas: z.number().int().min(1).max(600),
  parcelasPagas: z.number().int().min(0),
  dataInicio: z.string().min(1, "Data de início é obrigatória"),
  dataProxVencimento: z.string().optional().or(z.literal("")),
  categoria: z.string().max(100).optional().or(z.literal("")),
  observacoes: z.string().max(500).optional().or(z.literal("")),
});

export type DividaFormData = z.infer<typeof dividaSchema>;

export interface DividaRow {
  id: number;
  credor: string;
  descricao: string | null;
  valorTotal: number;
  taxaJurosMensal: number;
  nParcelas: number;
  parcelasPagas: number;
  dataInicio: Date;
  dataProxVencimento: Date | null;
  categoria: string | null;
  observacoes: string | null;
  quitada: boolean;
  createdAt: Date;
  // calculados
  valorParcela: number;
  valorPago: number;
  saldoDevedor: number;
  percentualPago: number;
}
