export type DiagnosticoGeral = "estavel" | "atencao" | "critica";
export type StatusIndicador = "verde" | "amarelo" | "vermelho";
export type PrioridadeRecomendacao = "alta" | "media" | "baixa";

export interface Indicador {
  nome: string;
  valor: string;
  status: StatusIndicador;
  descricao: string;
  detalhe?: string;
}

export interface Problema {
  titulo: string;
  descricao: string;
  severidade: "critico" | "aviso";
}

export interface PontoPositivo {
  titulo: string;
  descricao: string;
}

export interface Recomendacao {
  prioridade: PrioridadeRecomendacao;
  titulo: string;
  descricao: string;
}

export interface SituacaoFinanceiraData {
  diagnostico: DiagnosticoGeral;
  score: number; // 0–100

  metricas: {
    saldoAtual: number;
    receitaMensal: number;
    despesasMensais: number;
    dinheiroDisponivel: number;
    saldoFimMes: number;
    totalSaldoDevedor: number;
    parcelasAtivasDividas: number;
    faturaCartaoTotal: number;
    metasAtivas: number;
    comprometimentoPct: number;
    mesesReserva: number;
  };

  indicadores: {
    comprometimentoRenda: Indicador;
    reservaFinanceira: Indicador;
    saldoProjetado: Indicador;
    dinheiroDisponivel: Indicador;
    endividamento: Indicador;
    faturaCartao: Indicador;
  };

  problemas: Problema[];
  pontosPositivos: PontoPositivo[];
  recomendacoes: Recomendacao[];
}
