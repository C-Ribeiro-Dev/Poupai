import { z } from "zod";
import type { FaturaStatus } from "@/lib/cartao-fatura";

export const cartaoSchema = z
  .object({
    nome: z.string().min(1, "Nome é obrigatório").max(100),
    bandeira: z.string().max(50).optional(),
    limite: z
      .number({ message: "Informe um valor válido" })
      .min(0.01, "O limite deve ser maior que zero")
      .max(999_999_999.99),
    diaFechamento: z.number().int().min(1, "Entre 1 e 31").max(31, "Entre 1 e 31"),
    diaVencimento: z.number().int().min(1, "Entre 1 e 31").max(31, "Entre 1 e 31"),
    cor: z.string().min(1),
  })
  .refine((d) => d.diaFechamento !== d.diaVencimento, {
    message: "Fechamento e vencimento devem ser dias diferentes",
    path: ["diaVencimento"],
  });

export type CartaoFormData = z.infer<typeof cartaoSchema>;

export const compraCartaoSchema = z.object({
  descricao: z.string().min(1, "Descrição é obrigatória").max(200),
  categoria: z.string().max(100).optional(),
  responsavel: z.string().max(100).optional(),
  valorTotal: z
    .number({ message: "Informe um valor válido" })
    .min(0.01, "O valor deve ser maior que zero")
    .max(999_999_999.99),
  parcelas: z.number().int().min(1, "Mínimo 1 parcela").max(48, "Máximo 48 parcelas"),
  dataCompra: z.string().min(1, "Informe a data"),
});

export type CompraCartaoFormData = z.infer<typeof compraCartaoSchema>;

export interface FaturaItem {
  compraId: number;
  descricao: string;
  categoria: string | null;
  responsavel: string | null;
  dataCompra: Date;
  parcelaNum: number;
  totalParcelas: number;
  valorParcela: number;
}

export interface FaturaResumo {
  mesRef: string;
  total: number;
  paga: boolean;
  status: FaturaStatus;
  vencimento: Date;
  itens: FaturaItem[];
}

export interface CartaoRow {
  id: number;
  nome: string;
  bandeira: string | null;
  limite: number;
  diaFechamento: number;
  diaVencimento: number;
  cor: string;
  ativo: boolean;
  usado: number;
  disponivel: number;
  faturaAtual: FaturaResumo | null;
  faturas: FaturaResumo[];
}
