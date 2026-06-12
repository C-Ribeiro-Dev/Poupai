import type { Metadata } from "next";
import { getCurrentUserId } from "@/lib/auth";
import { getCategorias } from "@/services/categorias";
import { CategoriasClient } from "./_components/categorias-client";

export const metadata: Metadata = { title: "Categorias" };

export default async function CategoriasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const userId = await getCurrentUserId();
  const [{ q }, categorias] = await Promise.all([searchParams, getCategorias(userId)]);
  return <CategoriasClient categorias={categorias} initialSearch={q} />;
}
