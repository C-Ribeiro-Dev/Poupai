import type { Metadata } from "next";
import { getCurrentUserId } from "@/lib/auth";
import { getContas } from "@/services/contas";
import { ContasClient } from "./_components/contas-client";

export const metadata: Metadata = { title: "Contas" };

export default async function ContasPage() {
  const userId = await getCurrentUserId();
  const data = await getContas(userId);
  return <ContasClient data={data} />;
}
