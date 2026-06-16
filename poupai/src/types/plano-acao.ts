export type PrioridadePlano = "urgente" | "alta" | "media" | "baixa";

export type TipoAcao =
  | "pagar"
  | "evitar_compra"
  | "guardar"
  | "revisar"
  | "antecipar"
  | "reduzir_gastos"
  | "cancelar";

export type PeriodoPlano = "hoje" | "semana" | "mes";

export interface AcaoPlano {
  id: string;
  titulo: string;
  descricao: string;
  tipo: TipoAcao;
  prioridade: PrioridadePlano;
  periodo: PeriodoPlano;
  valor?: number;
  impacto?: string;
  href?: string;
}

export interface LimiteDiario {
  valor: number;
  explicacao: string;
}

export interface ResumoPlano {
  urgentes: number;
  altas: number;
  totalAcoes: number;
  score: number;
  diagnostico: "estavel" | "atencao" | "critica";
}

export interface PlanoAcaoData {
  limiteDiario: LimiteDiario;
  acoesHoje: AcaoPlano[];
  acoesSemana: AcaoPlano[];
  acoesMes: AcaoPlano[];
  resumo: ResumoPlano;
}
