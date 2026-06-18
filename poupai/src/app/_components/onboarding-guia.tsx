"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, X, ChevronRight, Landmark, ArrowUpDown, BarChart2 } from "lucide-react";

const LS_KEY = "poupai_onboarding_v1";

interface Passo {
  icon: React.ElementType;
  titulo: string;
  desc: string;
  href: string;
  cta: string;
}

const PASSOS: Passo[] = [
  {
    icon: Landmark,
    titulo: "Adicione uma conta bancária",
    desc: "Registre seu saldo inicial em Contas para que o Poupai saiba de onde partir.",
    href: "/contas",
    cta: "Ir para Contas",
  },
  {
    icon: ArrowUpDown,
    titulo: "Registre sua primeira movimentação",
    desc: "Lance uma receita ou despesa para ver seu dashboard ganhar vida.",
    href: "/movimentacoes",
    cta: "Ir para Movimentações",
  },
  {
    icon: BarChart2,
    titulo: "Explore seus relatórios",
    desc: "Veja gráficos de receitas vs despesas e entenda seus hábitos financeiros.",
    href: "/relatorios",
    cta: "Ver Relatórios",
  },
];

interface Props {
  mostrar: boolean;
}

export function OnboardingGuia({ mostrar }: Props) {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (!mostrar) return;
    const dispensado = localStorage.getItem(LS_KEY);
    if (!dispensado) setVisivel(true);
  }, [mostrar]);

  function dispensar() {
    localStorage.setItem(LS_KEY, "1");
    setVisivel(false);
  }

  if (!visivel) return null;

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-800/30 dark:bg-indigo-900/10">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 shrink-0 text-indigo-500" />
          <div>
            <h2 className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
              Bem-vindo ao Poupai!
            </h2>
            <p className="mt-0.5 text-xs text-indigo-700/70 dark:text-indigo-400">
              Siga estes primeiros passos para tirar o máximo da plataforma.
            </p>
          </div>
        </div>
        <button
          onClick={dispensar}
          className="rounded-md p-1 text-indigo-600/50 transition-colors hover:bg-indigo-200/50 hover:text-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-800/30 dark:hover:text-indigo-200"
          aria-label="Dispensar guia"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {PASSOS.map((p, i) => {
          const Icon = p.icon;
          return (
            <div
              key={i}
              className="flex flex-col gap-3 rounded-lg border border-indigo-200 bg-white p-3 dark:border-indigo-800/30 dark:bg-indigo-950/30"
            >
              <div className="flex items-center gap-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                  {i + 1}
                </span>
                <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-indigo-500/10">
                  <Icon className="size-3.5 text-indigo-500" />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold">{p.titulo}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{p.desc}</p>
              </div>
              <Link
                href={p.href}
                className="mt-auto flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                {p.cta}
                <ChevronRight className="size-3" />
              </Link>
            </div>
          );
        })}
      </div>

      <button
        onClick={dispensar}
        className="mt-3 text-xs text-indigo-600/60 hover:text-indigo-600 dark:text-indigo-400/60 dark:hover:text-indigo-400"
      >
        Não mostrar novamente
      </button>
    </div>
  );
}
