import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-xl border border-border/60 bg-foreground/[0.03] px-3.5 py-2.5 text-sm transition-all duration-200 outline-none resize-none",
        "placeholder:text-muted-foreground/50",
        "hover:border-ring/50 hover:bg-foreground/[0.05]",
        "focus-visible:border-ring focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-ring/15",
        "disabled:cursor-not-allowed disabled:opacity-40",
        "aria-invalid:border-destructive/70 aria-invalid:ring-4 aria-invalid:ring-destructive/15",
        "dark:border-white/10 dark:bg-white/[0.06] dark:placeholder:text-white/30",
        "dark:hover:border-white/20 dark:hover:bg-white/[0.08]",
        "dark:focus-visible:border-ring dark:focus-visible:bg-white/[0.07] dark:focus-visible:ring-ring/20",
        "dark:aria-invalid:border-destructive/60 dark:aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
