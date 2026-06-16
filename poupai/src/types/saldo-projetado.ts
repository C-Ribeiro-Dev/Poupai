export type PeriodoProjetado =
  | "7d"
  | "15d"
  | "30d"
  | "60d"
  | "90d"
  | "mes_atual"
  | "proximo_mes";

export type EventoTipo =
  | "fixa_receita"
  | "fixa_despesa"
  | "fatura_cartao"
  | "divida"
  | "movimentacao_entrada"
  | "movimentacao_saida";

export interface EventoProjetado {
  id: string;
  tipo: EventoTipo;
  descricao: string;
  categoria: string | null;
  valor: number;
  isEntrada: boolean;
  data: Date;
  pago: boolean;
  saldoAntes: number;
  saldoDepois: number;
  variacao: number;
  origem: { href: string; label: string };
}

export interface AlertaSaldoProjetado {
  tipo: "saldo_negativo" | "grande_vencimento" | "acumulo_despesas" | "receita_insuficiente";
  descricao: string;
  data?: Date;
  valor?: number;
  severidade: "critico" | "aviso";
}

export interface SaldoProjetadoData {
  saldoAtual: number;
  eventos: EventoProjetado[];
  saldoFimMes: number;
  saldoProxMes: number;
  maiorSaldo: { valor: number; data: Date | null };
  menorSaldo: { valor: number; data: Date | null };
  temSaldoNegativo: boolean;
  alertas: AlertaSaldoProjetado[];
}

export const PERIODO_LABELS: Record<PeriodoProjetado, string> = {
  "7d": "7 dias",
  "15d": "15 dias",
  "30d": "30 dias",
  "60d": "60 dias",
  "90d": "90 dias",
  mes_atual: "Mês atual",
  proximo_mes: "Próximo mês",
};

export function periodoToFim(periodo: PeriodoProjetado, now: Date): Date {
  switch (periodo) {
    case "7d":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59);
    case "15d":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 15, 23, 59, 59);
    case "30d":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30, 23, 59, 59);
    case "60d":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 60, 23, 59, 59);
    case "90d":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 90, 23, 59, 59);
    case "mes_atual":
      return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    case "proximo_mes":
      return new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);
  }
}

export function periodoToInicio(periodo: PeriodoProjetado, now: Date): Date {
  if (periodo === "proximo_mes") {
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
}
