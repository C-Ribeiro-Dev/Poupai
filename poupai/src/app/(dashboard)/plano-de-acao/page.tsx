import { CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCurrentUserId } from "@/lib/auth";
import { getPlanoAcao } from "@/services/plano-acao";
import { PlanoClient } from "./_components/plano-client";

const DIAGNOSTICO_CONFIG = {
  estavel: { label: "Estável", cor: "text-emerald-600", bg: "bg-emerald-50 border-emerald-300 dark:bg-emerald-950/30" },
  atencao: { label: "Atenção", cor: "text-amber-600", bg: "bg-amber-50 border-amber-300 dark:bg-amber-950/30" },
  critica: { label: "Crítica", cor: "text-destructive", bg: "bg-destructive/5 border-destructive/30" },
};

export default async function PlanoDeAcaoPage() {
  const userId = await getCurrentUserId();
  const data = await getPlanoAcao(userId);

  const diagCfg = DIAGNOSTICO_CONFIG[data.resumo.diagnostico];

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Plano de Ação Financeiro</h1>
        <p className="text-sm text-muted-foreground">
          Ações personalizadas geradas automaticamente para melhorar sua saúde financeira.
        </p>
      </div>

      {/* Resumo da situação */}
      <div className={cn("rounded-xl border p-4", diagCfg.bg)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {data.resumo.diagnostico === "estavel" ? (
              <CheckCircle2 className={cn("size-5", diagCfg.cor)} />
            ) : (
              <AlertTriangle className={cn("size-5", diagCfg.cor)} />
            )}
            <p className={cn("text-sm font-semibold", diagCfg.cor)}>
              Situação {diagCfg.label}
            </p>
          </div>
          <div className="flex items-center gap-3 text-right">
            <div>
              <p className="text-[10px] text-muted-foreground">Score</p>
              <p className={cn("text-xl font-black", diagCfg.cor)}>{data.resumo.score}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Ações</p>
              <p className="text-xl font-black">{data.resumo.totalAcoes}</p>
            </div>
            {data.resumo.urgentes > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground">Urgentes</p>
                <p className="text-xl font-black text-destructive">{data.resumo.urgentes}</p>
              </div>
            )}
          </div>
        </div>
        {data.resumo.urgentes > 0 && (
          <p className="mt-2 text-xs text-destructive">
            Você tem {data.resumo.urgentes} ação{data.resumo.urgentes > 1 ? "ções" : ""} urgente{data.resumo.urgentes > 1 ? "s" : ""} que precisam de atenção imediata.
          </p>
        )}
        {data.resumo.altas > 0 && data.resumo.urgentes === 0 && (
          <p className="mt-2 text-xs text-amber-600">
            {data.resumo.altas} ação{data.resumo.altas > 1 ? "ões" : ""} de alta prioridade identificada{data.resumo.altas > 1 ? "s" : ""}.
          </p>
        )}
        {data.resumo.urgentes === 0 && data.resumo.altas === 0 && (
          <p className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
            <TrendingUp className="size-3" />
            Sua situação está controlada. Foque nas melhorias do mês.
          </p>
        )}
      </div>

      {/* Client: tabs + ações interativas */}
      <PlanoClient data={data} />
    </div>
  );
}
