import { z } from "zod";

export const metaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(150, "Máximo 150 caracteres"),
  descricao: z.string().max(500, "Máximo 500 caracteres").optional(),
  valorAlvo: z
    .number({ message: "Informe um valor válido" })
    .min(0.01, "O valor deve ser maior que zero")
    .max(999_999_999.99),
  dataAlvo: z.string().optional(),
  cor: z.string().min(1),
});

export type MetaFormData = z.infer<typeof metaSchema>;

export const aporteSchema = z.object({
  valor: z
    .number({ message: "Informe um valor válido" })
    .min(0.01, "O valor deve ser maior que zero")
    .max(999_999_999.99),
  data: z.string().min(1, "Informe a data"),
});

export type AporteFormData = z.infer<typeof aporteSchema>;

export type MetaStatus = "concluida" | "atrasada" | "no_prazo" | "sem_prazo";

export interface MetaRow {
  id: number;
  nome: string;
  descricao: string | null;
  valorAlvo: number;
  dataAlvo: Date | null;
  cor: string;
  totalAportado: number;
  percentual: number;
  restante: number;
  aporteSugerido: number | null;
  mesesRestantes: number | null;
  status: MetaStatus;
  createdAt: Date;
}

export function computeMetaDerivados(
  valorAlvo: number,
  totalAportado: number,
  dataAlvo: Date | null
): Pick<MetaRow, "percentual" | "restante" | "aporteSugerido" | "mesesRestantes" | "status"> {
  const percentual = valorAlvo > 0 ? (totalAportado / valorAlvo) * 100 : 0;
  const restante = Math.max(valorAlvo - totalAportado, 0);

  if (percentual >= 100) {
    return { percentual, restante: 0, aporteSugerido: null, mesesRestantes: null, status: "concluida" };
  }

  if (!dataAlvo) {
    return { percentual, restante, aporteSugerido: null, mesesRestantes: null, status: "sem_prazo" };
  }

  const now = new Date();
  const alvo = new Date(dataAlvo);
  const meses =
    (alvo.getFullYear() - now.getFullYear()) * 12 + (alvo.getMonth() - now.getMonth());

  if (meses < 0 || (meses === 0 && alvo < now)) {
    return { percentual, restante, aporteSugerido: restante, mesesRestantes: 0, status: "atrasada" };
  }

  const mesesRestantes = Math.max(meses, 1);
  return {
    percentual,
    restante,
    aporteSugerido: restante / mesesRestantes,
    mesesRestantes,
    status: "no_prazo",
  };
}
