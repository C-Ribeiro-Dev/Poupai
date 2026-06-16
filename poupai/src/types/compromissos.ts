export type CompromissoTipo =
  | "fixa_despesa"
  | "fixa_receita"
  | "fatura_cartao"
  | "divida"
  | "movimentacao_futura";

export type CompromissoStatus = "vencido" | "hoje" | "proximo" | "futuro" | "pago";

export type FiltroHorizonte = "hoje" | "7d" | "15d" | "30d" | "mes" | "todos";

export type AgrupamentoCampo = "data" | "categoria" | "tipo";

export interface CompromissoOrigem {
  tipo: "fixa" | "cartao" | "divida" | "movimentacao";
  id: number;
  href: string;
  label: string;
}

export interface CompromissoItem {
  id: string;
  tipo: CompromissoTipo;
  descricao: string;
  categoria: string | null;
  valor: number;
  dataVencimento: Date;
  status: CompromissoStatus;
  pago: boolean;
  isEntrada: boolean;
  origem: CompromissoOrigem;
  formaPagamento?: string | null;
  cartaoNome?: string;
}

export interface ProximosCompromissosData {
  compromissos: CompromissoItem[];
  saldoAtual: number;
  totalPendente: number;
  totalVencido: number;
  totalProximo: number;
}

export function tipoLabel(tipo: CompromissoTipo): string {
  switch (tipo) {
    case "fixa_despesa": return "Despesa Fixa";
    case "fixa_receita": return "Receita Fixa";
    case "fatura_cartao": return "Fatura Cartão";
    case "divida": return "Dívida";
    case "movimentacao_futura": return "Movimentação";
  }
}
