import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-xl border border-border/60 bg-foreground/[0.03] px-3.5 py-2 text-sm transition-all duration-200 outline-none",
        "placeholder:text-muted-foreground/50",
        "hover:border-ring/50 hover:bg-foreground/[0.05]",
        "focus-visible:border-ring focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-ring/15 focus-visible:shadow-[0_0_0_1px_hsl(var(--ring)/0.3)]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
        "aria-invalid:border-destructive/70 aria-invalid:ring-4 aria-invalid:ring-destructive/15",
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "dark:border-white/10 dark:bg-white/[0.06] dark:placeholder:text-white/30",
        "dark:hover:border-white/20 dark:hover:bg-white/[0.08]",
        "dark:focus-visible:border-ring dark:focus-visible:bg-white/[0.07] dark:focus-visible:ring-ring/20",
        "dark:aria-invalid:border-destructive/60 dark:aria-invalid:ring-destructive/20",
        "md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
