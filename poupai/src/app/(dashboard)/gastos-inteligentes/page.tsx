import { Sparkles } from "lucide-react";
import { getCurrentUserId } from "@/lib/auth";
import { getGastosInteligentes } from "@/services/gastos-inteligentes";
import { GastosClient } from "./_components/gastos-client";

export default async function GastosInteligentesPage() {
  const userId = await getCurrentUserId();
  const data = await getGastosInteligentes(userId);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-violet-500" />
          <h1 className="text-2xl font-bold">Gastos Inteligentes</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Análise automática dos seus hábitos de consumo com oportunidades de economia.
        </p>
      </div>

      <GastosClient data={data} />
    </div>
  );
}
