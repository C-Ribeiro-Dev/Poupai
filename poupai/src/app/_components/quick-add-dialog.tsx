"use client";
import { useState, useEffect, useMemo, useTransition } from "react";
import { Plus, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { FloatingCombobox } from "@/components/ui/floating-combobox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/format";
import { getQuickAddOptionsAction, type QuickAddOptions, type OrcamentoQuick } from "@/actions/quick-add";
import { createMovimentacaoAction } from "@/actions/movimentacoes";
import { CompraFormDialog } from "@/app/(dashboard)/cartoes/_components/compra-form-dialog";
import type { CartaoRow } from "@/types/cartoes";
import type { CategoriaRow } from "@/types/categorias";

const today = () => new Date().toISOString().split("T")[0];

type CartaoQuick = QuickAddOptions["cartoes"][number];

export function QuickAddDialog() {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<QuickAddOptions | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Quick-add state
  const [direcao, setDirecao] = useState<"saida" | "entrada">("saida");
  const [tipoId, setTipoId] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [contaId, setContaId] = useState("");
  const [data, setData] = useState(today());

  // Card purchase state
  const [openCardPicker, setOpenCardPicker] = useState(false);
  const [openCompra, setOpenCompra] = useState(false);
  const [selectedCartao, setSelectedCartao] = useState<CartaoQuick | null>(null);

  // Busca opções ao abrir o quick-add dialog pela primeira vez
  useEffect(() => {
    if (!open || options) return;
    setLoadingOptions(true);
    getQuickAddOptionsAction()
      .then((o) => {
        setOptions(o);
        const primeiroDirecao = o.tipos.find((t) => t.isEntrada === (direcao === "entrada"));
        if (primeiroDirecao) setTipoId(String(primeiroDirecao.id));
        const contaPadrao =
          o.contas.find((c) => c.tipo === "corrente" || c.tipo === "carteira") ?? o.contas[0];
        if (contaPadrao) setContaId(String(contaPadrao.id));
      })
      .finally(() => setLoadingOptions(false));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ao mudar direção, ajusta tipo para o primeiro compatível
  useEffect(() => {
    if (!options) return;
    const primeiro = options.tipos.find((t) => t.isEntrada === (direcao === "entrada"));
    setTipoId(primeiro ? String(primeiro.id) : "");
  }, [direcao, options]);

  function resetForm() {
    setDirecao("saida");
    setTipoId("");
    setValor("");
    setCategoria("");
    setData(today());
  }

  function handleOpenChange(v: boolean) {
    if (!v) resetForm();
    setOpen(v);
  }

  async function handleCardFabClick() {
    if (options) {
      openCardOrPicker(options);
      return;
    }
    setLoadingOptions(true);
    try {
      const o = await getQuickAddOptionsAction();
      setOptions(o);
      openCardOrPicker(o);
    } catch {
      toast.error("Erro ao carregar cartões.");
    } finally {
      setLoadingOptions(false);
    }
  }

  function openCardOrPicker(o: QuickAddOptions) {
    if (o.cartoes.length === 0) {
      toast.error("Nenhum cartão cadastrado.");
      return;
    }
    if (o.cartoes.length === 1) {
      setSelectedCartao(o.cartoes[0]);
      setOpenCompra(true);
    } else {
      setOpenCardPicker(true);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const valorNum = parseFloat(valor.replace(",", "."));
    if (!tipoId || isNaN(valorNum) || valorNum <= 0) {
      toast.error("Preencha tipo e valor corretamente.");
      return;
    }

    startTransition(async () => {
      const result = await createMovimentacaoAction({
        tipoId: parseInt(tipoId, 10),
        valor: valorNum,
        data,
        categoria: categoria || undefined,
        contaId: contaId ? parseInt(contaId, 10) : undefined,
      });

      if (result.success) {
        toast.success(direcao === "saida" ? "Saída lançada!" : "Entrada lançada!");
        setValor("");
        setCategoria("");
        setData(today());
      } else {
        toast.error(result.error ?? "Erro ao lançar movimentação.");
      }
    });
  }

  const tiposFiltrados = options?.tipos.filter((t) => t.isEntrada === (direcao === "entrada")) ?? [];
  const categsFiltradas = options?.categorias.filter(
    (c) => c.tipo === direcao || c.tipo === "ambos"
  ) ?? [];

  const orcamentoWarning = useMemo((): { orc: OrcamentoQuick; tipo: "estouro" | "alerta" } | null => {
    if (!options || !categoria || direcao !== "saida") return null;
    const valorNum = parseFloat(valor.replace(",", "."));
    if (!valorNum || valorNum <= 0) return null;
    const orc = options.orcamentos.find((o) => o.categoria === categoria);
    if (!orc || orc.limite <= 0) return null;
    const novoGasto = orc.gasto + valorNum;
    if (novoGasto > orc.limite) return { orc, tipo: "estouro" };
    if (novoGasto / orc.limite >= 0.8) return { orc, tipo: "alerta" };
    return null;
  }, [options, categoria, valor, direcao]);

  const categoriasParaCompra = (options?.categorias ?? []) as unknown as CategoriaRow[];

  return (
    <>
      {/* FAB group */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-3">
        {/* Cartão FAB */}
        <button
          type="button"
          onClick={handleCardFabClick}
          disabled={loadingOptions}
          aria-label="Compra no cartão"
          className={cn(
            "flex size-12 items-center justify-center rounded-full shadow-lg",
            "bg-violet-600 text-white transition-all hover:bg-violet-700 hover:scale-105 active:scale-95",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2",
            "disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
          )}
        >
          {loadingOptions && !open ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <CreditCard className="size-5" />
          )}
        </button>

        {/* Lançamento rápido FAB */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Lançamento rápido"
          className={cn(
            "flex size-14 items-center justify-center rounded-full shadow-lg",
            "bg-indigo-600 text-white transition-all hover:bg-indigo-700 hover:scale-105 active:scale-95",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          )}
        >
          <Plus className="size-6" />
        </button>
      </div>

      {/* Quick-add dialog */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-sm" showCloseButton={!isPending}>
          <DialogHeader>
            <DialogTitle>Lançamento rápido</DialogTitle>
          </DialogHeader>

          {loadingOptions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Direção */}
              <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-input">
                <button
                  type="button"
                  onClick={() => setDirecao("saida")}
                  className={cn(
                    "py-2.5 text-sm font-semibold transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                    direcao === "saida"
                      ? "bg-red-500/15 text-red-700 dark:text-red-400"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  Saída
                </button>
                <button
                  type="button"
                  onClick={() => setDirecao("entrada")}
                  className={cn(
                    "border-l border-input py-2.5 text-sm font-semibold transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                    direcao === "entrada"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  Entrada
                </button>
              </div>

              {/* Valor */}
              <FloatingInput
                autoFocus
                label="Valor (R$)"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                disabled={isPending}
                required
              />

              {/* Tipo */}
              <FloatingCombobox
                label={tiposFiltrados.length === 0 ? "Nenhum tipo cadastrado" : "Tipo"}
                options={tiposFiltrados.map((t) => ({ value: String(t.id), label: t.nome }))}
                value={tipoId}
                onChange={setTipoId}
                disabled={isPending || tiposFiltrados.length === 0}
              />

              {/* Categoria e conta lado a lado */}
              <div className="grid grid-cols-2 gap-3">
                <FloatingCombobox
                  label="Categoria"
                  options={[
                    { value: "", label: "Sem categoria" },
                    ...categsFiltradas.map((c) => ({ value: c.nome, label: c.nome })),
                  ]}
                  value={categoria}
                  onChange={setCategoria}
                  disabled={isPending}
                />
                <FloatingCombobox
                  label="Conta"
                  options={[
                    { value: "", label: "Sem conta" },
                    ...(options?.contas ?? []).map((c) => ({ value: String(c.id), label: c.nome })),
                  ]}
                  value={contaId}
                  onChange={setContaId}
                  disabled={isPending}
                />
              </div>

              {/* Data */}
              <FloatingInput
                label="Data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                disabled={isPending}
              />

              {orcamentoWarning && (
                <div className={cn(
                  "rounded-lg px-3 py-2 text-xs",
                  orcamentoWarning.tipo === "estouro"
                    ? "bg-red-500/10 text-red-700 dark:text-red-400"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                )}>
                  {orcamentoWarning.tipo === "estouro"
                    ? `⚠ Orçamento de "${orcamentoWarning.orc.categoria}" vai estourar — gasto: ${formatCurrency(orcamentoWarning.orc.gasto + parseFloat(valor))} de ${formatCurrency(orcamentoWarning.orc.limite)}`
                    : `⚠ Orçamento de "${orcamentoWarning.orc.categoria}" chegando no limite — restam ${formatCurrency(orcamentoWarning.orc.limite - orcamentoWarning.orc.gasto)}`
                  }
                </div>
              )}

              <Button
                type="submit"
                disabled={isPending || !tipoId || !valor}
                className={cn(
                  "w-full font-semibold",
                  direcao === "saida"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                )}
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Lançando...
                  </>
                ) : (
                  `Lançar ${direcao === "saida" ? "saída" : "entrada"}`
                )}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Seletor de cartão (quando o usuário tem mais de um) */}
      <Dialog open={openCardPicker} onOpenChange={setOpenCardPicker}>
        <DialogContent className="sm:max-w-xs" showCloseButton>
          <DialogHeader>
            <DialogTitle>Qual cartão?</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {options?.cartoes.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelectedCartao(c);
                  setOpenCardPicker(false);
                  setOpenCompra(true);
                }}
                className="flex items-center gap-3 rounded-xl border border-input px-4 py-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: c.cor }}
                />
                <span className="text-sm font-medium">{c.nome}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de compra no cartão */}
      <CompraFormDialog
        open={openCompra}
        onOpenChange={setOpenCompra}
        cartao={selectedCartao as unknown as CartaoRow}
        categorias={categoriasParaCompra}
      />
    </>
  );
}
