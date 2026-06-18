import "server-only";
import { prisma } from "@/lib/prisma";

export interface RecorrenteSugestao {
  descricao: string;
  ocorrencias: number;
  valorMedio: number;
  categoria: string | null;
  tipo: string | null;
  isEntrada: boolean;
}

export async function detectarRecorrentes(userId: string): Promise<RecorrenteSugestao[]> {
  const mesAtras4 = new Date();
  mesAtras4.setMonth(mesAtras4.getMonth() - 4);
  mesAtras4.setDate(1);
  mesAtras4.setHours(0, 0, 0, 0);

  const [movs, fixas] = await Promise.all([
    prisma.movimentacao.findMany({
      where: { userId, isDeleted: false, data: { gte: mesAtras4 } },
      select: { descricao: true, valor: true, data: true, categoria: true, tipo: { select: { nome: true } }, isEntrada: true },
    }),
    prisma.movimentacaoFixa.findMany({
      where: { userId, isDeleted: false },
      select: { nome: true },
    }),
  ]);

  const fixasNomes = new Set(fixas.map((f) => f.nome.toLowerCase().trim()));

  // Group by normalized description
  const grupos = new Map<
    string,
    { meses: Set<string>; valores: number[]; categoria: string | null; tipo: string | null; isEntrada: boolean }
  >();

  for (const m of movs) {
    if (!m.descricao) continue;
    const chave = m.descricao.toLowerCase().trim();
    if (fixasNomes.has(chave)) continue;

    const mes = `${m.data.getFullYear()}-${String(m.data.getMonth()).padStart(2, "0")}`;
    if (!grupos.has(chave)) {
      grupos.set(chave, { meses: new Set(), valores: [], categoria: m.categoria, tipo: m.tipo.nome, isEntrada: m.isEntrada });
    }
    const g = grupos.get(chave)!;
    g.meses.add(mes);
    g.valores.push(Number(m.valor));
  }

  const sugestoes: RecorrenteSugestao[] = [];

  for (const [descricao, g] of grupos) {
    if (g.meses.size < 2) continue;

    const valores = g.valores;
    const mean = valores.reduce((s, v) => s + v, 0) / valores.length;
    const variance = valores.reduce((s, v) => s + (v - mean) ** 2, 0) / valores.length;
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 1;

    if (cv > 0.4) continue; // too inconsistent

    const descricaoOriginal =
      movs.find((m) => m.descricao?.toLowerCase().trim() === descricao)?.descricao ?? descricao;

    sugestoes.push({
      descricao: descricaoOriginal,
      ocorrencias: g.meses.size,
      valorMedio: mean,
      categoria: g.categoria,
      tipo: g.tipo,
      isEntrada: g.isEntrada,
    });
  }

  return sugestoes
    .sort((a, b) => b.ocorrencias - a.ocorrencias || b.valorMedio - a.valorMedio)
    .slice(0, 8);
}
