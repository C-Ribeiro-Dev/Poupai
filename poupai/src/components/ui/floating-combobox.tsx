"use client"

import * as React from "react"
import { ChevronDownIcon, ChevronUpIcon, CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ComboboxOption {
  value: string
  label: string
}

interface FloatingComboboxProps {
  label: string
  options: ComboboxOption[]
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  error?: string
  className?: string
  id?: string
  name?: string
}

function FloatingCombobox({
  label,
  options,
  value = "",
  onChange,
  disabled,
  error,
  className,
  id,
  name,
}: FloatingComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const generatedId = React.useId()
  const inputId = id ?? generatedId

  const selectedLabel = options.find((o) => o.value === value)?.label ?? ""
  const hasValue = !!selectedLabel

  const filtered = React.useMemo(
    () =>
      query.trim()
        ? options.filter((o) =>
            o.label.toLowerCase().includes(query.toLowerCase())
          )
        : options,
    [options, query]
  )

  function handleFocus() {
    setQuery("")
    setOpen(true)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    if (!open) setOpen(true)
  }

  function handleSelect(option: ComboboxOption) {
    onChange?.(option.value)
    setOpen(false)
    setQuery("")
    inputRef.current?.blur()
  }

  function handleBlur(e: React.FocusEvent) {
    if (containerRef.current?.contains(e.relatedTarget as Node)) return
    setOpen(false)
    setQuery("")
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false)
      setQuery("")
      inputRef.current?.blur()
    }
    if (e.key === "Enter" && filtered.length > 0) {
      e.preventDefault()
      handleSelect(filtered[0])
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      const first = listRef.current?.querySelector<HTMLButtonElement>("button")
      first?.focus()
    }
  }

  function handleListKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, option: ComboboxOption) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleSelect(option)
    }
    if (e.key === "Escape") {
      setOpen(false)
      setQuery("")
      inputRef.current?.focus()
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      const next = (e.currentTarget.nextElementSibling as HTMLButtonElement | null)
      next?.focus()
    }
    if (e.key === "ArrowUp") {
      e.preventDefault()
      const prev = (e.currentTarget.previousElementSibling as HTMLButtonElement | null)
      if (prev) prev.focus()
      else inputRef.current?.focus()
    }
  }

  const inputDisplay = open ? query : selectedLabel

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      onBlur={handleBlur}
    >
      {/* Hidden input for form compatibility */}
      {name && (
        <input type="hidden" name={name} value={value} />
      )}

      {/* Trigger input */}
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          value={inputDisplay}
          onChange={handleChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoComplete="off"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-invalid={!!error}
          role="combobox"
          className={cn(
            "peer h-14 w-full rounded-xl border bg-white/[0.05] px-4 pb-2.5 pr-10 pt-5 text-sm text-foreground transition-all duration-200 outline-none",
            "placeholder:opacity-0",
            open
              ? "border-ring ring-4 ring-ring/20 shadow-[0_0_16px_-2px_oklch(0.55_0.22_264/0.25)] bg-white/[0.06]"
              : "border-white/10 hover:border-white/20 hover:bg-white/[0.07]",
            disabled && "cursor-not-allowed opacity-40",
            error && !open && "border-destructive/70 ring-4 ring-destructive/20 shadow-[0_0_16px_-2px_oklch(0.577_0.245_27/0.25)]"
          )}
        />

        {/* Floating label */}
        <label
          htmlFor={inputId}
          className={cn(
            "pointer-events-none absolute left-4 select-none transition-all duration-200",
            hasValue || open
              ? "top-2.5 text-[0.7rem] font-medium text-ring"
              : "top-1/2 -translate-y-1/2 text-sm font-semibold text-foreground/70"
          )}
        >
          {label}
        </label>

        {/* Chevron */}
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-transform duration-200">
          {open
            ? <ChevronUpIcon className="size-4" />
            : <ChevronDownIcon className="size-4" />}
        </span>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          ref={listRef}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-popover shadow-xl ring-1 ring-ring/10"
        >
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              Nenhum resultado para &quot;{query}&quot;
            </div>
          ) : (
            filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                tabIndex={0}
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSelect(option)
                }}
                onKeyDown={(e) => handleListKeyDown(e, option)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors duration-100",
                  "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
                  option.value === value
                    ? "bg-primary/8 text-primary font-medium"
                    : "text-foreground"
                )}
              >
                <span className="flex-1">{option.label}</span>
                {option.value === value && (
                  <CheckIcon className="size-3.5 shrink-0 text-primary" />
                )}
              </button>
            ))
          )}
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}

export { FloatingCombobox }
