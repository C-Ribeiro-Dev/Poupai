import { z } from "zod";

export const TIPOS_SIMULACAO = {
  compra_avista: "Compra à vista",
  compra_parcelada: "Compra parcelada",
  emprestimo: "Empréstimo",
  despesa_fixa: "Nova despesa fixa",
  investimento: "Investimento",
  receita_adicional: "Receita adicional",
  reducao_renda: "Redução de renda",
  pagamento_antecipado: "Pagamento antecipado",
} as const;

export type TipoSimulacao = keyof typeof TIPOS_SIMULACAO;

// Tipos que geram parcelas mensais
export const TIPOS_COM_PARCELAS: TipoSimulacao[] = ["compra_parcelada", "emprestimo"];
// Tipos que têm recorrência mensal
export const TIPOS_RECORRENTES: TipoSimulacao[] = ["despesa_fixa", "receita_adicional", "reducao_renda"];
// Tipos que precisam de taxa de juros
export const TIPOS_COM_JUROS: TipoSimulacao[] = ["emprestimo"];

export const simulacaoSchema = z.object({
  tipo: z.enum([
    "compra_avista",
    "compra_parcelada",
    "emprestimo",
    "despesa_fixa",
    "investimento",
    "receita_adicional",
    "reducao_renda",
    "pagamento_antecipado",
  ]),
  descricao: z.string().min(1, "Informe uma descrição"),
  valor: z.number().positive("Valor deve ser positivo"),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  parcelas: z.number().int().min(1).max(120).optional(),
  taxaJuros: z.number().min(0).max(100).optional(),
  categoria: z.string().optional(),
  observacoes: z.string().optional(),
});

export type SimulacaoInput = z.infer<typeof simulacaoSchema>;

export type RecomendacaoTipo = "recomendado" | "atencao" | "nao_recomendado";

export interface ImpactoMensal {
  mes: string; // "Jun/25"
  parcela: number;
  saldoProjetado: number;
}

export interface SimulacaoResultado {
  recomendacao: RecomendacaoTipo;
  motivos: string[];
  alertas: { descricao: string; severidade: "critico" | "aviso" }[];

  // Valores calculados da operação
  valorParcela: number;
  custoTotal: number;
  totalParcelas: number;

  // Comparação atual vs simulado
  comparacao: {
    dinheiroDisponivel: { atual: number; simulado: number };
    saldoFimMes: { atual: number; simulado: number };
    comprometimentoRenda: { atual: number; simulado: number };
    saldoAtual: { atual: number; simulado: number };
  };

  // Linha de impacto mensal (para parcelados e recorrentes)
  impactoMensal: ImpactoMensal[];
}

export type SimulacaoActionResult =
  | { success: true; resultado: SimulacaoResultado }
  | { success: false; error: string };
