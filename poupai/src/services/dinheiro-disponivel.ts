import "server-only";
import { prisma } from "@/lib/prisma";
import { getContas } from "./contas";
import { getCartoes } from "./cartoes";
import { getDividas } from "./dividas";
import { isPagoNoCiclo, vencimentoNoCiclo, isEncerrada } from "@/lib/fixas-ciclo";
import type {
  DinheiroDisponivelData,
  DinheiroDisponivelDetalhe,
  DisponibilidadeStatus,
} from "@/types/dinheiro-disponivel";

function calcStatus(disponivel: number, saldoAtual: number): DisponibilidadeStatus {
  if (disponivel < 0) return "critico";
  const base = Math.max(saldoAtual, 1);
  if (disponivel / base >= 0.3) return "confortavel";
  return "atencao";
}

export async function getDinheiroDisponivel(userId: string): Promise<DinheiroDisponivelData> {
  const now = new Date();

  const [contasData, fixasRaw, cartoes, dividas] = await Promise.all([
    getContas(userId),
    prisma.movimentacaoFixa.findMany({
      where: { userId, isDeleted: false, ativo: true },
      select: {
        nome: true,
        valor: true,
        isEntrada: true,
        diaVencimento: true,
        dataVencimento: true,
        dataFim: true,
        pago: true,
        dataUltimoPagamento: true,
      },
    }),
    getCartoes(userId),
    getDividas(userId),
  ]);

  const saldoAtual = contasData.saldoConsolidado;

  // Fixas pendentes no ciclo atual
  const fixasPendentes = fixasRaw.filter(
    (f) => !isEncerrada(f.dataFim, now) && !isPagoNoCiclo(f.pago, f.dataUltimoPagamento, now)
  );

  const fixasReceita: DinheiroDisponivelDetalhe[] = fixasPendentes
    .filter((f) => f.isEntrada)
    .map((f) => ({
      descricao: f.nome,
      valor: Number(String(f.valor)),
      vencimento: vencimentoNoCiclo(f.diaVencimento, f.dataVencimento, now),
    }));

  const fixasDespesa: DinheiroDisponivelDetalhe[] = fixasPendentes
    .filter((f) => !f.isEntrada)
    .map((f) => ({
      descricao: f.nome,
      valor: Number(String(f.valor)),
      vencimento: vencimentoNoCiclo(f.diaVencimento, f.dataVencimento, now),
    }));

  // Faturas abertas/fechadas/parciais não quitadas com vencimento a partir de hoje
  const faturasCartao: DinheiroDisponivelDetalhe[] = [];
  const hoje = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (const cartao of cartoes.filter((c) => c.ativo)) {
    for (const fatura of cartao.faturas) {
      if (
        fatura.status === "aberta" ||
        fatura.status === "fechada" ||
        fatura.status === "parcial"
      ) {
        // Ignorar faturas cujo vencimento já passou (não são mais obrigação pendente)
        if (fatura.vencimento < hoje) continue;
        const saldo = Math.max(0, fatura.total - fatura.totalPago);
        if (saldo > 0.005) {
          faturasCartao.push({
            descricao: `${cartao.nome} — fatura ${fatura.mesRef}`,
            valor: Math.round(saldo * 100) / 100,
            vencimento: fatura.vencimento,
          });
        }
      }
    }
  }

  // Próxima parcela de cada dívida ativa
  const dividasParceladas: DinheiroDisponivelDetalhe[] = dividas
    .filter((d) => !d.quitada)
    .map((d) => ({
      descricao: d.credor + (d.descricao ? ` — ${d.descricao}` : ""),
      valor: Math.round(d.valorParcela * 100) / 100,
      vencimento: d.dataProxVencimento,
    }));

  const totalReceitasFuturas = fixasReceita.reduce((acc, f) => acc + f.valor, 0);
  const totalFixasDespesa = fixasDespesa.reduce((acc, f) => acc + f.valor, 0);
  const totalFaturas = faturasCartao.reduce((acc, f) => acc + f.valor, 0);
  const totalDividas = dividasParceladas.reduce((acc, f) => acc + f.valor, 0);
  const despesasObrigatorias = totalFixasDespesa + totalFaturas + totalDividas;
  const dinheiroDisponivel = saldoAtual + totalReceitasFuturas - despesasObrigatorias;

  // Próximo vencimento entre todas as obrigações
  const todasObrigacoes = [...fixasDespesa, ...faturasCartao, ...dividasParceladas]
    .filter((i): i is DinheiroDisponivelDetalhe & { vencimento: Date } =>
      i.vencimento instanceof Date
    )
    .sort((a, b) => a.vencimento.getTime() - b.vencimento.getTime());

  const proximoVencimento =
    todasObrigacoes.length > 0
      ? {
          descricao: todasObrigacoes[0].descricao,
          valor: todasObrigacoes[0].valor,
          data: todasObrigacoes[0].vencimento,
        }
      : null;

  return {
    saldoAtual,
    receitasFuturas: totalReceitasFuturas,
    despesasObrigatorias,
    dinheiroDisponivel,
    status: calcStatus(dinheiroDisponivel, saldoAtual),
    proximoVencimento,
    detalhes: { fixasReceita, fixasDespesa, faturasCartao, dividasParceladas },
  };
}
