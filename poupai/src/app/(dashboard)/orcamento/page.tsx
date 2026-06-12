import type { Metadata } from "next";
import { getCurrentUserId } from "@/lib/auth";
import { getOrcamentosComGasto } from "@/services/orcamentos";
import { getCategorias } from "@/services/categorias";
import { OrcamentoClient } from "./_components/orcamento-client";

export const metadata: Metadata = { title: "Orçamento" };

export default async function OrcamentoPage() {
  const userId = await getCurrentUserId();
  const [data, categorias] = await Promise.all([
    getOrcamentosComGasto(userId),
    getCategorias(userId),
  ]);
  return <OrcamentoClient data={data} categorias={categorias} />;
}
