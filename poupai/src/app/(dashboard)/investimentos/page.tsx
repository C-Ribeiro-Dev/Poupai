import type { Metadata } from "next";
import { getCurrentUserId } from "@/lib/auth";
import { getInvestimentos } from "@/services/investimentos";
import { InvestimentosClient } from "./_components/investimentos-client";

export const metadata: Metadata = { title: "Investimentos" };

export default async function InvestimentosPage() {
  const userId = await getCurrentUserId();
  const data = await getInvestimentos(userId);
  return <InvestimentosClient data={data} />;
}
