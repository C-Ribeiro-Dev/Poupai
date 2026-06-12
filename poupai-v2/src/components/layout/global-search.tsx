"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Loader2,
  ArrowUpDown,
  CalendarCheck,
  Shapes,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { globalSearchAction } from "@/actions/search";
import type { GlobalSearchResults, SearchHit } from "@/services/search";

const EMPTY: GlobalSearchResults = {
  movimentacoes: [],
  fixas: [],
  categorias: [],
  tipos: [],
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

interface GroupConfig {
  key: keyof GlobalSearchResults;
  label: string;
  icon: React.ElementType;
  href: string;
}

const groups: GroupConfig[] = [
  { key: "movimentacoes", label: "Movimentações", icon: ArrowUpDown, href: "/movimentacoes" },
  { key: "fixas", label: "Movimentações fixas", icon: CalendarCheck, href: "/movimentacoes-fixas" },
  { key: "categorias", label: "Categorias", icon: Shapes, href: "/categorias" },
  { key: "tipos", label: "Tipos", icon: Tag, href: "/tipos" },
];

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResults>(EMPTY);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Atalho Ctrl+K / Cmd+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Busca com debounce
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const term = query.trim();
    if (term.length < 2) {
      setResults(EMPTY);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const res = await globalSearchAction(term);
        setResults(res);
      });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open]);

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      setQuery("");
      setResults(EMPTY);
    }
  }

  function navigate(href: string) {
    const term = query.trim();
    handleOpenChange(false);
    router.push(term ? `${href}?q=${encodeURIComponent(term)}` : href);
  }

  const hasQuery = query.trim().length >= 2;
  const totalHits =
    results.movimentacoes.length +
    results.fixas.length +
    results.categorias.length +
    results.tipos.length;

  return (
    <>
      {/* Trigger no header */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Busca global (Ctrl+K)"
        className={cn(
          "flex h-8 items-center gap-2 rounded-lg border border-input bg-background px-2.5 text-sm text-muted-foreground transition-colors",
          "hover:bg-muted hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        <Search className="size-4" />
        <span className="hidden lg:inline">Buscar...</span>
        <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium lg:inline">
          Ctrl K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="top-[15%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-lg"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Busca global</DialogTitle>

          {/* Input */}
          <div className="flex items-center gap-2 border-b border-border px-3.5 py-3">
            {isPending ? (
              <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
            ) : (
              <Search className="size-4 shrink-0 text-muted-foreground" />
            )}
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar movimentações, fixas, categorias, tipos..."
              aria-label="Buscar"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
              Esc
            </kbd>
          </div>

          {/* Resultados */}
          <div className="max-h-[55vh] overflow-y-auto overscroll-contain">
            {!hasQuery ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Digite ao menos 2 caracteres para buscar.
              </p>
            ) : totalHits === 0 && !isPending ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Nenhum resultado para{" "}
                <span className="font-medium text-foreground">“{query.trim()}”</span>.
              </p>
            ) : (
              <div className="flex flex-col py-1.5">
                {groups.map((g) => {
                  const hits = results[g.key];
                  if (hits.length === 0) return null;
                  return (
                    <div key={g.key}>
                      <p className="px-3.5 pb-1 pt-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        {g.label}
                      </p>
                      {hits.map((hit) => (
                        <SearchHitRow
                          key={`${g.key}-${hit.id}`}
                          hit={hit}
                          icon={g.icon}
                          onSelect={() => navigate(g.href)}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SearchHitRow({
  hit,
  icon: Icon,
  onSelect,
}: {
  hit: SearchHit;
  icon: React.ElementType;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 px-3.5 py-2 text-left transition-colors",
        "hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
      )}
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="size-3.5 text-muted-foreground" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{hit.titulo}</span>
        {hit.subtitulo && (
          <span className="block truncate text-xs text-muted-foreground">
            {hit.subtitulo}
          </span>
        )}
      </span>
      {hit.valor !== null && (
        <span
          className={cn(
            "shrink-0 text-xs font-semibold tabular-nums",
            hit.isEntrada
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-foreground"
          )}
        >
          {formatCurrency(hit.valor)}
        </span>
      )}
      {hit.valor === null && hit.isEntrada !== null && (
        <span className="shrink-0">
          {hit.isEntrada ? (
            <ArrowUpRight className="size-3.5 text-emerald-500" />
          ) : (
            <ArrowDownRight className="size-3.5 text-red-500" />
          )}
        </span>
      )}
    </button>
  );
}
