import "server-only";
import { prisma } from "@/lib/prisma";
import {
  getClasseInfo,
  type AtivoRow,
  type LancamentoRow,
  type InvestimentosData,
} from "@/types/investimentos";

export async function getInvestimentos(userId: string): Promise<InvestimentosData> {
  const [ativos, lancamentos] = await Promise.all([
    prisma.ativoInvestimento.findMany({
      where: { userId, isDeleted: false },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        nome: true,
        classe: true,
        valorAtual: true,
        dataAtualizacao: true,
      },
    }),
    prisma.lancamentoInvestimento.findMany({
      where: { userId, isDeleted: false },
      orderBy: { data: "desc" },
      select: {
        id: true,
        ativoId: true,
        tipo: true,
        valor: true,
        data: true,
        observacao: true,
      },
    }),
  ]);

  const rows: AtivoRow[] = ativos.map((a) => {
    const doAtivo: LancamentoRow[] = lancamentos
      .filter((l) => l.ativoId === a.id)
      .map((l) => ({
        id: l.id,
        tipo: l.tipo as LancamentoRow["tipo"],
        valor: Number(String(l.valor)),
        data: l.data,
        observacao: l.observacao,
      }));

    const totalAportado = doAtivo
      .filter((l) => l.tipo === "aporte")
      .reduce((acc, l) => acc + l.valor, 0);
    const totalResgatado = doAtivo
      .filter((l) => l.tipo === "resgate")
      .reduce((acc, l) => acc + l.valor, 0);
    const totalProventos = doAtivo
      .filter((l) => l.tipo === "provento")
      .reduce((acc, l) => acc + l.valor, 0);

    const valorInvestido = totalAportado - totalResgatado;
    const valorAtualManual = a.valorAtual !== null ? Number(String(a.valorAtual)) : null;
    const valorAtual = valorAtualManual ?? Math.max(valorInvestido, 0);

    // Rentabilidade = (valor atual + tudo que saiu) / tudo que entrou − 1
    const rentabilidade =
      totalAportado > 0
        ? ((valorAtual + totalResgatado + totalProventos - totalAportado) / totalAportado) * 100
        : null;

    return {
      id: a.id,
      nome: a.nome,
      classe: a.classe,
      totalAportado,
      totalResgatado,
      totalProventos,
      valorInvestido,
      valorAtual,
      valorAtualManual,
      dataAtualizacao: a.dataAtualizacao,
      rentabilidade,
      lancamentos: doAtivo,
    };
  });

  const totalInvestido = rows.reduce((acc, r) => acc + r.valorInvestido, 0);
  const valorAtualTotal = rows.reduce((acc, r) => acc + r.valorAtual, 0);
  const totalProventos = rows.reduce((acc, r) => acc + r.totalProventos, 0);
  const totalAportadoGeral = rows.reduce((acc, r) => acc + r.totalAportado, 0);
  const totalResgatadoGeral = rows.reduce((acc, r) => acc + r.totalResgatado, 0);
  const rentabilidadeTotal =
    totalAportadoGeral > 0
      ? ((valorAtualTotal + totalResgatadoGeral + totalProventos - totalAportadoGeral) /
          totalAportadoGeral) *
        100
      : null;

  // Distribuição por classe (sobre o valor atual)
  const porClasse = new Map<string, number>();
  for (const r of rows) {
    if (r.valorAtual > 0) {
      porClasse.set(r.classe, (porClasse.get(r.classe) ?? 0) + r.valorAtual);
    }
  }
  const distribuicao = [...porClasse.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([classe, valor]) => {
      const info = getClasseInfo(classe);
      return {
        classe,
        label: info.label,
        cor: info.cor,
        valor,
        percentual: valorAtualTotal > 0 ? (valor / valorAtualTotal) * 100 : 0,
      };
    });

  // Evolução: patrimônio aportado acumulado nos últimos 12 meses
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("pt-BR", { month: "short" });
  const evolucao: { label: string; valor: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const fimMes = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const acumulado = lancamentos
      .filter((l) => new Date(l.data) < fimMes)
      .reduce((acc, l) => {
        const v = Number(String(l.valor));
        if (l.tipo === "aporte") return acc + v;
        if (l.tipo === "resgate") return acc - v;
        return acc;
      }, 0);
    const ref = new Date(now.getFullYear(), now.getMonth() - i, 1);
    evolucao.push({ label: fmt.format(ref).replace(".", ""), valor: acumulado });
  }

  return {
    ativos: rows,
    totalInvestido,
    valorAtualTotal,
    totalProventos,
    rentabilidadeTotal,
    distribuicao,
    evolucao,
  };
}
