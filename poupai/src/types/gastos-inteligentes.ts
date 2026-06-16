export type TendenciaDirecao = "subindo" | "estavel" | "caindo";
export type StatusCategoria = "ok" | "atencao" | "critico";
export type TipoOportunidade = "categoria_alta" | "acima_orcamento" | "parcelamento" | "recorrente" | "concentracao";

export interface CategoriaGasto {
  nome: string;
  cor: string;
  valorMesAtual: number;
  valorMesAnterior: number;
  variacaoAbsoluta: number;
  variacaoPct: number;
  tendencia: TendenciaDirecao;
  mediaUltimos3m: number;
  orcamento: number | null;
  percentualOrcamento: number | null;
  percentualDoTotal: number;
  status: StatusCategoria;
}

export interface TopCompra {
  descricao: string;
  valor: number;
  data: Date;
  categoria: string | null;
  cartao?: string;
  parcelas?: number;
}

export interface OportunidadeEconomia {
  id: string;
  titulo: string;
  descricao: string;
  economiaPotencial: number;
  tipo: TipoOportunidade;
  prioridade: "alta" | "media" | "baixa";
  href?: string;
}

export interface TendenciaGasto {
  categoria: string;
  cor: string;
  direcao: TendenciaDirecao;
  variacaoPct: number;
  variacaoAbsoluta: number;
  descricao: string;
}

export interface ResumoGastos {
  totalMesAtual: number;
  totalMesAnterior: number;
  variacaoAbsoluta: number;
  variacaoPct: number;
  mediaUltimos3m: number;
  totalReceitas: number;
  categorias: CategoriaGasto[];
  topCompras: TopCompra[];
}

export interface GastosInteligentesData {
  resumo: ResumoGastos;
  oportunidades: OportunidadeEconomia[];
  tendencias: TendenciaGasto[];
  economiaPotencialTotal: number;
}
