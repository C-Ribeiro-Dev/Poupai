"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  GastosInteligentesData,
  CategoriaGasto,
  OportunidadeEconomia,
} from "@/types/gastos-inteligentes";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const TIPO_OPT_ICON: Record<string, string> = {
  acima_orcamento: "📊",
  categoria_alta: "📈",
  concentracao: "🎯",
  parcelamento: "💳",
  recorrente: "🔄",
};

function TendenciaIcon({ dir, pct }: { dir: string; pct: number }) {
  if (dir === "subindo")
    return <TrendingUp className={cn("size-4", pct > 30 ? "text-destructive" : "text-amber-500")} />;
  if (dir === "caindo")
    return <TrendingDown className="size-4 text-emerald-500" />;
  return <Minus className="size-4 text-muted-foreground" />;
}

function CategoriaRow({ cat }: { cat: CategoriaGasto }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border bg-card">
      <button
        className="flex w-full items-center gap-3 p-3 text-left"
        onClick={() => setOpen((p) => !p)}
      >
        <div className="size-3 shrink-0 rounded-full" style={{ backgroundColor: cat.cor }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium">{cat.nome}</p>
            <p className="shrink-0 text-sm font-bold tabular-nums">{fmt(cat.valorMesAtual)}</p>
          </div>
          {/* barra do total */}
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                cat.status === "critico" ? "bg-destructive"
                  : cat.status === "atencao" ? "bg-amber-500"
                  : "bg-sky-500"
              )}
              style={{ backgroundColor: cat.cor, width: `${Math.min(cat.percentualDoTotal, 100)}%` }}
            />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <TendenciaIcon dir={cat.tendencia} pct={cat.variacaoPct} />
          {open ? <ChevronUp className="size-3.5 text-muted-foreground" /> : <ChevronDown className="size-3.5 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="border-t px-3 pb-3 pt-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Mês anterior</p>
              <p className="font-semibold tabular-nums">{fmt(cat.valorMesAnterior)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Variação</p>
              <p className={cn(
                "font-semibold tabular-nums",
                cat.variacaoPct > 0 ? "text-red-600" : "text-emerald-600"
              )}>
                {cat.variacaoPct > 0 ? "+" : ""}{cat.variacaoPct.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Média 3 meses</p>
              <p className="font-semibold tabular-nums">{fmt(cat.mediaUltimos3m)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">% do total</p>
              <p className="font-semibold">{cat.percentualDoTotal.toFixed(1)}%</p>
            </div>
            {cat.orcamento !== null && (
              <>
                <div>
                  <p className="text-muted-foreground">Orçamento</p>
                  <p className="font-semibold tabular-nums">{fmt(cat.orcamento)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Utilização</p>
                  <p className={cn(
                    "font-semibold",
                    (cat.percentualOrcamento ?? 0) > 100 ? "text-destructive" : "text-emerald-600"
                  )}>
                    {cat.percentualOrcamento?.toFixed(0) ?? 0}%
                  </p>
                </div>
              </>
            )}
          </div>
          {cat.orcamento !== null && cat.percentualOrcamento !== null && (
            <div className="mt-2">
              <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
                <span>Gasto</span>
                <span>Limite</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full",
                    cat.percentualOrcamento > 120 ? "bg-destructive"
                      : cat.percentualOrcamento > 90 ? "bg-amber-500"
                      : "bg-emerald-500"
                  )}
                  style={{ width: `${Math.min(cat.percentualOrcamento, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OportunidadeCard({ op }: { op: OportunidadeEconomia }) {
  const PRIO = {
    alta: { bg: "border-amber-300 bg-amber-50 dark:bg-amber-950/20", badge: "bg-amber-100 text-amber-700", label: "Alta" },
    media: { bg: "border-sky-200 bg-sky-50 dark:bg-sky-950/20", badge: "bg-sky-100 text-sky-700", label: "Média" },
    baixa: { bg: "border-border bg-muted/30", badge: "bg-muted text-muted-foreground", label: "Baixa" },
  };
  const p = PRIO[op.prioridade];
  return (
    <div className={cn("rounded-xl border p-4", p.bg)}>
      <div className="flex items-start gap-3">
        <span className="text-xl">{TIPO_OPT_ICON[op.tipo] ?? "💡"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 justify-between">
            <p className="text-sm font-semibold leading-snug">{op.titulo}</p>
            <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold", p.badge)}>
              {p.label}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{op.descricao}</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-sm font-bold text-emerald-600">
              Economia: {fmt(op.economiaPotencial)}
            </span>
            {op.href && (
              <Link href={op.href} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                Ver <ExternalLink className="size-3" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type Aba = "categorias" | "oportunidades" | "tendencias";

export function GastosClient({ data }: { data: GastosInteligentesData }) {
  const [aba, setAba] = useState<Aba>("categorias");
  const [mostrarTodas, setMostrarTodas] = useState(false);

  const { resumo, oportunidades, tendencias, economiaPotencialTotal } = data;
  const catsMostradas = mostrarTodas ? resumo.categorias : resumo.categorias.slice(0, 6);

  const varPct = resumo.variacaoPct;
  const subindo = varPct > 5;
  const caindo = varPct < -5;

  const ABAS: { id: Aba; label: string; count?: number }[] = [
    { id: "categorias", label: "Categorias", count: resumo.categorias.length },
    { id: "oportunidades", label: "Oportunidades", count: oportunidades.length },
    { id: "tendencias", label: "Tendências", count: tendencias.length },
  ];

  return (
    <div className="space-y-5">
      {/* Resumo financeiro */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-3">
          <p className="text-[10px] text-muted-foreground">Este mês</p>
          <p className="text-lg font-bold tabular-nums">{fmt(resumo.totalMesAtual)}</p>
          <div className={cn(
            "mt-1 flex items-center gap-1 text-xs font-semibold",
            subindo ? "text-red-600" : caindo ? "text-emerald-600" : "text-muted-foreground"
          )}>
            {subindo ? <TrendingUp className="size-3" /> : caindo ? <TrendingDown className="size-3" /> : <Minus className="size-3" />}
            {Math.abs(varPct).toFixed(1)}% vs mês ant.
          </div>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-[10px] text-muted-foreground">Mês anterior</p>
          <p className="text-lg font-bold tabular-nums">{fmt(resumo.totalMesAnterior)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {resumo.variacaoAbsoluta > 0 ? "+" : ""}{fmt(resumo.variacaoAbsoluta)}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-[10px] text-muted-foreground">Média 3 meses</p>
          <p className="text-lg font-bold tabular-nums">{fmt(resumo.mediaUltimos3m)}</p>
          <p className="mt-1 text-xs text-muted-foreground">últimos 3 meses</p>
        </div>
        {economiaPotencialTotal > 0 && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 dark:bg-emerald-950/20">
            <p className="text-[10px] text-emerald-600">Economia potencial</p>
            <p className="text-lg font-bold tabular-nums text-emerald-700">{fmt(economiaPotencialTotal)}</p>
            <p className="mt-1 text-xs text-emerald-600">{oportunidades.length} oportunidades</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border bg-muted/30 p-1">
        {ABAS.map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => setAba(id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
              aba === id
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
            {count !== undefined && count > 0 && (
              <span className={cn(
                "rounded-full px-1.5 text-[10px] font-bold",
                aba === id ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {aba === "categorias" && (
        <div className="space-y-2">
          {catsMostradas.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma despesa categorizada neste mês.
            </p>
          ) : (
            catsMostradas.map((cat) => <CategoriaRow key={cat.nome} cat={cat} />)
          )}
          {resumo.categorias.length > 6 && (
            <button
              onClick={() => setMostrarTodas((p) => !p)}
              className="w-full rounded-xl border bg-muted/30 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {mostrarTodas
                ? "Mostrar menos"
                : `Ver mais ${resumo.categorias.length - 6} categorias`}
            </button>
          )}
        </div>
      )}

      {aba === "oportunidades" && (
        <div className="space-y-3">
          {oportunidades.length === 0 ? (
            <div className="rounded-xl border bg-card p-8 text-center">
              <Lightbulb className="mx-auto mb-2 size-8 text-emerald-400" />
              <p className="text-sm text-muted-foreground">
                Nenhuma oportunidade identificada. Continue assim!
              </p>
            </div>
          ) : (
            oportunidades.map((op) => <OportunidadeCard key={op.id} op={op} />)
          )}
        </div>
      )}

      {aba === "tendencias" && (
        <div className="space-y-3">
          {tendencias.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sem dados suficientes para identificar tendências.
            </p>
          ) : (
            tendencias.map((t) => (
              <div key={t.categoria} className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="size-3 rounded-full shrink-0" style={{ backgroundColor: t.cor }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 justify-between">
                      <p className="text-sm font-semibold">{t.categoria}</p>
                      <div className="flex items-center gap-1">
                        <TendenciaIcon dir={t.direcao} pct={t.variacaoPct} />
                        <span className={cn(
                          "text-xs font-bold tabular-nums",
                          t.direcao === "subindo" ? "text-red-600" : t.direcao === "caindo" ? "text-emerald-600" : "text-muted-foreground"
                        )}>
                          {t.variacaoPct > 0 ? "+" : ""}{t.variacaoPct.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t.descricao}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                      Variação: {t.variacaoAbsoluta > 0 ? "+" : ""}{fmt(t.variacaoAbsoluta)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Top compras */}
      {resumo.topCompras.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold">Maiores Gastos do Mês</h2>
          <div className="space-y-2">
            {resumo.topCompras.slice(0, 5).map((c, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                <span className="shrink-0 text-xs font-bold text-muted-foreground w-5">
                  #{i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{c.descricao}</p>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    {c.categoria && <span>{c.categoria}</span>}
                    {c.cartao && <span>• {c.cartao}</span>}
                    {c.parcelas && <span>• {c.parcelas}x</span>}
                  </div>
                </div>
                <p className="shrink-0 text-sm font-bold tabular-nums">{fmt(c.valor)}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
