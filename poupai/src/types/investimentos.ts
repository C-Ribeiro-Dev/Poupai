import { z } from "zod";

export const CLASSES_INVESTIMENTO = [
  { key: "renda_fixa", label: "Renda fixa", cor: "#3b82f6" },
  { key: "acoes", label: "Ações", cor: "#22c55e" },
  { key: "fiis", label: "FIIs", cor: "#8b5cf6" },
  { key: "etfs", label: "ETFs", cor: "#06b6d4" },
  { key: "cripto", label: "Criptomoedas", cor: "#f59e0b" },
  { key: "fundos", label: "Fundos", cor: "#ec4899" },
  { key: "previdencia", label: "Previdência", cor: "#64748b" },
  { key: "outros", label: "Outros", cor: "#6b7280" },
] as const;

export type ClasseInvestimento = (typeof CLASSES_INVESTIMENTO)[number]["key"];

export function getClasseInfo(classe: string) {
  return (
    CLASSES_INVESTIMENTO.find((c) => c.key === classe) ?? {
      key: "outros" as const,
      label: classe,
      cor: "#6b7280",
    }
  );
}

export const ativoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(150),
  classe: z.enum([
    "renda_fixa",
    "acoes",
    "fiis",
    "etfs",
    "cripto",
    "fundos",
    "previdencia",
    "outros",
  ]),
  valorAtual: z
    .number({ message: "Informe um valor válido" })
    .min(0)
    .max(999_999_999.99)
    .optional(),
});

export type AtivoFormData = z.infer<typeof ativoSchema>;

export const TIPOS_LANCAMENTO = [
  { key: "aporte", label: "Aporte" },
  { key: "resgate", label: "Resgate" },
  { key: "provento", label: "Provento / dividendo" },
] as const;

export const lancamentoSchema = z.object({
  tipo: z.enum(["aporte", "resgate", "provento"]),
  valor: z
    .number({ message: "Informe um valor válido" })
    .min(0.01, "O valor deve ser maior que zero")
    .max(999_999_999.99),
  data: z.string().min(1, "Informe a data"),
  observacao: z.string().max(200).optional(),
});

export type LancamentoFormData = z.infer<typeof lancamentoSchema>;

export interface LancamentoRow {
  id: number;
  tipo: "aporte" | "resgate" | "provento";
  valor: number;
  data: Date;
  observacao: string | null;
}

export interface AtivoRow {
  id: number;
  nome: string;
  classe: string;
  totalAportado: number;
  totalResgatado: number;
  totalProventos: number;
  valorInvestido: number;
  valorAtual: number;
  valorAtualManual: number | null;
  dataAtualizacao: Date | null;
  rentabilidade: number | null;
  lancamentos: LancamentoRow[];
}

export interface DistribuicaoClasse {
  classe: string;
  label: string;
  cor: string;
  valor: number;
  percentual: number;
}

export interface InvestimentosData {
  ativos: AtivoRow[];
  totalInvestido: number;
  valorAtualTotal: number;
  totalProventos: number;
  rentabilidadeTotal: number | null;
  distribuicao: DistribuicaoClasse[];
  evolucao: { label: string; valor: number }[];
}
