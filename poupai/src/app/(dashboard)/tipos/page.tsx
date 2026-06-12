import type { Metadata } from "next";
import { getCurrentUserId } from "@/lib/auth";
import { getTiposMovimentacao } from "@/services/tipos";
import { TiposClient } from "./_components/tipos-client";

export const metadata: Metadata = { title: "Tipos de Movimentação" };

export default async function TiposPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const userId = await getCurrentUserId();
  const [{ q }, tipos] = await Promise.all([searchParams, getTiposMovimentacao(userId)]);
  return <TiposClient tipos={tipos} initialSearch={q} />;
}
