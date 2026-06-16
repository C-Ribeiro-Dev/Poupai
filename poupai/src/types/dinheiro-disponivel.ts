export type DisponibilidadeStatus = "confortavel" | "atencao" | "critico";

export interface DinheiroDisponivelDetalhe {
  descricao: string;
  valor: number;
  vencimento?: Date | null;
}

export interface DinheiroDisponivelData {
  saldoAtual: number;
  receitasFuturas: number;
  despesasObrigatorias: number;
  dinheiroDisponivel: number;
  status: DisponibilidadeStatus;
  proximoVencimento: { descricao: string; valor: number; data: Date } | null;
  detalhes: {
    fixasReceita: DinheiroDisponivelDetalhe[];
    fixasDespesa: DinheiroDisponivelDetalhe[];
    faturasCartao: DinheiroDisponivelDetalhe[];
    dividasParceladas: DinheiroDisponivelDetalhe[];
  };
}
