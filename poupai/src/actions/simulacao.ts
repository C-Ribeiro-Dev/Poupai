"use server";
import { getCurrentUserId } from "@/lib/auth";
import { getDinheiroDisponivel } from "@/services/dinheiro-disponivel";
import { getSaldoProjetado } from "@/services/saldo-projetado";
import {
  simulacaoSchema,
  type SimulacaoInput,
  type SimulacaoActionResult,
  type SimulacaoResultado,
  type RecomendacaoTipo,
  type ImpactoMensal,
} from "@/types/simulacao";
import type { EventoProjetado } from "@/types/saldo-projetado";

// Sistema Price para empréstimos com juros
function calcParcelaMensal(pv: number, taxaMensal: number, n: number): number {
  if (n <= 0) return pv;
  if (taxaMensal === 0) return Math.round((pv / n) * 100) / 100;
  const r = taxaMensal / 100;
  return Math.round(((pv * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)) * 100) / 100;
}

function mesLabel(date: Date): string {
  return date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

interface EventoSim {
  data: Date;
  valor: number;
  isEntrada: boolean;
}

function gerarEventosSimulados(input: SimulacaoInput): EventoSim[] {
  const dataBase = new Date(`${input.data}T12:00:00.000Z`);
  const parcelas = input.parcelas ?? 1;
  const taxa = input.taxaJuros ?? 0;
  const eventos: EventoSim[] = [];

  switch (input.tipo) {
    case "compra_avista":
    case "investimento":
    case "pagamento_antecipado":
      eventos.push({ data: dataBase, valor: input.valor, isEntrada: false });
      break;

    case "compra_parcelada": {
      const parcela = Math.round((input.valor / parcelas) * 100) / 100;
      for (let i = 0; i < parcelas; i++) {
        eventos.push({
          data: new Date(dataBase.getFullYear(), dataBase.getMonth() + i, dataBase.getDate(), 12),
          valor: parcela,
          isEntrada: false,
        });
      }
      break;
    }

    case "emprestimo": {
      // Recebe o valor agora, paga as parcelas a partir do próximo mês
      eventos.push({ data: dataBase, valor: input.valor, isEntrada: true });
      const parcela = calcParcelaMensal(input.valor, taxa, parcelas);
      for (let i = 0; i < parcelas; i++) {
        eventos.push({
          data: new Date(dataBase.getFullYear(), dataBase.getMonth() + 1 + i, dataBase.getDate(), 12),
          valor: parcela,
          isEntrada: false,
        });
      }
      break;
    }

    case "despesa_fixa":
    case "reducao_renda": {
      // Projeta 3 meses para visualização do impacto
      for (let i = 0; i < 3; i++) {
        eventos.push({
          data: new Date(dataBase.getFullYear(), dataBase.getMonth() + i, dataBase.getDate(), 12),
          valor: input.valor,
          isEntrada: false,
        });
      }
      break;
    }

    case "receita_adicional": {
      for (let i = 0; i < 3; i++) {
        eventos.push({
          data: new Date(dataBase.getFullYear(), dataBase.getMonth() + i, dataBase.getDate(), 12),
          valor: input.valor,
          isEntrada: true,
        });
      }
      break;
    }
  }

  return eventos;
}

function calcSaldoComEventos(
  saldoInicial: number,
  existentes: EventoProjetado[],
  simulados: EventoSim[],
  ateFim: Date
): number {
  const todos = [
    ...existentes
      .filter((e) => e.data <= ateFim)
      .map((e) => ({ data: e.data, valor: e.valor, isEntrada: e.isEntrada })),
    ...simulados.filter((e) => e.data <= ateFim),
  ].sort((a, b) => a.data.getTime() - b.data.getTime());

  return todos.reduce(
    (saldo, e) => saldo + (e.isEntrada ? e.valor : -e.valor),
    saldoInicial
  );
}

function avaliarRecomendacao(
  compRenda: number,
  dinheiroDispSimulado: number,
  saldoFimMesSimulado: number
): { recomendacao: RecomendacaoTipo; motivos: string[]; alertas: SimulacaoResultado["alertas"] } {
  const motivos: string[] = [];
  const alertas: SimulacaoResultado["alertas"] = [];
  const scores: number[] = []; // 0=verde, 1=amarelo, 2=vermelho

  // Comprometimento da renda
  if (compRenda <= 30) {
    scores.push(0);
    motivos.push("Comprometimento de renda dentro do limite saudável (≤ 30%).");
  } else if (compRenda <= 50) {
    scores.push(1);
    alertas.push({
      descricao: `Comprometimento de renda em ${compRenda.toFixed(0)}% — acima do ideal.`,
      severidade: "aviso",
    });
  } else {
    scores.push(2);
    alertas.push({
      descricao: `Comprometimento de renda em ${compRenda.toFixed(0)}% — risco elevado.`,
      severidade: "critico",
    });
  }

  // Dinheiro disponível
  if (dinheiroDispSimulado >= 0) {
    scores.push(0);
    motivos.push("Você ainda terá dinheiro disponível após esta operação.");
  } else {
    scores.push(2);
    alertas.push({
      descricao: "Esta operação deixará seu dinheiro disponível negativo.",
      severidade: "critico",
    });
  }

  // Saldo fim do mês
  if (saldoFimMesSimulado >= 0) {
    scores.push(0);
    motivos.push("Seu saldo permanecerá positivo ao fim do mês.");
  } else {
    scores.push(2);
    alertas.push({
      descricao: "Seu saldo ficará negativo ao fim do mês com esta operação.",
      severidade: "critico",
    });
  }

  const piorScore = Math.max(...scores);
  const recomendacao: RecomendacaoTipo =
    piorScore === 0 ? "recomendado" : piorScore === 1 ? "atencao" : "nao_recomendado";

  if (recomendacao === "recomendado") {
    motivos.push("Sua situação financeira suporta este compromisso.");
  }

  return { recomendacao, motivos, alertas };
}

export async function simularAction(
  input: SimulacaoInput
): Promise<SimulacaoActionResult> {
  const userId = await getCurrentUserId();

  const parsed = simulacaoSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos. Verifique os campos." };
  }

  const [disponivel, projetado] = await Promise.all([
    getDinheiroDisponivel(userId),
    getSaldoProjetado(userId),
  ]);

  const data = parsed.data;
  const eventosSimulados = gerarEventosSimulados(data);

  // ── Parcela e custo total ─────────────────────────────────────────────────
  const parcelas = data.parcelas ?? 1;
  const taxa = data.taxaJuros ?? 0;
  const valorParcela =
    data.tipo === "emprestimo"
      ? calcParcelaMensal(data.valor, taxa, parcelas)
      : data.tipo === "compra_parcelada"
        ? Math.round((data.valor / parcelas) * 100) / 100
        : data.valor;
  const custoTotal =
    data.tipo === "emprestimo"
      ? Math.round(valorParcela * parcelas * 100) / 100
      : data.valor;

  // ── Impacto no dinheiro disponível ───────────────────────────────────────
  // Para compras/empréstimos a parcela mensal reduz o disponível
  const parcelaMensalImpacto =
    ["compra_parcelada", "emprestimo"].includes(data.tipo)
      ? valorParcela
      : ["despesa_fixa", "reducao_renda"].includes(data.tipo)
        ? data.valor
        : data.tipo === "receita_adicional"
          ? -data.valor // aumenta o disponível
          : data.valor; // avista/investimento/pagamento: gasto único, não reduce renda futura

  // Para compras à vista e investimentos, o impacto imediato é no saldo, não na renda
  const impactoNoDisponivel =
    ["compra_avista", "investimento", "pagamento_antecipado"].includes(data.tipo)
      ? data.valor
      : parcelaMensalImpacto;

  const dinheiroDisponivelSimulado = disponivel.dinheiroDisponivel - impactoNoDisponivel;

  // ── Impacto no saldo atual ────────────────────────────────────────────────
  const impactoSaldoImediato = eventosSimulados
    .filter((e) => e.data.toISOString().slice(0, 10) <= new Date().toISOString().slice(0, 10))
    .reduce((acc, e) => acc + (e.isEntrada ? e.valor : -e.valor), 0);
  const saldoAtualSimulado = disponivel.saldoAtual + impactoSaldoImediato;

  // ── Impacto no saldo projetado fim do mês ────────────────────────────────
  const fimMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);
  const saldoFimMesSimulado = calcSaldoComEventos(
    disponivel.saldoAtual,
    projetado.eventos,
    eventosSimulados,
    fimMes
  );

  // ── Comprometimento da renda ──────────────────────────────────────────────
  const receitaMensal = disponivel.detalhes.fixasReceita.reduce((acc, r) => acc + r.valor, 0);
  const despesasMensaisAtuais =
    disponivel.detalhes.fixasDespesa.reduce((acc, d) => acc + d.valor, 0) +
    disponivel.detalhes.dividasParceladas.reduce((acc, d) => acc + d.valor, 0);

  const comprometimentoAtual =
    receitaMensal > 0 ? (despesasMensaisAtuais / receitaMensal) * 100 : 0;

  const novaCargaMensal = ["compra_parcelada", "emprestimo", "despesa_fixa", "reducao_renda"].includes(
    data.tipo
  )
    ? valorParcela
    : data.tipo === "receita_adicional"
      ? -valorParcela
      : 0;

  const comprometimentoSimulado =
    receitaMensal > 0
      ? ((despesasMensaisAtuais + novaCargaMensal) / receitaMensal) * 100
      : novaCargaMensal > 0
        ? 100
        : 0;

  // ── Impacto mensal (linha do tempo) ──────────────────────────────────────
  const impactoMensal: ImpactoMensal[] = [];
  const now = new Date();

  if (["compra_parcelada", "emprestimo"].includes(data.tipo)) {
    for (let i = 0; i < Math.min(parcelas, 12); i++) {
      const mesDate = new Date(now.getFullYear(), now.getMonth() + (data.tipo === "emprestimo" ? 1 : 0) + i, 1);
      const fimDesseMes = new Date(mesDate.getFullYear(), mesDate.getMonth() + 1, 0, 23, 59, 59);
      const saldoSimuladoMes = calcSaldoComEventos(
        disponivel.saldoAtual,
        projetado.eventos,
        eventosSimulados,
        fimDesseMes
      );
      impactoMensal.push({
        mes: mesLabel(mesDate),
        parcela: valorParcela,
        saldoProjetado: saldoSimuladoMes,
      });
    }
  } else if (["despesa_fixa", "reducao_renda", "receita_adicional"].includes(data.tipo)) {
    for (let i = 0; i < 3; i++) {
      const mesDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const fimDesseMes = new Date(mesDate.getFullYear(), mesDate.getMonth() + 1, 0, 23, 59, 59);
      const saldoSimuladoMes = calcSaldoComEventos(
        disponivel.saldoAtual,
        projetado.eventos,
        eventosSimulados,
        fimDesseMes
      );
      impactoMensal.push({
        mes: mesLabel(mesDate),
        parcela: valorParcela,
        saldoProjetado: saldoSimuladoMes,
      });
    }
  }

  const { recomendacao, motivos, alertas } = avaliarRecomendacao(
    comprometimentoSimulado,
    dinheiroDisponivelSimulado,
    saldoFimMesSimulado
  );

  const resultado: SimulacaoResultado = {
    recomendacao,
    motivos,
    alertas,
    valorParcela,
    custoTotal,
    totalParcelas: parcelas,
    comparacao: {
      dinheiroDisponivel: {
        atual: disponivel.dinheiroDisponivel,
        simulado: dinheiroDisponivelSimulado,
      },
      saldoFimMes: {
        atual: projetado.saldoFimMes,
        simulado: saldoFimMesSimulado,
      },
      comprometimentoRenda: {
        atual: comprometimentoAtual,
        simulado: comprometimentoSimulado,
      },
      saldoAtual: {
        atual: disponivel.saldoAtual,
        simulado: saldoAtualSimulado,
      },
    },
    impactoMensal,
  };

  return { success: true, resultado };
}
