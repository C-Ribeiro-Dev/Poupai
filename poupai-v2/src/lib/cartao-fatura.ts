// Helpers puros do ciclo de faturas de cartão (client-safe).
// Convenção: a fatura é identificada pelo mês em que FECHA ("YYYY-MM").
// Compra até o dia do fechamento entra na fatura do próprio mês; depois, na do mês seguinte.

export interface MesRef {
  ano: number;
  mes: number; // 0-11
}

export function mesRefToString(ref: MesRef): string {
  return `${ref.ano}-${String(ref.mes + 1).padStart(2, "0")}`;
}

export function stringToMesRef(s: string): MesRef {
  const [ano, mes] = s.split("-").map(Number);
  return { ano, mes: mes - 1 };
}

export function addMeses(ref: MesRef, n: number): MesRef {
  const d = new Date(ref.ano, ref.mes + n, 1);
  return { ano: d.getFullYear(), mes: d.getMonth() };
}

export function mesRefLabel(s: string): string {
  const ref = stringToMesRef(s);
  const label = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
    new Date(ref.ano, ref.mes, 1)
  );
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// Fatura em que cai a 1ª parcela de uma compra
export function mesRefPrimeiraParcela(dataCompra: Date | string, diaFechamento: number): MesRef {
  const d = new Date(dataCompra);
  const base: MesRef = { ano: d.getFullYear(), mes: d.getMonth() };
  return d.getDate() <= diaFechamento ? base : addMeses(base, 1);
}

// Fatura atualmente "aberta" (recebendo novas compras)
export function mesRefFaturaAberta(diaFechamento: number, now: Date = new Date()): MesRef {
  const base: MesRef = { ano: now.getFullYear(), mes: now.getMonth() };
  return now.getDate() <= diaFechamento ? base : addMeses(base, 1);
}

// Data de vencimento de uma fatura: no mesmo mês se vence depois do fechamento, senão no mês seguinte
export function vencimentoDaFatura(
  mesRefStr: string,
  diaFechamento: number,
  diaVencimento: number
): Date {
  const ref = stringToMesRef(mesRefStr);
  const alvo = diaVencimento > diaFechamento ? ref : addMeses(ref, 1);
  const ultimoDia = new Date(alvo.ano, alvo.mes + 1, 0).getDate();
  return new Date(alvo.ano, alvo.mes, Math.min(diaVencimento, ultimoDia), 12);
}

// Valor de cada parcela com ajuste de centavos na última
export function valorParcela(valorTotal: number, parcelas: number, indice: number): number {
  const base = Math.floor((valorTotal / parcelas) * 100) / 100;
  if (indice === parcelas - 1) {
    return Math.round((valorTotal - base * (parcelas - 1)) * 100) / 100;
  }
  return base;
}

export type FaturaStatus = "paga" | "aberta" | "fechada" | "futura";

export function getFaturaStatus(
  mesRefStr: string,
  diaFechamento: number,
  paga: boolean,
  now: Date = new Date()
): FaturaStatus {
  if (paga) return "paga";
  const aberta = mesRefToString(mesRefFaturaAberta(diaFechamento, now));
  if (mesRefStr === aberta) return "aberta";
  return mesRefStr < aberta ? "fechada" : "futura";
}
