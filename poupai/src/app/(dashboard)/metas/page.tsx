import type { Metadata } from "next";
import { getCurrentUserId } from "@/lib/auth";
import { getMetas } from "@/services/metas";
import { MetasClient } from "./_components/metas-client";

export const metadata: Metadata = { title: "Metas" };

export default async function MetasPage() {
  const userId = await getCurrentUserId();
  const metas = await getMetas(userId);
  return <MetasClient metas={metas} />;
}
