import type { Metadata } from "next";
import { getCurrentUserId } from "@/lib/auth";
import { getProximosCompromissos } from "@/services/compromissos";
import { CompromissosClient } from "./_components/compromissos-client";

export const metadata: Metadata = { title: "Próximos Compromissos" };

export default async function CompromissosPage() {
  const userId = await getCurrentUserId();
  const data = await getProximosCompromissos(userId);
  return <CompromissosClient data={data} />;
}
