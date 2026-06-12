"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  FileSpreadsheet,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  CheckCircle2,
  CopyX,
  Landmark,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { TipoMovimentacaoRow } from "@/types/tipos";
import type { CategoriaRow } from "@/types/categorias";
import type { ContaRow } from "@/types/contas";
import type { CartaoRow } from "@/types/cartoes";
import { parseNubankCsv, type LinhaExtrato } from "@/lib/nubank-csv";
import { parseNubankCartaoCsv, type LinhaCartao } from "@/lib/nubank-cartao-csv";
import { importarExtratoAction, importarFaturaCartaoAction } from "@/actions/importacao";

// ─── Tipos internos ───────────────────────────────────────────────────────────

type Modo = "conta" | "cartao";

interface LinhaContaPreview extends LinhaExtrato {
  selecionada: boolean;
  jaImportada: boolean;
  categoria: string;
  tipoId: number;
}

interface LinhaCartaoPreview extends LinhaCartao {
  selecionada: boolean;
  jaImportada: boolean;
  categoria: string;
  tipoId: number;
}

interface ImportarClientProps {
  tipos: TipoMovimentacaoRow[];
  categorias: CategoriaRow[];
  contas: ContaRow[];
  cartoes: CartaoRow[];
  sugestoes: Record<string, string>;
  idsImportados: string[];
  idsComprasImportadas: string[];
  initialCartaoId?: number;
}

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

// ─── Componente principal ─────────────────────────────────────────────────────

export function ImportarClient({
  tipos,
  categorias,
  contas,
  cartoes,
  sugestoes,
  idsImportados,
  idsComprasImportadas,
  initialCartaoId,
}: ImportarClientProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [modo, setModo] = useState<Modo>(initialCartaoId ? "cartao" : "conta");
  const [linhasConta, setLinhasConta] = useState<LinhaContaPreview[]>([]);
  const [linhasCartao, setLinhasCartao] = useState<LinhaCartaoPreview[]>([]);
  const [nomeArquivo, setNomeArquivo] = useState("");

  const [tipoEntradaId, setTipoEntradaId] = useState(0);
  const [tipoSaidaId, setTipoSaidaId] = useState(0);
  const [contaId, setContaId] = useState(0);
  const [cartaoId, setCartaoId] = useState(initialCartaoId ?? 0);

  const [isPending, startTransition] = useTransition();

  const tiposEntrada = tipos.filter((t) => t.isEntrada);
  const tiposSaida = tipos.filter((t) => !t.isEntrada);
  const idsSet = new Set(idsImportados);
  const idsComprasSet = new Set(idsComprasImportadas);

  const linhasAtivas = modo === "conta" ? linhasConta : linhasCartao;
  const temArquivo = linhasAtivas.length > 0;

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleModo(novoModo: Modo) {
    setModo(novoModo);
    setLinhasConta([]);
    setLinhasCartao([]);
    setNomeArquivo("");
  }

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const texto = String(reader.result);
        if (modo === "conta") {
          const parsed = parseNubankCsv(texto);
          setLinhasConta(
            parsed.map((l) => ({
              ...l,
              jaImportada: idsSet.has(l.idExterno),
              selecionada: !idsSet.has(l.idExterno),
              categoria: sugestoes[l.descricao.trim().toLowerCase()] ?? "",
              tipoId: l.isEntrada ? tipoEntradaId : tipoSaidaId,
            }))
          );
        } else {
          const parsed = parseNubankCartaoCsv(texto);
          setLinhasCartao(
            parsed.map((l) => ({
              ...l,
              jaImportada: idsComprasSet.has(l.idExterno),
              selecionada: !idsComprasSet.has(l.idExterno),
              categoria: (l.categoria || sugestoes[l.descricao.trim().toLowerCase()]) ?? "",
              tipoId: l.isEntrada ? tipoEntradaId : tipoSaidaId,
            }))
          );
        }
        setNomeArquivo(file.name);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao ler o arquivo.");
      }
    };
    reader.readAsText(file, "utf-8");
  }

  function resetArquivo() {
    setLinhasConta([]);
    setLinhasCartao([]);
    setNomeArquivo("");
  }

  function handleSetTipoEntrada(v: number) {
    setTipoEntradaId(v);
    setLinhasConta((p) => p.map((l) => l.isEntrada ? { ...l, tipoId: v } : l));
    setLinhasCartao((p) => p.map((l) => l.isEntrada ? { ...l, tipoId: v } : l));
  }

  function handleSetTipoSaida(v: number) {
    setTipoSaidaId(v);
    setLinhasConta((p) => p.map((l) => !l.isEntrada ? { ...l, tipoId: v } : l));
    setLinhasCartao((p) => p.map((l) => !l.isEntrada ? { ...l, tipoId: v } : l));
  }

  function handleImportar() {
    if (modo === "conta") {
      importarConta();
    } else {
      importarCartao();
    }
  }

  function importarConta() {
    const selecionadas = linhasConta.filter((l) => l.selecionada && !l.jaImportada);
    if (!selecionadas.length) { toast.error("Nenhuma transação nova selecionada."); return; }
    const semTipo = selecionadas.filter((l) => !l.tipoId);
    if (semTipo.length) { toast.error(`${semTipo.length} transação(ões) sem tipo definido.`); return; }

    startTransition(async () => {
      const result = await importarExtratoAction({
        contaId: contaId || undefined,
        itens: selecionadas.map((l) => ({
          data: l.data,
          valor: l.valor,
          isEntrada: l.isEntrada,
          descricao: l.descricao,
          categoria: l.categoria || undefined,
          idExterno: l.idExterno,
          tipoId: l.tipoId,
        })),
      });
      if (result.success) {
        toast.success(`${result.importadas} transações importadas.`,
          result.duplicadas > 0 ? { description: `${result.duplicadas} duplicadas ignoradas.` } : undefined
        );
        router.push("/movimentacoes");
      } else {
        toast.error(result.error);
      }
    });
  }

  function importarCartao() {
    const selecionadas = linhasCartao.filter((l) => l.selecionada && !l.jaImportada);
    if (!selecionadas.length) { toast.error("Nenhuma transação nova selecionada."); return; }
    if (!cartaoId) { toast.error("Selecione o cartão antes de importar."); return; }

    startTransition(async () => {
      const result = await importarFaturaCartaoAction(
        cartaoId,
        selecionadas.map((l) => ({
          data: l.data,
          valor: l.valor,
          descricao: l.parcela && l.totalParcelas
            ? `${l.descricao} (${l.parcela}/${l.totalParcelas})`
            : l.descricao,
          categoria: l.categoria || undefined,
          idExterno: l.idExterno,
        }))
      );
      if (result.success) {
        toast.success(`${result.importadas} compras importadas.`,
          result.duplicadas > 0 ? { description: `${result.duplicadas} duplicadas ignoradas.` } : undefined
        );
        router.push("/cartoes");
      } else {
        toast.error(result.error);
      }
    });
  }

  // ── Totais ────────────────────────────────────────────────────────────────

  const selecionadas = linhasAtivas.filter((l) => l.selecionada && !l.jaImportada);
  const totalEntradas = selecionadas.filter((l) => l.isEntrada).reduce((a, l) => a + l.valor, 0);
  const totalSaidas = selecionadas.filter((l) => !l.isEntrada).reduce((a, l) => a + l.valor, 0);
  const duplicadasCount = linhasAtivas.filter((l) => l.jaImportada).length;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/movimentacoes"
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Voltar"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Importar do Nubank</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Extrato da conta ou fatura do cartão
          </p>
        </div>
      </div>

      {/* Toggle de modo */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleModo("conta")}
          className={cn(
            "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
            modo === "conta"
              ? "border-primary bg-primary/5 text-foreground"
              : "border-border bg-card text-muted-foreground hover:border-border/80 hover:bg-muted/40"
          )}
        >
          <Landmark className="size-4" />
          Extrato da conta
        </button>
        <button
          type="button"
          onClick={() => handleModo("cartao")}
          className={cn(
            "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
            modo === "cartao"
              ? "border-primary bg-primary/5 text-foreground"
              : "border-border bg-card text-muted-foreground hover:border-border/80 hover:bg-muted/40"
          )}
        >
          <CreditCard className="size-4" />
          Fatura do cartão
        </button>
      </div>

      {/* Instrução contextual */}
      <p className="text-xs text-muted-foreground -mt-3">
        {modo === "conta"
          ? "Nubank app → Extrato → ícone de compartilhar → Exportar extrato (CSV)"
          : "Nubank app → Cartão → Fatura → ícone de compartilhar → Exportar (CSV)"}
      </p>

      {!temArquivo ? (
        /* Upload */
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border py-20 text-center transition-colors hover:border-foreground/30 hover:bg-muted/30"
        >
          <div className={cn(
            "flex size-14 items-center justify-center rounded-full",
            modo === "conta" ? "bg-violet-500/10" : "bg-blue-500/10"
          )}>
            <FileSpreadsheet className={cn("size-7", modo === "conta" ? "text-violet-500" : "text-blue-500")} />
          </div>
          <div>
            <p className="font-medium">Arraste o arquivo CSV aqui</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {modo === "conta" ? "Extrato da conta Nubank" : "Transações do cartão Nubank"}
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </button>
      ) : (
        <>
          {/* Resumo do arquivo */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs">
              <FileSpreadsheet className="size-3.5 text-violet-500" />
              <span className="font-medium">{nomeArquivo}</span>
              <span className="text-muted-foreground">· {linhasAtivas.length} transações</span>
            </span>
            {duplicadasCount > 0 && (
              <span className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-500/5 px-3 py-2 text-xs text-amber-600 dark:border-amber-800/60 dark:text-amber-400">
                <CopyX className="size-3.5" />
                {duplicadasCount} já importadas (ignoradas)
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={resetArquivo} disabled={isPending}>
              Trocar arquivo
            </Button>
          </div>

          {/* Configuração */}
          {modo === "conta" ? (
            <ConfigConta
              tiposEntrada={tiposEntrada}
              tiposSaida={tiposSaida}
              contas={contas}
              tipoEntradaId={tipoEntradaId}
              tipoSaidaId={tipoSaidaId}
              contaId={contaId}
              onTipoEntrada={handleSetTipoEntrada}
              onTipoSaida={handleSetTipoSaida}
              onConta={setContaId}
              disabled={isPending}
            />
          ) : (
            <ConfigCartao
              cartoes={cartoes}
              cartaoId={cartaoId}
              onCartao={setCartaoId}
              disabled={isPending}
            />
          )}

          {/* Tabela preview */}
          <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
            <div className="max-h-[50vh] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                  <tr className="text-xs text-muted-foreground">
                    <th className="w-10 px-3 py-2.5">
                      <input
                        type="checkbox"
                        aria-label="Selecionar todas"
                        checked={
                          linhasAtivas.filter((l) => !l.jaImportada).length > 0 &&
                          linhasAtivas.filter((l) => !l.jaImportada).every((l) => l.selecionada)
                        }
                        onChange={(e) => {
                          if (modo === "conta") {
                            setLinhasConta((p) => p.map((l) => l.jaImportada ? l : { ...l, selecionada: e.target.checked }));
                          } else {
                            setLinhasCartao((p) => p.map((l) => l.jaImportada ? l : { ...l, selecionada: e.target.checked }));
                          }
                        }}
                      />
                    </th>
                    <th className="px-3 py-2.5 text-left font-medium">Data</th>
                    <th className="px-3 py-2.5 text-left font-medium">Descrição</th>
                    {modo === "cartao" && (
                      <th className="px-3 py-2.5 text-center font-medium">Parcela</th>
                    )}
                    <th className="px-3 py-2.5 text-left font-medium">Tipo</th>
                    <th className="px-3 py-2.5 text-left font-medium">Categoria</th>
                    <th className="px-3 py-2.5 text-right font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {modo === "conta"
                    ? linhasConta.map((l, idx) => (
                        <LinhaContaRow
                          key={l.idExterno}
                          linha={l}
                          tipos={tipos}
                          categorias={categorias}
                          isPending={isPending}
                          onChange={(patch) =>
                            setLinhasConta((p) => p.map((x, i) => i === idx ? { ...x, ...patch } : x))
                          }
                        />
                      ))
                    : linhasCartao.map((l, idx) => (
                        <LinhaCartaoRow
                          key={l.idExterno}
                          linha={l}
                          tipos={tipos}
                          categorias={categorias}
                          isPending={isPending}
                          onChange={(patch) =>
                            setLinhasCartao((p) => p.map((x, i) => i === idx ? { ...x, ...patch } : x))
                          }
                        />
                      ))
                  }
                </tbody>
              </table>
            </div>
          </div>

          {/* Rodapé */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{selecionadas.length}</span> selecionadas
              {totalEntradas > 0 && (
                <> · <span className="tabular-nums text-emerald-600 dark:text-emerald-400">+{formatCurrency(totalEntradas)}</span></>
              )}
              {totalSaidas > 0 && (
                <> · <span className="tabular-nums text-red-600 dark:text-red-400">−{formatCurrency(totalSaidas)}</span></>
              )}
            </p>
            <Button onClick={handleImportar} disabled={isPending || selecionadas.length === 0}>
              {isPending ? (
                <><Loader2 className="size-4 animate-spin" />Importando...</>
              ) : (
                <><Upload className="size-4" />Importar {selecionadas.length} transações</>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Config da conta ──────────────────────────────────────────────────────────

function ConfigConta({
  tiposEntrada, tiposSaida, contas,
  tipoEntradaId, tipoSaidaId, contaId,
  onTipoEntrada, onTipoSaida, onConta, disabled,
}: {
  tiposEntrada: TipoMovimentacaoRow[];
  tiposSaida: TipoMovimentacaoRow[];
  contas: ContaRow[];
  tipoEntradaId: number;
  tipoSaidaId: number;
  contaId: number;
  onTipoEntrada: (v: number) => void;
  onTipoSaida: (v: number) => void;
  onConta: (v: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tipoEntrada">Tipo padrão para entradas</Label>
        <select id="tipoEntrada" value={tipoEntradaId || ""} onChange={(e) => onTipoEntrada(Number(e.target.value) || 0)} disabled={disabled} className={selectClass}>
          <option value="">Selecione...</option>
          {tiposEntrada.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tipoSaida">Tipo padrão para saídas</Label>
        <select id="tipoSaida" value={tipoSaidaId || ""} onChange={(e) => onTipoSaida(Number(e.target.value) || 0)} disabled={disabled} className={selectClass}>
          <option value="">Selecione...</option>
          {tiposSaida.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="conta">Conta <span className="text-xs font-normal text-muted-foreground">(opcional)</span></Label>
        <select id="conta" value={contaId || ""} onChange={(e) => onConta(Number(e.target.value) || 0)} disabled={disabled} className={selectClass}>
          <option value="">Sem conta</option>
          {contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>
    </div>
  );
}

// ─── Config do cartão ─────────────────────────────────────────────────────────

function ConfigCartao({
  cartoes, cartaoId, onCartao, disabled,
}: {
  cartoes: CartaoRow[];
  cartaoId: number;
  onCartao: (v: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-end">
      <div className="flex flex-col gap-1.5 sm:w-72">
        <Label htmlFor="cartao">Cartão *</Label>
        <select id="cartao" value={cartaoId || ""} onChange={(e) => onCartao(Number(e.target.value) || 0)} disabled={disabled} className={selectClass}>
          <option value="">Selecione o cartão...</option>
          {cartoes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>
      <p className="text-xs text-muted-foreground">
        As compras serão vinculadas ao cartão e distribuídas nas faturas conforme a data de cada transação.
      </p>
    </div>
  );
}

// ─── Linha da tabela — conta ──────────────────────────────────────────────────

function LinhaContaRow({
  linha: l, tipos, categorias, isPending, onChange,
}: {
  linha: LinhaContaPreview;
  tipos: TipoMovimentacaoRow[];
  categorias: CategoriaRow[];
  isPending: boolean;
  onChange: (patch: Partial<LinhaContaPreview>) => void;
}) {
  return (
    <tr className={cn(
      "transition-colors",
      l.jaImportada ? "opacity-45" : !l.selecionada ? "opacity-60" : "hover:bg-muted/30"
    )}>
      <td className="px-3 py-2">
        {l.jaImportada
          ? <CheckCircle2 className="size-4 text-emerald-500" />
          : <input type="checkbox" checked={l.selecionada} onChange={(e) => onChange({ selecionada: e.target.checked })} />
        }
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{formatDate(l.data + "T12:00:00")}</td>
      <td className="max-w-[280px] truncate px-3 py-2" title={l.descricao}>
        <span className="mr-1.5 inline-block align-middle">
          {l.isEntrada
            ? <ArrowUpRight className="size-3.5 text-emerald-500" />
            : <ArrowDownRight className="size-3.5 text-red-500" />
          }
        </span>
        {l.descricao}
      </td>
      <td className="px-3 py-2">
        <TipoSelect linha={l} tipos={tipos} disabled={isPending} onChange={onChange} />
      </td>
      <td className="px-3 py-2">
        <CategoriaSelect linha={l} categorias={categorias} disabled={isPending} onChange={onChange} />
      </td>
      <td className={cn("whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums",
        l.isEntrada ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
      )}>
        {l.isEntrada ? "+" : "−"}{formatCurrency(l.valor)}
      </td>
    </tr>
  );
}

// ─── Linha da tabela — cartão ─────────────────────────────────────────────────

function LinhaCartaoRow({
  linha: l, tipos, categorias, isPending, onChange,
}: {
  linha: LinhaCartaoPreview;
  tipos: TipoMovimentacaoRow[];
  categorias: CategoriaRow[];
  isPending: boolean;
  onChange: (patch: Partial<LinhaCartaoPreview>) => void;
}) {
  return (
    <tr className={cn(
      "transition-colors",
      l.jaImportada ? "opacity-45" : !l.selecionada ? "opacity-60" : "hover:bg-muted/30"
    )}>
      <td className="px-3 py-2">
        {l.jaImportada
          ? <CheckCircle2 className="size-4 text-emerald-500" />
          : <input type="checkbox" checked={l.selecionada} onChange={(e) => onChange({ selecionada: e.target.checked })} />
        }
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{formatDate(l.data + "T12:00:00")}</td>
      <td className="max-w-[240px] truncate px-3 py-2" title={l.descricao}>
        <span className="mr-1.5 inline-block align-middle">
          {l.isEntrada
            ? <ArrowUpRight className="size-3.5 text-emerald-500" />
            : <ArrowDownRight className="size-3.5 text-red-500" />
          }
        </span>
        {l.descricao}
      </td>
      <td className="px-3 py-2 text-center">
        {l.parcela && l.totalParcelas ? (
          <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:text-blue-400">
            {l.parcela}/{l.totalParcelas}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">à vista</span>
        )}
      </td>
      <td className="px-3 py-2">
        <TipoSelect linha={l} tipos={tipos} disabled={isPending} onChange={onChange} />
      </td>
      <td className="px-3 py-2">
        <CategoriaSelect linha={l} categorias={categorias} disabled={isPending} onChange={onChange} />
      </td>
      <td className={cn("whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums",
        l.isEntrada ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
      )}>
        {l.isEntrada ? "+" : "−"}{formatCurrency(l.valor)}
      </td>
    </tr>
  );
}

// ─── Select de tipo (por linha) ───────────────────────────────────────────────

function TipoSelect({
  linha, tipos, disabled, onChange,
}: {
  linha: { jaImportada: boolean; isEntrada: boolean; tipoId: number };
  tipos: TipoMovimentacaoRow[];
  disabled: boolean;
  onChange: (patch: { tipoId: number }) => void;
}) {
  const tiposFiltrados = tipos.filter((t) => t.isEntrada === linha.isEntrada);
  return (
    <select
      value={linha.tipoId || ""}
      disabled={linha.jaImportada || disabled}
      onChange={(e) => onChange({ tipoId: Number(e.target.value) || 0 })}
      className="h-7 w-36 rounded-md border border-input bg-transparent px-1.5 text-xs text-muted-foreground outline-none focus:border-ring dark:bg-input/30"
    >
      <option value="">Sem tipo</option>
      {tiposFiltrados.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
    </select>
  );
}

// ─── Select de categoria (compartilhado) ──────────────────────────────────────

function CategoriaSelect({
  linha, categorias, disabled, onChange,
}: {
  linha: { jaImportada: boolean; isEntrada: boolean; categoria: string };
  categorias: CategoriaRow[];
  disabled: boolean;
  onChange: (patch: { categoria: string }) => void;
}) {
  return (
    <select
      value={linha.categoria}
      disabled={linha.jaImportada || disabled}
      onChange={(e) => onChange({ categoria: e.target.value })}
      className="h-7 w-36 rounded-md border border-input bg-transparent px-1.5 text-xs text-muted-foreground outline-none focus:border-ring dark:bg-input/30"
    >
      <option value="">Sem categoria</option>
      {categorias
        .filter((c) => c.ativo && (c.tipo === "ambos" || (linha.isEntrada ? c.tipo === "entrada" : c.tipo === "saida")))
        .map((c) => <option key={c.id} value={c.nome}>{c.nome}</option>)
      }
    </select>
  );
}
