import type { Metadata } from "next";
import { getCurrentUserId } from "@/lib/auth";
import { getCartoes } from "@/services/cartoes";
import { getTiposMovimentacao } from "@/services/tipos";
import { getCategorias } from "@/services/categorias";
import { CartoesClient } from "./_components/cartoes-client";

export const metadata: Metadata = { title: "Cartões" };

export default async function CartoesPage() {
  const userId = await getCurrentUserId();
  const [cartoes, tipos, categorias] = await Promise.all([
    getCartoes(userId),
    getTiposMovimentacao(userId),
    getCategorias(userId),
  ]);
  return <CartoesClient cartoes={cartoes} tipos={tipos} categorias={categorias} />;
}
