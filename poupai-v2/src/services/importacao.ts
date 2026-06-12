import "server-only";
import { prisma } from "@/lib/prisma";

// Mapa descrição (normalizada) → categoria mais usada, com base no histórico do usuário.
// Usado para sugerir categorias automaticamente na importação de extrato.
export async function getSugestoesCategoria(userId: string): Promise<Record<string, string>> {
  const movs = await prisma.movimentacao.findMany({
    where: { userId, isDeleted: false, categoria: { not: null }, descricao: { not: null } },
    orderBy: { data: "desc" },
    take: 1000,
    select: { descricao: true, categoria: true },
  });

  // Conta a categoria mais frequente por descrição
  const contagem = new Map<string, Map<string, number>>();
  for (const m of movs) {
    const desc = m.descricao!.trim().toLowerCase();
    if (desc.length < 3) continue;
    const porCat = contagem.get(desc) ?? new Map<string, number>();
    porCat.set(m.categoria!, (porCat.get(m.categoria!) ?? 0) + 1);
    contagem.set(desc, porCat);
  }

  const sugestoes: Record<string, string> = {};
  for (const [desc, porCat] of contagem) {
    let melhor = "";
    let max = 0;
    for (const [cat, n] of porCat) {
      if (n > max) {
        max = n;
        melhor = cat;
      }
    }
    if (melhor) sugestoes[desc] = melhor;
  }
  return sugestoes;
}

// Identificadores externos já importados (para marcar duplicados no preview)
export async function getIdsExternosImportados(userId: string): Promise<string[]> {
  const rows = await prisma.movimentacao.findMany({
    where: { userId, idExterno: { not: null } },
    select: { idExterno: true },
  });
  return rows.map((r) => r.idExterno!);
}
