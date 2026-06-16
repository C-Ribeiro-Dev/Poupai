"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface FloatingInputProps extends React.ComponentProps<"input"> {
  label: string
  error?: string
}

function FloatingInput({
  label,
  error,
  className,
  id,
  disabled,
  ...props
}: FloatingInputProps) {
  const generatedId = React.useId()
  const inputId = id ?? generatedId

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        <input
          id={inputId}
          disabled={disabled}
          placeholder=" "
          data-slot="input"
          className={cn(
            "peer h-14 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 pb-2.5 pt-5 text-sm text-foreground transition-all duration-200 outline-none",
            "placeholder:opacity-0",
            "hover:border-white/20 hover:bg-white/[0.07]",
            "focus:border-ring focus:bg-white/[0.06] focus:ring-4 focus:ring-ring/20 focus:shadow-[0_0_16px_-2px_oklch(0.55_0.22_264/0.25)]",
            "disabled:cursor-not-allowed disabled:opacity-40",
            "aria-invalid:border-destructive/70 aria-invalid:ring-4 aria-invalid:ring-destructive/20 aria-invalid:shadow-[0_0_16px_-2px_oklch(0.577_0.245_27/0.25)]",
            className
          )}
          {...props}
        />

        <label
          htmlFor={inputId}
          className={cn(
            "pointer-events-none absolute left-4 select-none transition-all duration-200",
            // Valor preenchido ou focado → label no topo
            "top-2.5 text-[0.7rem] font-medium text-ring",
            // Vazio e sem foco → label centralizado
            "peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-semibold peer-placeholder-shown:text-foreground/70",
            // Foco → volta ao topo com cor da marca
            "peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-[0.7rem] peer-focus:font-medium peer-focus:text-ring",
            // Disabled
            disabled && "opacity-40"
          )}
        >
          {label}
        </label>
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}

export { FloatingInput }
