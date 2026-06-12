import { z } from "zod";

export const TIPOS_CONTA = [
  { key: "corrente", label: "Conta corrente" },
  { key: "poupanca", label: "Poupança" },
  { key: "carteira", label: "Carteira (dinheiro)" },
  { key: "outros", label: "Outros" },
] as const;

export type TipoConta = (typeof TIPOS_CONTA)[number]["key"];

export const contaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(100, "Máximo 100 caracteres"),
  tipo: z.enum(["corrente", "poupanca", "carteira", "outros"]),
  instituicao: z.string().max(100).optional(),
  cor: z.string().min(1),
  saldoInicial: z
    .number({ message: "Informe um valor válido" })
    .min(-999_999_999.99)
    .max(999_999_999.99),
  ativo: z.boolean(),
});

export type ContaFormData = z.infer<typeof contaSchema>;

export const transferenciaSchema = z
  .object({
    deContaId: z.number().int().min(1, "Selecione a conta de origem"),
    paraContaId: z.number().int().min(1, "Selecione a conta de destino"),
    valor: z
      .number({ message: "Informe um valor válido" })
      .min(0.01, "O valor deve ser maior que zero")
      .max(999_999_999.99),
    data: z.string().min(1, "Informe a data"),
    descricao: z.string().max(200).optional(),
  })
  .refine((d) => d.deContaId !== d.paraContaId, {
    message: "A conta de destino deve ser diferente da origem",
    path: ["paraContaId"],
  });

export type TransferenciaFormData = z.infer<typeof transferenciaSchema>;

export interface ContaRow {
  id: number;
  nome: string;
  tipo: TipoConta;
  instituicao: string | null;
  cor: string;
  saldoInicial: number;
  saldoAtual: number;
  ativo: boolean;
  createdAt: Date;
}

export interface TransferenciaRow {
  id: number;
  deContaNome: string;
  paraContaNome: string;
  valor: number;
  data: Date;
  descricao: string | null;
}

export function getTipoContaLabel(tipo: string): string {
  return TIPOS_CONTA.find((t) => t.key === tipo)?.label ?? tipo;
}
