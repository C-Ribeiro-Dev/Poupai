import "server-only";
import { prisma } from "@/lib/prisma";
import type {
  CategoriaGasto,
  GastosInteligentesData,
  OportunidadeEconomia,
  ResumoGastos,
  TendenciaGasto,
  TopCompra,
} from "@/types/gastos-inteligentes";

function gerarId(base: string): string {
  let h = 0;
  for (let i = 0; i < base.length; i++) h = (Math.imul(31, h) + base.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

function mesKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
}

function variacaoPct(atual: number, anterior: number): number {
  if (anterior === 0) return atual > 0 ? 100 : 0;
  return ((atual - anterior) / anterior) * 100;
}

export async function getGastosInteligentes(userId: string): Promise<GastosInteligentesData> {
  const now = new Date();
  // 6 meses de janela para análise de tendências
  const inicio6m = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const fimAtual = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const mesAtualKey = mesKey(now);
  const antKey = mesKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const [movs, comprasCartao, orcamentos, categorias] = await Promise.all([
    prisma.movimentacao.findMany({
      where: { userId, isDeleted: false, data: { gte: inicio6m, lt: fimAtual } },
      select: {
        valor: true,
        isEntrada: true,
        data: true,
        categoria: true,
        descricao: true,
        conta: { select: { nome: true } },
      },
      orderBy: { data: "desc" },
    }),
    prisma.compraCartao.findMany({
      where: { userId, isDeleted: false, dataCompra: { gte: inicio6m, lt: fimAtual } },
      select: {
        descricao: true,
        categoria: true,
        valorTotal: true,
        parcelas: true,
        dataCompra: true,
        recorrente: true,
        cartao: { select: { nome: true } },
      },
      orderBy: { dataCompra: "desc" },
    }),
    prisma.orcamento.findMany({
      where: { userId, isDeleted: false },
      select: { categoria: true, valor: true },
    }),
    prisma.categoria.findMany({
      where: { userId, isDeleted: false },
      select: { nome: true, cor: true },
    }),
  ]);

  // ── Lookups ────────────────────────────────────────────────────────────────
  const corByCategoria = new Map(categorias.map((c) => [c.nome, c.cor]));
  const orcByCategoria = new Map(
    orcamentos.map((o) => [o.categoria, Number(String(o.valor))])
  );

  // ── Agrupa despesas por mês × categoria ───────────────────────────────────
  // mapeado como: mesCatKey → valor
  const movsPorMesCat = new Map<string, number>();
  const movsPorMes = new Map<string, { despesas: number; receitas: number }>();
  const topComprasCandidatos: TopCompra[] = [];

  for (const m of movs) {
    const valor = Number(String(m.valor));
    const mk = mesKey(new Date(m.data));
    const entry = movsPorMes.get(mk) ?? { despesas: 0, receitas: 0 };
    if (m.isEntrada) entry.receitas += valor;
    else {
      entry.despesas += valor;
      const cat = m.categoria ?? "Sem categoria";
      movsPorMesCat.set(`${mk}|${cat}`, (movsPorMesCat.get(`${mk}|${cat}`) ?? 0) + valor);
      if (valor >= 50) {
        topComprasCandidatos.push({
          descricao: m.descricao ?? cat,
          valor,
          data: new Date(m.data),
          categoria: m.categoria,
        });
      }
    }
    movsPorMes.set(mk, entry);
  }

  // top compras de cartão também
  for (const c of comprasCartao) {
    const valor = Number(String(c.valorTotal));
    if (valor >= 50) {
      topComprasCandidatos.push({
        descricao: c.descricao,
        valor,
        data: new Date(c.dataCompra),
        categoria: c.categoria,
        cartao: c.cartao.nome,
        parcelas: c.parcelas > 1 ? c.parcelas : undefined,
      });
    }
  }
  const topCompras = topComprasCandidatos
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 8);

  // ── Totais mês atual e anterior ───────────────────────────────────────────
  const totalMesAtual = movsPorMes.get(mesAtualKey)?.despesas ?? 0;
  const totalMesAnterior = movsPorMes.get(antKey)?.despesas ?? 0;
  const totalReceitas = movsPorMes.get(mesAtualKey)?.receitas ?? 0;

  // média últimos 3 meses (excluindo atual)
  const ultimos3mKeys = [1, 2, 3].map((i) =>
    mesKey(new Date(now.getFullYear(), now.getMonth() - i, 1))
  );
  const soma3m = ultimos3mKeys.reduce(
    (acc, k) => acc + (movsPorMes.get(k)?.despesas ?? 0),
    0
  );
  const mediaUltimos3m = soma3m / 3;

  // ── Categorias: valor por mês dos últimos 3 meses ─────────────────────────
  const todasCats = new Set<string>();
  for (const [k] of movsPorMesCat) {
    const cat = k.split("|")[1];
    todasCats.add(cat);
  }

  const categoriasList: CategoriaGasto[] = [];
  for (const cat of todasCats) {
    const atual = movsPorMesCat.get(`${mesAtualKey}|${cat}`) ?? 0;
    const anterior = movsPorMesCat.get(`${antKey}|${cat}`) ?? 0;

    const vals3m = ultimos3mKeys.map((k) => movsPorMesCat.get(`${k}|${cat}`) ?? 0);
    const media3m = vals3m.reduce((a, b) => a + b, 0) / 3;

    const varPct = variacaoPct(atual, anterior);
    const tendencia =
      varPct > 12 ? "subindo" : varPct < -12 ? "caindo" : "estavel";

    const orcamento = orcByCategoria.get(cat) ?? null;
    const percentualOrcamento = orcamento && orcamento > 0 ? (atual / orcamento) * 100 : null;

    const status: CategoriaGasto["status"] =
      percentualOrcamento !== null && percentualOrcamento > 120
        ? "critico"
        : percentualOrcamento !== null && percentualOrcamento > 90
        ? "atencao"
        : tendencia === "subindo" && varPct > 25
        ? "atencao"
        : "ok";

    if (atual > 0 || anterior > 0) {
      categoriasList.push({
        nome: cat,
        cor: corByCategoria.get(cat) ?? "#6b7280",
        valorMesAtual: atual,
        valorMesAnterior: anterior,
        variacaoAbsoluta: atual - anterior,
        variacaoPct: varPct,
        tendencia,
        mediaUltimos3m: media3m,
        orcamento,
        percentualOrcamento,
        percentualDoTotal: totalMesAtual > 0 ? (atual / totalMesAtual) * 100 : 0,
        status,
      });
    }
  }
  categoriasList.sort((a, b) => b.valorMesAtual - a.valorMesAtual);

  // ── Tendências (top 5 variações) ─────────────────────────────────────────
  const tendencias: TendenciaGasto[] = categoriasList
    .filter((c) => c.valorMesAnterior > 20 || c.valorMesAtual > 20)
    .sort((a, b) => Math.abs(b.variacaoPct) - Math.abs(a.variacaoPct))
    .slice(0, 5)
    .map((c) => ({
      categoria: c.nome,
      cor: c.cor,
      direcao: c.tendencia,
      variacaoPct: c.variacaoPct,
      variacaoAbsoluta: c.variacaoAbsoluta,
      descricao:
        c.tendencia === "subindo"
          ? `Aumentou ${c.variacaoPct.toFixed(0)}% em relação ao mês anterior`
          : c.tendencia === "caindo"
          ? `Reduziu ${Math.abs(c.variacaoPct).toFixed(0)}% em relação ao mês anterior`
          : "Sem variação significativa",
    }));

  // ── Oportunidades de economia ─────────────────────────────────────────────
  const oportunidades: OportunidadeEconomia[] = [];

  // 1. Categorias acima do orçamento
  for (const cat of categoriasList) {
    if (cat.percentualOrcamento !== null && cat.percentualOrcamento > 110 && cat.orcamento) {
      const excesso = cat.valorMesAtual - cat.orcamento;
      oportunidades.push({
        id: gerarId(`orc-${cat.nome}`),
        titulo: `${cat.nome} acima do orçamento`,
        descricao: `Gasto ${cat.percentualOrcamento.toFixed(0)}% do limite. Orçamento: R$ ${cat.orcamento.toFixed(2)}.`,
        economiaPotencial: excesso,
        tipo: "acima_orcamento",
        prioridade: cat.percentualOrcamento > 150 ? "alta" : "media",
        href: "/orcamento",
      });
    }
  }

  // 2. Categorias que cresceram muito (> 30%)
  for (const cat of categoriasList) {
    if (
      cat.tendencia === "subindo" &&
      cat.variacaoPct > 30 &&
      cat.valorMesAtual > 100 &&
      cat.percentualOrcamento === null // não mostrar duplicado se já acima do orçamento
    ) {
      oportunidades.push({
        id: gerarId(`cresc-${cat.nome}`),
        titulo: `${cat.nome} com crescimento acelerado`,
        descricao: `Aumento de ${cat.variacaoPct.toFixed(0)}% no mês. Potencial de redução de 20%.`,
        economiaPotencial: cat.valorMesAtual * 0.2,
        tipo: "categoria_alta",
        prioridade: cat.variacaoPct > 60 ? "alta" : "media",
      });
    }
  }

  // 3. Categoria concentra > 40% dos gastos
  for (const cat of categoriasList.slice(0, 3)) {
    if (cat.percentualDoTotal > 40 && cat.valorMesAtual > 200) {
      oportunidades.push({
        id: gerarId(`conc-${cat.nome}`),
        titulo: `${cat.nome} concentra ${cat.percentualDoTotal.toFixed(0)}% dos gastos`,
        descricao: "Alta concentração em uma categoria. Pequena redução tem grande impacto.",
        economiaPotencial: cat.valorMesAtual * 0.1,
        tipo: "concentracao",
        prioridade: "media",
      });
    }
  }

  // 4. Compras parceladas excessivas (muitas com parcelas > 1)
  const comprasParceladas = comprasCartao.filter(
    (c) => c.parcelas > 1 && mesKey(new Date(c.dataCompra)) === mesAtualKey
  );
  if (comprasParceladas.length >= 3) {
    const somaParc = comprasParceladas.reduce(
      (acc, c) => acc + Number(String(c.valorTotal)) / c.parcelas,
      0
    );
    oportunidades.push({
      id: gerarId("parcelamentos"),
      titulo: `${comprasParceladas.length} compras parceladas ativas`,
      descricao: `Comprometendo ${somaParc.toFixed(0)} por mês em parcelas. Evite novos parcelamentos.`,
      economiaPotencial: somaParc * 0.15,
      tipo: "parcelamento",
      prioridade: comprasParceladas.length >= 5 ? "alta" : "media",
      href: "/cartoes",
    });
  }

  // 5. Recorrentes de cartão
  const recorrentes = comprasCartao.filter(
    (c) => c.recorrente && mesKey(new Date(c.dataCompra)) === mesAtualKey
  );
  if (recorrentes.length > 0) {
    const totalRec = recorrentes.reduce(
      (acc, c) => acc + Number(String(c.valorTotal)),
      0
    );
    oportunidades.push({
      id: gerarId("recorrentes-cartao"),
      titulo: `${recorrentes.length} assinaturas no cartão`,
      descricao: `Total de R$ ${totalRec.toFixed(2)}/mês em cobranças recorrentes. Revise quais ainda usa.`,
      economiaPotencial: totalRec * 0.3,
      tipo: "recorrente",
      prioridade: totalRec > 200 ? "alta" : "baixa",
      href: "/cartoes",
    });
  }

  // Ordenar oportunidades e limitar a 6
  const ordemPrio: Record<string, number> = { alta: 0, media: 1, baixa: 2 };
  oportunidades.sort((a, b) => {
    const pd = ordemPrio[a.prioridade] - ordemPrio[b.prioridade];
    return pd !== 0 ? pd : b.economiaPotencial - a.economiaPotencial;
  });
  const oportunidadesFinal = oportunidades.slice(0, 6);

  const economiaPotencialTotal = oportunidadesFinal.reduce(
    (acc, o) => acc + o.economiaPotencial,
    0
  );

  // ── Resumo ────────────────────────────────────────────────────────────────
  const resumo: ResumoGastos = {
    totalMesAtual,
    totalMesAnterior,
    variacaoAbsoluta: totalMesAtual - totalMesAnterior,
    variacaoPct: variacaoPct(totalMesAtual, totalMesAnterior),
    mediaUltimos3m,
    totalReceitas,
    categorias: categoriasList,
    topCompras,
  };

  return {
    resumo,
    oportunidades: oportunidadesFinal,
    tendencias,
    economiaPotencialTotal,
  };
}
