"use client";

import { useTransition, useState } from "react";
import {
  ShoppingCart,
  CreditCard,
  Landmark,
  Repeat2,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { simularAction } from "@/actions/simulacao";
import {
  TIPOS_SIMULACAO,
  TIPOS_COM_PARCELAS,
  TIPOS_COM_JUROS,
  TIPOS_RECORRENTES,
  type TipoSimulacao,
  type SimulacaoInput,
  type SimulacaoResultado,
} from "@/types/simulacao";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtPct = (v: number) => `${v.toFixed(0)}%`;

const TIPO_ICONE: Record<TipoSimulacao, React.ElementType> = {
  compra_avista: ShoppingCart,
  compra_parcelada: CreditCard,
  emprestimo: Landmark,
  despesa_fixa: Repeat2,
  investimento: TrendingUp,
  receita_adicional: Plus,
  reducao_renda: Minus,
  pagamento_antecipado: Wallet,
};

const TIPO_COR: Record<TipoSimulacao, string> = {
  compra_avista: "text-orange-600 bg-orange-50 border-orange-200",
  compra_parcelada: "text-purple-600 bg-purple-50 border-purple-200",
  emprestimo: "text-blue-600 bg-blue-50 border-blue-200",
  despesa_fixa: "text-sky-600 bg-sky-50 border-sky-200",
  investimento: "text-emerald-600 bg-emerald-50 border-emerald-200",
  receita_adicional: "text-green-600 bg-green-50 border-green-200",
  reducao_renda: "text-rose-600 bg-rose-50 border-rose-200",
  pagamento_antecipado: "text-teal-600 bg-teal-50 border-teal-200",
};

const RECOMENDACAO_CONFIG = {
  recomendado: {
    icon: CheckCircle2,
    cor: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-300",
    emoji: "🟢",
    label: "Recomendado",
    desc: "Sua situação financeira suporta este compromisso.",
  },
  atencao: {
    icon: AlertTriangle,
    cor: "text-amber-600",
    bg: "bg-amber-50 border-amber-300",
    emoji: "🟡",
    label: "Atenção",
    desc: "Verifique os impactos antes de decidir.",
  },
  nao_recomendado: {
    icon: XCircle,
    cor: "text-destructive",
    bg: "bg-destructive/10 border-destructive/40",
    emoji: "🔴",
    label: "Não recomendado",
    desc: "Esta operação pode comprometer sua saúde financeira.",
  },
};

function MetricaComparativa({
  label,
  atual,
  simulado,
  formato = "currency",
}: {
  label: string;
  atual: number;
  simulado: number;
  formato?: "currency" | "percent";
}) {
  const delta = simulado - atual;
  const positivo = delta >= 0;
  const neutro = Math.abs(delta) < 0.01;

  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="mb-3 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] text-muted-foreground">Atual</p>
          <p className="text-base font-bold">
            {formato === "currency" ? fmt(atual) : fmtPct(atual)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Simulado</p>
          <p
            className={cn(
              "text-base font-bold",
              simulado < 0 ? "text-destructive" : ""
            )}
          >
            {formato === "currency" ? fmt(simulado) : fmtPct(simulado)}
          </p>
        </div>
      </div>
      {!neutro && (
        <div
          className={cn(
            "mt-2 flex items-center gap-1 text-xs font-medium",
            positivo ? "text-emerald-600" : "text-rose-600"
          )}
        >
          {positivo ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {positivo ? "+" : ""}
          {formato === "currency" ? fmt(delta) : fmtPct(delta)}
        </div>
      )}
    </div>
  );
}

function ResultadoPanel({ resultado, input }: { resultado: SimulacaoResultado; input: SimulacaoInput }) {
  const [expandidoMensal, setExpandidoMensal] = useState(false);
  const cfg = RECOMENDACAO_CONFIG[resultado.recomendacao];
  const Icon = cfg.icon;

  return (
    <div className="space-y-5">
      {/* Recomendação */}
      <div className={cn("rounded-2xl border-2 p-5", cfg.bg)}>
        <div className="flex items-center gap-3">
          <Icon className={cn("h-8 w-8", cfg.cor)} />
          <div>
            <p className={cn("text-lg font-bold", cfg.cor)}>
              {cfg.emoji} {cfg.label}
            </p>
            <p className="text-sm text-muted-foreground">{cfg.desc}</p>
          </div>
        </div>
      </div>

      {/* Detalhes da operação */}
      <div className="rounded-xl border bg-muted/30 p-4">
        <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Operação simulada
        </p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Valor</p>
            <p className="font-bold">{fmt(input.valor)}</p>
          </div>
          {resultado.totalParcelas > 1 && (
            <>
              <div>
                <p className="text-xs text-muted-foreground">Parcelas</p>
                <p className="font-bold">
                  {resultado.totalParcelas}x {fmt(resultado.valorParcela)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Custo total</p>
                <p
                  className={cn(
                    "font-bold",
                    resultado.custoTotal > input.valor ? "text-rose-600" : ""
                  )}
                >
                  {fmt(resultado.custoTotal)}
                </p>
              </div>
            </>
          )}
        </div>
        {resultado.custoTotal > input.valor && (
          <p className="mt-2 text-xs text-rose-600">
            Juros totais: {fmt(resultado.custoTotal - input.valor)} (
            {(((resultado.custoTotal - input.valor) / input.valor) * 100).toFixed(1)}%)
          </p>
        )}
      </div>

      {/* Comparação */}
      <div>
        <p className="mb-3 text-sm font-semibold">Comparação: Atual vs Simulado</p>
        <div className="grid grid-cols-2 gap-3">
          <MetricaComparativa
            label="Dinheiro disponível"
            atual={resultado.comparacao.dinheiroDisponivel.atual}
            simulado={resultado.comparacao.dinheiroDisponivel.simulado}
          />
          <MetricaComparativa
            label="Saldo ao fim do mês"
            atual={resultado.comparacao.saldoFimMes.atual}
            simulado={resultado.comparacao.saldoFimMes.simulado}
          />
          <MetricaComparativa
            label="Saldo atual"
            atual={resultado.comparacao.saldoAtual.atual}
            simulado={resultado.comparacao.saldoAtual.simulado}
          />
          <MetricaComparativa
            label="Comprometimento da renda"
            atual={resultado.comparacao.comprometimentoRenda.atual}
            simulado={resultado.comparacao.comprometimentoRenda.simulado}
            formato="percent"
          />
        </div>
      </div>

      {/* Alertas */}
      {resultado.alertas.length > 0 && (
        <div className="space-y-2">
          {resultado.alertas.map((a, i) => (
            <div
              key={i}
              className={cn(
                "flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm",
                a.severidade === "critico"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-amber-50 text-amber-800"
              )}
            >
              {a.severidade === "critico" ? (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              {a.descricao}
            </div>
          ))}
        </div>
      )}

      {/* Motivos */}
      {resultado.motivos.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold">Por quê?</p>
          <ul className="space-y-1.5">
            {resultado.motivos.map((m, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Impacto mensal */}
      {resultado.impactoMensal.length > 0 && (
        <div>
          <button
            onClick={() => setExpandidoMensal((v) => !v)}
            className="flex w-full items-center justify-between text-sm font-semibold"
          >
            Impacto por mês
            {expandidoMensal ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {expandidoMensal && (
            <div className="mt-3 space-y-2">
              {resultado.impactoMensal.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border bg-card px-4 py-2.5 text-sm"
                >
                  <span className="font-medium">{item.mes}</span>
                  <span className="text-rose-600">-{fmt(item.parcela)}</span>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Saldo projetado</p>
                    <p
                      className={cn(
                        "font-semibold",
                        item.saldoProjetado < 0 ? "text-destructive" : ""
                      )}
                    >
                      {fmt(item.saldoProjetado)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PossoFazerClient() {
  const [isPending, startTransition] = useTransition();
  const [tipo, setTipo] = useState<TipoSimulacao>("compra_parcelada");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [parcelas, setParcelas] = useState("12");
  const [taxaJuros, setTaxaJuros] = useState("");
  const [categoria, setCategoria] = useState("");
  const [resultado, setResultado] = useState<SimulacaoResultado | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const comParcelas = TIPOS_COM_PARCELAS.includes(tipo);
  const comJuros = TIPOS_COM_JUROS.includes(tipo);
  const recorrente = TIPOS_RECORRENTES.includes(tipo);

  function simular() {
    const valorNum = parseFloat(valor.replace(",", "."));
    if (!valorNum || isNaN(valorNum)) {
      setErro("Informe um valor válido.");
      return;
    }

    const input: SimulacaoInput = {
      tipo,
      descricao: descricao || TIPOS_SIMULACAO[tipo],
      valor: valorNum,
      data,
      parcelas: comParcelas ? parseInt(parcelas) || 1 : undefined,
      taxaJuros: comJuros && taxaJuros ? parseFloat(taxaJuros.replace(",", ".")) : undefined,
      categoria: categoria || undefined,
    };

    setErro(null);
    startTransition(async () => {
      const res = await simularAction(input);
      if (res.success) {
        setResultado(res.resultado);
      } else {
        setErro(res.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Posso Fazer Isso?</h1>
        <p className="text-sm text-muted-foreground">
          Simule decisões financeiras e veja o impacto antes de assumir novos compromissos.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Formulário ── */}
        <div className="space-y-5">
          {/* Tipo */}
          <div>
            <p className="mb-3 text-sm font-semibold">Que tipo de operação?</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(TIPOS_SIMULACAO) as TipoSimulacao[]).map((t) => {
                const Icon = TIPO_ICONE[t];
                const cor = TIPO_COR[t];
                const ativo = tipo === t;
                return (
                  <button
                    key={t}
                    onClick={() => {
                      setTipo(t);
                      setResultado(null);
                      setErro(null);
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
                      ativo ? cor : "border-border bg-card hover:bg-muted/50"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{TIPOS_SIMULACAO[t]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Campos */}
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Valor
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  R$
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="0,00"
                  className="w-full rounded-lg border bg-background px-3 py-2 pl-9 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Descrição
              </label>
              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder={TIPOS_SIMULACAO[tipo]}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {recorrente ? "A partir de" : "Data"}
                </label>
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Categoria
                </label>
                <input
                  type="text"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  placeholder="Ex: Moradia"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {comParcelas && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Número de parcelas
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={parcelas}
                    onChange={(e) => setParcelas(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                {comJuros && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Taxa de juros (% a.m.)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={taxaJuros}
                      onChange={(e) => setTaxaJuros(e.target.value)}
                      placeholder="Ex: 2,5"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {erro && (
            <p className="text-sm text-destructive">{erro}</p>
          )}

          <button
            onClick={simular}
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Calculando...
              </>
            ) : (
              <>
                Simular
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          {/* Aviso */}
          <p className="text-center text-xs text-muted-foreground">
            A simulação não altera seus dados reais.
          </p>
        </div>

        {/* ── Resultado ── */}
        <div>
          {!resultado && !isPending && (
            <div className="flex h-full min-h-[300px] items-center justify-center rounded-2xl border-2 border-dashed border-muted">
              <div className="text-center text-muted-foreground">
                <TrendingUp className="mx-auto mb-2 h-8 w-8 opacity-30" />
                <p className="text-sm">Preencha o formulário e clique em Simular</p>
                <p className="text-xs">para ver o impacto na sua situação financeira</p>
              </div>
            </div>
          )}

          {isPending && (
            <div className="flex h-full min-h-[300px] items-center justify-center rounded-2xl border">
              <div className="text-center text-muted-foreground">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-sm">Calculando impacto financeiro...</p>
              </div>
            </div>
          )}

          {resultado && !isPending && (
            <ResultadoPanel resultado={resultado} input={{ tipo, descricao, valor: parseFloat(valor.replace(",", ".")) || 0, data, parcelas: parseInt(parcelas) || 1, taxaJuros: parseFloat(taxaJuros) || undefined, categoria }} />
          )}
        </div>
      </div>
    </div>
  );
}
