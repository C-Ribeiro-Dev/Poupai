import "server-only";
import { prisma } from "@/lib/prisma";
import { isPagoNoCiclo, vencimentoNoCiclo, isEncerrada } from "@/lib/fixas-ciclo";
import { getOrcamentosComGasto } from "./orcamentos";
import { getMetas } from "./metas";
import { getInvestimentos } from "./investimentos";

export type InsightTom = "positivo" | "negativo" | "alerta" | "neutro";

export interface InsightFrase {
  texto: string;
  tom: InsightTom;
}

export interface InteligenciaData {
  score: number;
  nivel: string;
  taxaPoupanca: number | null;
  taxaPoupancaAnterior: number | null;
  fire: {
    patrimonio: number;
    despesaMediaMensal: number;
    mesesCobertos: number;
    percentualFIRE: number;
  } | null;
  frases: InsightFrase[];
  assinaturas: { descricao: string; valorMensal: number }[];
}

const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export async function getInteligencia(userId: string): Promise<InteligenciaData> {
  const now = new Date();
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
  const inicioMesAnterior = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const inicio4Meses = new Date(now.getFullYear(), now.getMonth() - 3, 1);

  const [movs4Meses, fixasAtivas, orcamentos, metas, investimentos] = await Promise.all([
    prisma.movimentacao.findMany({
      where: { userId, isDeleted: false, data: { gte: inicio4Meses } },
      select: { valor: true, isEntrada: true, data: true, categoria: true, descricao: true },
    }),
    prisma.movimentacaoFixa.findMany({
      where: { userId, isDeleted: false, ativo: true },
      select: {
        pago: true,
        dataUltimoPagamento: true,
        diaVencimento: true,
        dataVencimento: true,
        dataFim: true,
      },
    }),
    getOrcamentosComGasto(userId),
    getMetas(userId),
    getInvestimentos(userId),
  ]);

  const valor = (v: unknown) => Number(String(v));
  const mesDe = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;
  const mesAtualKey = mesDe(inicioMes);
  const mesAnteriorKey = mesDe(inicioMesAnterior);

  // ── Agregados do mês atual e anterior ──
  let receitasMes = 0,
    despesasMes = 0,
    receitasAnt = 0,
    despesasAnt = 0;
  const gastoCatMes = new Map<string, number>();
  const gastoCatAnt = new Map<string, number>();

  for (const m of movs4Meses) {
    const key = mesDe(new Date(m.data));
    const v = valor(m.valor);
    if (key === mesAtualKey) {
      if (m.isEntrada) receitasMes += v;
      else {
        despesasMes += v;
        const cat = m.categoria || "Sem categoria";
        gastoCatMes.set(cat, (gastoCatMes.get(cat) ?? 0) + v);
      }
    } else if (key === mesAnteriorKey) {
      if (m.isEntrada) receitasAnt += v;
      else {
        despesasAnt += v;
        const cat = m.categoria || "Sem categoria";
        gastoCatAnt.set(cat, (gastoCatAnt.get(cat) ?? 0) + v);
      }
    }
  }

  const taxaPoupanca = receitasMes > 0 ? ((receitasMes - despesasMes) / receitasMes) * 100 : null;
  const taxaPoupancaAnterior =
    receitasAnt > 0 ? ((receitasAnt - despesasAnt) / receitasAnt) * 100 : null;

  // ── Assinaturas recorrentes: mesma descrição de saída em 3+ meses distintos ──
  const porDescricao = new Map<string, { meses: Set<string>; valores: number[] }>();
  for (const m of movs4Meses) {
    if (m.isEntrada || !m.descricao) continue;
    const desc = m.descricao.trim().toLowerCase();
    if (desc.length < 3) continue;
    const entry = porDescricao.get(desc) ?? { meses: new Set(), valores: [] };
    entry.meses.add(mesDe(new Date(m.data)));
    entry.valores.push(valor(m.valor));
    porDescricao.set(desc, entry);
  }
  const assinaturas = [...porDescricao.entries()]
    .filter(([, e]) => e.meses.size >= 3)
    .map(([desc, e]) => ({
      descricao: desc.charAt(0).toUpperCase() + desc.slice(1),
      valorMensal: e.valores.reduce((a, b) => a + b, 0) / e.valores.length,
    }))
    .sort((a, b) => b.valorMensal - a.valorMensal)
    .slice(0, 5);

  // ── Fixas vencidas (ciclo atual) ──
  const fixasDoCiclo = fixasAtivas.filter((f) => !isEncerrada(f.dataFim, now));
  const fixasVencidas = fixasDoCiclo.filter((f) => {
    if (isPagoNoCiclo(f.pago, f.dataUltimoPagamento, now)) return false;
    const venc = vencimentoNoCiclo(f.diaVencimento, f.dataVencimento, now);
    return venc !== null && venc < now;
  }).length;

  // ── FIRE: patrimônio investido vs despesa média mensal (3 meses) ──
  const mesesComDespesa = new Map<string, number>();
  for (const m of movs4Meses) {
    if (m.isEntrada) continue;
    const key = mesDe(new Date(m.data));
    mesesComDespesa.set(key, (mesesComDespesa.get(key) ?? 0) + valor(m.valor));
  }
  const despesasMensais = [...mesesComDespesa.values()];
  const despesaMediaMensal =
    despesasMensais.length > 0
      ? despesasMensais.reduce((a, b) => a + b, 0) / despesasMensais.length
      : 0;

  const patrimonio = investimentos.valorAtualTotal;
  const fire =
    patrimonio > 0 && despesaMediaMensal > 0
      ? {
          patrimonio,
          despesaMediaMensal,
          mesesCobertos: patrimonio / despesaMediaMensal,
          // Regra dos 4%: independência = 25 anos de despesas
          percentualFIRE: (patrimonio / (despesaMediaMensal * 300)) * 100,
        }
      : null;

  // ── Frases de insight ──
  const frases: InsightFrase[] = [];

  // Categorias que mais cresceram vs mês anterior
  let maiorCrescimento: { cat: string; pct: number; atual: number } | null = null;
  for (const [cat, atual] of gastoCatMes) {
    const anterior = gastoCatAnt.get(cat) ?? 0;
    if (anterior >= 50 && atual > anterior) {
      const pct = ((atual - anterior) / anterior) * 100;
      if (pct >= 20 && (!maiorCrescimento || pct > maiorCrescimento.pct)) {
        maiorCrescimento = { cat, pct, atual };
      }
    }
  }
  if (maiorCrescimento) {
    frases.push({
      texto: `Você gastou ${maiorCrescimento.pct.toFixed(0)}% a mais com ${maiorCrescimento.cat} este mês (${fmtBRL(maiorCrescimento.atual)}).`,
      tom: "alerta",
    });
  }

  if (taxaPoupanca !== null && taxaPoupancaAnterior !== null) {
    if (taxaPoupanca > taxaPoupancaAnterior + 1) {
      frases.push({
        texto: `Sua taxa de poupança subiu de ${taxaPoupancaAnterior.toFixed(0)}% para ${taxaPoupanca.toFixed(0)}% em relação ao mês passado. Continue assim!`,
        tom: "positivo",
      });
    } else if (taxaPoupanca < taxaPoupancaAnterior - 1) {
      frases.push({
        texto: `Sua taxa de poupança caiu de ${taxaPoupancaAnterior.toFixed(0)}% para ${taxaPoupanca.toFixed(0)}% em relação ao mês passado.`,
        tom: "negativo",
      });
    }
  } else if (taxaPoupanca !== null && taxaPoupanca > 0) {
    frases.push({
      texto: `Você está poupando ${taxaPoupanca.toFixed(0)}% da sua renda este mês.`,
      tom: "positivo",
    });
  }

  if (orcamentos.resumo.categoriasEstouradas.length > 0) {
    frases.push({
      texto: `Orçamento estourado em: ${orcamentos.resumo.categoriasEstouradas.join(", ")}. Reveja esses gastos.`,
      tom: "negativo",
    });
  } else if (
    orcamentos.orcamentos.length > 0 &&
    orcamentos.resumo.categoriasEmAtencao.length === 0
  ) {
    frases.push({
      texto: "Todos os orçamentos estão sob controle este mês. 👏",
      tom: "positivo",
    });
  }

  const metaComPrazo = metas.find((m) => m.status === "no_prazo" && m.aporteSugerido !== null);
  if (metaComPrazo && metaComPrazo.aporteSugerido !== null) {
    frases.push({
      texto: `Se economizar ${fmtBRL(metaComPrazo.aporteSugerido)} por mês, você atinge a meta "${metaComPrazo.nome}" em ${metaComPrazo.mesesRestantes} ${metaComPrazo.mesesRestantes === 1 ? "mês" : "meses"}.`,
      tom: "neutro",
    });
  }
  const metasAtrasadas = metas.filter((m) => m.status === "atrasada");
  if (metasAtrasadas.length > 0) {
    frases.push({
      texto: `${metasAtrasadas.length === 1 ? `A meta "${metasAtrasadas[0].nome}" está atrasada` : `${metasAtrasadas.length} metas estão atrasadas`}. Considere ajustar o prazo ou reforçar os aportes.`,
      tom: "alerta",
    });
  }

  if (fixasVencidas > 0) {
    frases.push({
      texto: `Você tem ${fixasVencidas} conta${fixasVencidas > 1 ? "s" : ""} fixa${fixasVencidas > 1 ? "s" : ""} vencida${fixasVencidas > 1 ? "s" : ""} neste mês.`,
      tom: "negativo",
    });
  }

  if (assinaturas.length >= 2) {
    const total = assinaturas.reduce((a, s) => a + s.valorMensal, 0);
    frases.push({
      texto: `Detectamos ${assinaturas.length} gastos recorrentes (${assinaturas
        .slice(0, 3)
        .map((s) => s.descricao)
        .join(", ")}) somando ~${fmtBRL(total)}/mês. Vale revisar o que ainda usa.`,
      tom: "neutro",
    });
  }

  if (fire) {
    frases.push({
      texto: `Seu patrimônio investido cobre ${fire.mesesCobertos.toFixed(1)} ${fire.mesesCobertos >= 2 ? "meses" : "mês"} de despesas — ${fire.percentualFIRE.toFixed(1)}% do caminho até a independência financeira.`,
      tom: "neutro",
    });
  } else if (taxaPoupanca !== null && taxaPoupanca > 10 && patrimonio === 0) {
    frases.push({
      texto: "Você está poupando bem — considere começar a investir o que sobra para fazer o dinheiro render.",
      tom: "neutro",
    });
  }

  // ── Score de saúde financeira (0-100) ──
  let score = 0;
  if (taxaPoupanca !== null) {
    if (taxaPoupanca >= 20) score += 30;
    else if (taxaPoupanca >= 10) score += 20;
    else if (taxaPoupanca > 0) score += 10;
  }
  if (orcamentos.orcamentos.length === 0) score += 10;
  else if (orcamentos.resumo.categoriasEstouradas.length === 0) score += 20;
  if (fixasVencidas === 0) score += 20;
  if (patrimonio > 0) score += 15;
  if (metas.some((m) => m.status === "no_prazo" || m.status === "sem_prazo")) score += 15;

  const nivel =
    score >= 80 ? "Excelente" : score >= 60 ? "Boa" : score >= 40 ? "Regular" : "Atenção";

  return {
    score,
    nivel,
    taxaPoupanca,
    taxaPoupancaAnterior,
    fire,
    frases,
    assinaturas,
  };
}
