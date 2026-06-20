"use server";

import { getCurrentUserId } from "@/lib/auth";
import { getGastosCartaoPorCategoria, type PeriodoCartao } from "@/services/gastos-cartao-categoria";

export async function fetchGastosCartaoPorCategoria(periodo: PeriodoCartao) {
  const userId = await getCurrentUserId();
  return getGastosCartaoPorCategoria(userId, periodo);
}
