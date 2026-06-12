import "server-only";
import { prisma } from "@/lib/prisma";

export interface SearchHit {
  id: number;
  titulo: string;
  subtitulo: string | null;
  valor: number | null;
  isEntrada: boolean | null;
}

export interface GlobalSearchResults {
  movimentacoes: SearchHit[];
  fixas: SearchHit[];
  categorias: SearchHit[];
  tipos: SearchHit[];
}

const TAKE = 5;

export async function globalSearch(
  userId: string,
  query: string
): Promise<GlobalSearchResults> {
  const term = query.trim();
  if (term.length < 2) {
    return { movimentacoes: [], fixas: [], categorias: [], tipos: [] };
  }

  const contains = { contains: term, mode: "insensitive" as const };

  const [movimentacoes, fixas, categorias, tipos] = await Promise.all([
    prisma.movimentacao.findMany({
      where: {
        userId,
        isDeleted: false,
        OR: [
          { descricao: contains },
          { categoria: contains },
          { tipo: { nome: contains } },
        ],
      },
      orderBy: { data: "desc" },
      take: TAKE,
      select: {
        id: true,
        descricao: true,
        categoria: true,
        valor: true,
        isEntrada: true,
        tipo: { select: { nome: true } },
      },
    }),
    prisma.movimentacaoFixa.findMany({
      where: {
        userId,
        isDeleted: false,
        OR: [
          { nome: contains },
          { categoria: contains },
          { tipoMovimentacao: { nome: contains } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: TAKE,
      select: {
        id: true,
        nome: true,
        categoria: true,
        valor: true,
        isEntrada: true,
      },
    }),
    prisma.categoria.findMany({
      where: { userId, isDeleted: false, nome: contains },
      orderBy: { nome: "asc" },
      take: TAKE,
      select: { id: true, nome: true, tipo: true },
    }),
    prisma.tipoMovimentacao.findMany({
      where: {
        userId,
        isDeleted: false,
        OR: [{ nome: contains }, { descricao: contains }],
      },
      orderBy: { nome: "asc" },
      take: TAKE,
      select: { id: true, nome: true, descricao: true, isEntrada: true },
    }),
  ]);

  return {
    movimentacoes: movimentacoes.map((m) => ({
      id: m.id,
      titulo: m.descricao || m.tipo.nome,
      subtitulo: m.categoria,
      valor: Number(String(m.valor)),
      isEntrada: m.isEntrada,
    })),
    fixas: fixas.map((f) => ({
      id: f.id,
      titulo: f.nome,
      subtitulo: f.categoria,
      valor: Number(String(f.valor)),
      isEntrada: f.isEntrada,
    })),
    categorias: categorias.map((c) => ({
      id: c.id,
      titulo: c.nome,
      subtitulo:
        c.tipo === "entrada" ? "Entrada" : c.tipo === "saida" ? "Saída" : "Ambos",
      valor: null,
      isEntrada: null,
    })),
    tipos: tipos.map((t) => ({
      id: t.id,
      titulo: t.nome,
      subtitulo: t.descricao,
      valor: null,
      isEntrada: t.isEntrada,
    })),
  };
}
