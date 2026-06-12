// Parser do CSV de transações do cartão Nubank.
// Formato: "date,category,title,amount"
// - date: YYYY-MM-DD
// - amount: positivo = despesa, negativo = estorno/crédito
// - Parcelamentos: título termina em "1/6", "2/6", etc. (com ou sem " - " antes)

export interface LinhaCartao {
  data: string;        // YYYY-MM-DD
  descricao: string;   // título limpo sem "N/M"
  categoria: string;   // categoria sugerida pelo Nubank
  valor: number;       // sempre positivo
  isEntrada: boolean;  // true = estorno/crédito
  parcela: number | null;      // parcela atual (2 em "2/6"), null se à vista
  totalParcelas: number | null; // total de parcelas (6 em "2/6"), null se à vista
  idExterno: string;   // chave de dedup
}

// Regex: título termina em " N/M" ou " - N/M"
const PARCELA_RE = /^(.*?)(?:\s+-\s+|\s+)(\d+)\/(\d+)$/;

function normalizarTitulo(titulo: string): string {
  return titulo.trim().toUpperCase().replace(/\s+/g, " ");
}

export function parseNubankCartaoCsv(texto: string): LinhaCartao[] {
  const linhas = texto
    .replace(/^﻿/, "") // BOM
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "");

  if (linhas.length < 2) throw new Error("Arquivo vazio ou sem transações.");

  // Detecta separador: vírgula ou ponto-e-vírgula
  const sep = linhas[0].includes(";") ? ";" : ",";

  const header = linhas[0]
    .split(sep)
    .map((h) => h.trim().toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/"/g, "")
    );

  const idxDate     = header.findIndex((h) => h === "date" || h === "data");
  const idxCategory = header.findIndex((h) => h === "category" || h === "categoria");
  const idxTitle    = header.findIndex((h) => h === "title" || h === "titulo" || h === "descricao");
  const idxAmount   = header.findIndex((h) => h === "amount" || h === "valor");

  if (idxDate === -1 || idxTitle === -1 || idxAmount === -1) {
    throw new Error(
      'Formato não reconhecido. Use o CSV de transações do cartão Nubank (colunas "date,category,title,amount").'
    );
  }

  const resultado: LinhaCartao[] = [];

  for (let i = 1; i < linhas.length; i++) {
    const campos = linhas[i]
      .split(sep)
      .map((c) => c.trim().replace(/^"|"$/g, ""));

    if (campos.length < 3) continue;

    const dataRaw = campos[idxDate] ?? "";
    // Aceita YYYY-MM-DD ou DD/MM/YYYY
    let data = dataRaw;
    const brMatch = dataRaw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (brMatch) data = `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) continue;

    const tituloRaw = (campos[idxTitle] ?? "").trim() || "Sem descrição";
    const categoriaRaw = idxCategory >= 0 ? (campos[idxCategory] ?? "").trim() : "";

    const amountRaw = (campos[idxAmount] ?? "")
      .replace(/\s/g, "")
      // trata formato brasileiro "1.234,56" → "1234.56"
      .replace(/\.(\d{3}),/, (_, g) => `${g}.`)
      .replace(",", ".");
    const amount = parseFloat(amountRaw);
    if (isNaN(amount) || amount === 0) continue;

    // Detecta parcelamento
    const parcelaMatch = PARCELA_RE.exec(tituloRaw);
    let descricao: string;
    let parcela: number | null = null;
    let totalParcelas: number | null = null;

    if (parcelaMatch) {
      descricao = parcelaMatch[1].trim() || tituloRaw;
      parcela = parseInt(parcelaMatch[2], 10);
      totalParcelas = parseInt(parcelaMatch[3], 10);
    } else {
      descricao = tituloRaw;
    }

    // idExterno: prefixo card + data + título normalizado + amount
    // Inclui parcela no id para que cada parcela seja única
    const idExterno = `nub-card:${data}|${normalizarTitulo(tituloRaw)}|${amount.toFixed(2)}`;

    resultado.push({
      data,
      descricao: descricao.slice(0, 200),
      categoria: categoriaRaw.slice(0, 100),
      valor: Math.abs(amount),
      isEntrada: amount < 0, // negativo = estorno/crédito
      parcela,
      totalParcelas,
      idExterno,
    });
  }

  if (resultado.length === 0) throw new Error("Nenhuma transação válida encontrada no arquivo.");
  return resultado;
}
