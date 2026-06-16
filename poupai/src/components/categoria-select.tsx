"use client";
import { forwardRef } from "react";
import type { CategoriaRow } from "@/types/categorias";

interface CategoriaSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  categorias: CategoriaRow[];
  isEntrada: boolean | null;
  currentValue: string | null;
}

export const CategoriaSelect = forwardRef<HTMLSelectElement, CategoriaSelectProps>(
  ({ categorias, isEntrada, currentValue, ...props }, ref) => {
    const filtered =
      isEntrada === null
        ? categorias
        : categorias.filter(
            (c) =>
              c.ativo &&
              (c.tipo === "ambos" ||
                (isEntrada && c.tipo === "entrada") ||
                (!isEntrada && c.tipo === "saida"))
          );

    const showLegacy =
      currentValue &&
      currentValue.trim() !== "" &&
      !filtered.some((c) => c.nome === currentValue);

    return (
      <select
        ref={ref}
        className="h-10 w-full rounded-xl border border-border/60 bg-foreground/[0.03] px-3.5 py-2 text-sm transition-all duration-200 outline-none hover:border-ring/50 hover:bg-foreground/[0.05] focus-visible:border-ring focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.06] dark:hover:border-white/20 dark:hover:bg-white/[0.08] dark:focus-visible:border-ring dark:focus-visible:bg-white/[0.07]"
        {...props}
      >
        <option value="">Sem categoria</option>
        {showLegacy && <option value={currentValue!}>{currentValue}</option>}
        {filtered.map((c) => (
          <option key={c.id} value={c.nome}>
            {c.nome}
          </option>
        ))}
      </select>
    );
  }
);
CategoriaSelect.displayName = "CategoriaSelect";
