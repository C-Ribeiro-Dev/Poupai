import type { Metadata } from "next";
import { getCurrentUserId } from "@/lib/auth";
import { getDividas } from "@/services/dividas";
import { DividasClient } from "./_components/dividas-client";

export const metadata: Metadata = { title: "Dívidas" };

export default async function DividasPage() {
  const userId = await getCurrentUserId();
  const dividas = await getDividas(userId);
  return <DividasClient dividas={dividas} />;
}
