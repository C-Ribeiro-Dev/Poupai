// Helpers puros do ciclo mensal das movimentações fixas (client-safe).
// Uma fixa "paga" só conta como paga dentro do mês do último pagamento —
// na virada do mês ela volta a ficar pendente automaticamente.

export function isPagoNoCiclo(
  pago: boolean,
  dataUltimoPagamento: Date | string | null,
  ref: Date = new Date()
): boolean {
  if (!pago || !dataUltimoPagamento) return false;
  const d = new Date(dataUltimoPagamento);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

// Vencimento efetivo do ciclo: com diaVencimento, é o dia correspondente do mês
// de referência (ajustado para meses curtos); sem ele, vale a dataVencimento fixa.
export function vencimentoNoCiclo(
  diaVencimento: number | null,
  dataVencimento: Date | string | null,
  ref: Date = new Date()
): Date | null {
  if (diaVencimento) {
    const ultimoDia = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
    return new Date(ref.getFullYear(), ref.getMonth(), Math.min(diaVencimento, ultimoDia), 12);
  }
  return dataVencimento ? new Date(dataVencimento) : null;
}

// Fixa encerrada: dataFim anterior ao início do mês de referência.
export function isEncerrada(dataFim: Date | string | null, ref: Date = new Date()): boolean {
  if (!dataFim) return false;
  const inicioMes = new Date(ref.getFullYear(), ref.getMonth(), 1);
  return new Date(dataFim) < inicioMes;
}
