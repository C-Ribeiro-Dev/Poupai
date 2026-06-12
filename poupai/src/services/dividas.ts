import "server-only";
import { prisma } from "@/lib/prisma";
import type { DividaRow } from "@/types/dividas";

// Calcula a parcela Price (juros compostos) ou simples (sem juros)
function calcParcela(valorTotal: number, taxa: number, n: number): number {
  if (taxa === 0 || n === 1) return valorTotal / n;
  const r = taxa / 100;
  return (valorTotal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function toRow(d: {
  id: number;
  credor: string;
  descricao: string | null;
  valorTotal: unknown;
  taxaJurosMensal: unknown;
  nParcelas: number;
  parcelasPagas: number;
  dataInicio: Date;
  dataProxVencimento: Date | null;
  categoria: string | null;
  observacoes: string | null;
  quitada: boolean;
  createdAt: Date;
}): DividaRow {
  const vTotal = Number(String(d.valorTotal));
  const taxa = Number(String(d.taxaJurosMensal));
  const parcela = calcParcela(vTotal, taxa, d.nParcelas);
  const valorPago = parcela * d.parcelasPagas;
  const totalComJuros = parcela * d.nParcelas;
  const saldoDevedor = Math.max(0, totalComJuros - valorPago);
  const percentualPago = d.nParcelas > 0 ? (d.parcelasPagas / d.nParcelas) * 100 : 0;

  return {
    id: d.id,
    credor: d.credor,
    descricao: d.descricao,
    valorTotal: vTotal,
    taxaJurosMensal: taxa,
    nParcelas: d.nParcelas,
    parcelasPagas: d.parcelasPagas,
    dataInicio: d.dataInicio,
    dataProxVencimento: d.dataProxVencimento,
    categoria: d.categoria,
    observacoes: d.observacoes,
    quitada: d.quitada,
    createdAt: d.createdAt,
    valorParcela: parcela,
    valorPago,
    saldoDevedor,
    percentualPago,
  };
}

const select = {
  id: true,
  credor: true,
  descricao: true,
  valorTotal: true,
  taxaJurosMensal: true,
  nParcelas: true,
  parcelasPagas: true,
  dataInicio: true,
  dataProxVencimento: true,
  categoria: true,
  observacoes: true,
  quitada: true,
  createdAt: true,
} as const;

export async function getDividas(userId: string): Promise<DividaRow[]> {
  const rows = await prisma.divida.findMany({
    where: { userId, isDeleted: false },
    orderBy: [{ quitada: "asc" }, { dataProxVencimento: "asc" }, { createdAt: "desc" }],
    select,
  });
  return rows.map(toRow);
}

export async function getDividaById(id: number, userId: string): Promise<DividaRow | null> {
  const row = await prisma.divida.findFirst({
    where: { id, userId, isDeleted: false },
    select,
  });
  return row ? toRow(row) : null;
}
