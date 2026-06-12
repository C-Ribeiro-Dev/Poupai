// Parser do extrato CSV da conta Nubank (client-safe).
// Formato: cabeçalho "Data,Valor,Identificador,Descrição"
// - Data em DD/MM/YYYY
// - Valor com ponto decimal; negativo = saída
// - Identificador é um UUID único por transação (usado para evitar importação duplicada)

export interface LinhaExtrato {
  data: string; // YYYY-MM-DD
  valor: number; // sempre positivo
  isEntrada: boolean;
  descricao: string;
  idExterno: string;
}

// Split de linha CSV respeitando aspas
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let atual = "";
  let dentroAspas = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (dentroAspas && line[i + 1] === '"') {
        atual += '"';
        i++;
      } else {
        dentroAspas = !dentroAspas;
      }
    } else if (ch === "," && !dentroAspas) {
      out.push(atual);
      atual = "";
    } else {
      atual += ch;
    }
  }
  out.push(atual);
  return out.map((s) => s.trim());
}

export function parseNubankCsv(texto: string): LinhaExtrato[] {
  const linhas = texto
    .replace(/^﻿/, "") // BOM
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "");

  if (linhas.length < 2) {
    throw new Error("Arquivo vazio ou sem transações.");
  }

  const header = splitCsvLine(linhas[0]).map((h) =>
    h
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
  );
  const idxData = header.indexOf("data");
  const idxValor = header.indexOf("valor");
  const idxId = header.indexOf("identificador");
  const idxDesc = header.indexOf("descricao");

  if (idxData === -1 || idxValor === -1 || idxDesc === -1) {
    throw new Error(
      'Formato não reconhecido. Use o CSV do extrato da conta Nubank (colunas "Data, Valor, Identificador, Descrição").'
    );
  }

  const resultado: LinhaExtrato[] = [];
  for (let i = 1; i < linhas.length; i++) {
    const campos = splitCsvLine(linhas[i]);
    if (campos.length < 3) continue;

    const dataBr = campos[idxData];
    const m = dataBr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) continue;
    const data = `${m[3]}-${m[2]}-${m[1]}`;

    const valorNum = Number(campos[idxValor].replace(",", "."));
    if (isNaN(valorNum) || valorNum === 0) continue;

    resultado.push({
      data,
      valor: Math.abs(valorNum),
      isEntrada: valorNum > 0,
      descricao: (campos[idxDesc] ?? "").slice(0, 200) || "Sem descrição",
      idExterno: idxId !== -1 && campos[idxId] ? campos[idxId] : `${data}|${valorNum}|${campos[idxDesc] ?? ""}`.slice(0, 120),
    });
  }

  if (resultado.length === 0) {
    throw new Error("Nenhuma transação válida encontrada no arquivo.");
  }

  return resultado;
}
