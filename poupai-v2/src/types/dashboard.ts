export interface DashboardResumoMes {
  receitas: number;
  despesas: number;
  saldo: number;
}

export interface DashboardMovimentacaoRecente {
  id: number;
  descricao: string | null;
  tipoNome: string;
  categoria: string | null;
  valor: number;
  isEntrada: boolean;
  data: Date;
  isFixaOuDiaria: boolean;
}

export interface DashboardProximoVencimento {
  id: number;
  nome: string;
  valor: number;
  isEntrada: boolean;
  diaVencimento: number | null;
  dataVencimento: Date;
  categoria: string | null;
  formaPagamento: string | null;
}

export interface DashboardInsights {
  topGasto: { categoria: string; valor: number } | null;
  topReceita: { categoria: string; valor: number } | null;
  totalLancamentos: number;
}

export interface DashboardMeta {
  id: number;
  nome: string;
  cor: string;
  percentual: number;
  valorAlvo: number;
  totalAportado: number;
}

export interface DashboardOrcamento {
  totalPlanejado: number;
  totalGasto: number;
  categoriasEstouradas: string[];
  categoriasEmAtencao: string[];
}

export interface DashboardProjecao {
  saldoProjetado: number;
  receitasPendentes: number;
  despesasPendentes: number;
}

export interface DashboardData {
  resumoMes: DashboardResumoMes;
  saldoTotal: number;
  fixasPendentes: number;
  fixasPagas: number;
  fixasVencidas: number;
  ultimasMovimentacoes: DashboardMovimentacaoRecente[];
  proximosVencimentos: DashboardProximoVencimento[];
  mes: string;
  insights: DashboardInsights;
  orcamento: DashboardOrcamento | null;
  metas: DashboardMeta[];
  projecao: DashboardProjecao;
}
