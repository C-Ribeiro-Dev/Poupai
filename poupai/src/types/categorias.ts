import { z } from "zod";

export const categoriaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(100, "Máximo 100 caracteres"),
  cor: z.string().min(1, "Cor é obrigatória"),
  icone: z.string().min(1, "Ícone é obrigatório"),
  tipo: z.enum(["entrada", "saida", "ambos"]),
  ativo: z.boolean(),
});

export type CategoriaFormData = z.infer<typeof categoriaSchema>;

export interface CategoriaRow {
  id: number;
  nome: string;
  cor: string;
  icone: string;
  tipo: "entrada" | "saida" | "ambos";
  ativo: boolean;
  isDefault: boolean;
  createdAt: Date;
}
