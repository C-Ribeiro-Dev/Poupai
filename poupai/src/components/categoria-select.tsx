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
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
