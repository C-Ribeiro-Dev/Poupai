import "server-only";
import { prisma } from "@/lib/prisma";
import type { MovimentacaoRow } from "@/types/movimentacoes";
import type { Prisma } from "@/generated/prisma/client";

const PAGE_LIMIT = 50;

export interface MovimentacoesPageResult {
  items: MovimentacaoRow[];
  total: number;
  page: number;
  totalPages: number;
}

function buildDateFilter(
  period: string,
  start?: string,
  end?: string
): Prisma.DateTimeFilter | undefined {
  const now = new Date();
  switch (period) {
    case "week": {
      const gte = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      return { gte };
    }
    case "month":
      return { gte: new Date(now.getFullYear(), now.getMonth(), 1) };
    case "year":
      return { gte: new Date(now.getFullYear(), 0, 1) };
    case "custom": {
      const filter: Prisma.DateTimeFilter = {};
      if (start) filter.gte = new Date(start + "T00:00:00");
      if (end) filter.lte = new Date(end + "T23:59:59");
      return Object.keys(filter).length ? filter : undefined;
    }
    default:
      return undefined;
  }
}

const SELECT = {
  id: true,
  valor: true,
  tipoId: true,
  tipo: { select: { nome: true } },
  isEntrada: true,
  data: true,
  categoria: true,
  descricao: true,
  isFixaOuDiaria: true,
  movimentacaoFixaId: true,
  contaId: true,
  conta: { select: { nome: true } },
  createdAt: true,
} as const;

type RawRow = Prisma.MovimentacaoGetPayload<{ select: typeof SELECT }>;

function toRow(m: RawRow): MovimentacaoRow {
  return {
    id: m.id,
    valor: Number(String(m.valor)),
    tipoId: m.tipoId,
    tipoNome: m.tipo.nome,
    isEntrada: m.isEntrada,
    data: m.data,
    categoria: m.categoria,
    descricao: m.descricao,
    isFixaOuDiaria: m.isFixaOuDiaria,
    movimentacaoFixaId: m.movimentacaoFixaId,
    contaId: m.contaId,
    contaNome: m.conta?.nome ?? null,
    createdAt: m.createdAt,
  };
}

export interface GetMovimentacoesParams {
  q?: string;
  period?: string;
  start?: string;
  end?: string;
  dir?: string;
  tipoId?: string;
  cat?: string;
  sort?: string;
  order?: string;
  page?: number;
}

export async function getMovimentacoesPaginadas(
  userId: string,
  params: GetMovimentacoesParams = {}
): Promise<MovimentacoesPageResult> {
  const { q, period = "all", start, end, dir, tipoId, cat, sort = "data", order = "desc" } = params;
  const page = Math.max(1, params.page ?? 1);

  const where: Prisma.MovimentacaoWhereInput = { userId, isDeleted: false };

  const dateFilter = buildDateFilter(period, start, end);
  if (dateFilter) where.data = dateFilter;

  if (dir === "entrada") where.isEntrada = true;
  if (dir === "saida") where.isEntrada = false;

  if (tipoId) where.tipoId = parseInt(tipoId, 10);

  if (cat === "__sem__") {
    where.categoria = null;
  } else if (cat) {
    where.categoria = cat;
  }

  if (q?.trim()) {
    where.OR = [
      { descricao: { contains: q, mode: "insensitive" } },
      { categoria: { contains: q, mode: "insensitive" } },
      { tipo: { nome: { contains: q, mode: "insensitive" } } },
    ];
  }

  const orderBy: Prisma.MovimentacaoOrderByWithRelationInput =
    sort === "valor" ? { valor: order as "asc" | "desc" } : { data: order as "asc" | "desc" };

  const [raw, total] = await Promise.all([
    prisma.movimentacao.findMany({
      where,
      orderBy,
      select: SELECT,
      skip: (page - 1) * PAGE_LIMIT,
      take: PAGE_LIMIT,
    }),
    prisma.movimentacao.count({ where }),
  ]);

  return {
    items: raw.map(toRow),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_LIMIT)),
  };
}

export async function getMovimentacoes(userId: string): Promise<MovimentacaoRow[]> {
  const raw = await prisma.movimentacao.findMany({
    where: { userId, isDeleted: false },
    orderBy: { data: "desc" },
    select: {
      id: true,
      valor: true,
      tipoId: true,
      tipo: { select: { nome: true } },
      isEntrada: true,
      data: true,
      categoria: true,
      descricao: true,
      isFixaOuDiaria: true,
      movimentacaoFixaId: true,
      contaId: true,
      conta: { select: { nome: true } },
      createdAt: true,
    },
  });

  return raw.map((m) => ({
    id: m.id,
    valor: Number(String(m.valor)),
    tipoId: m.tipoId,
    tipoNome: m.tipo.nome,
    isEntrada: m.isEntrada,
    data: m.data,
    categoria: m.categoria,
    descricao: m.descricao,
    isFixaOuDiaria: m.isFixaOuDiaria,
    movimentacaoFixaId: m.movimentacaoFixaId,
    contaId: m.contaId,
    contaNome: m.conta?.nome ?? null,
    createdAt: m.createdAt,
  }));
}
