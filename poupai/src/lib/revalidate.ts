import { revalidatePath } from "next/cache";

export function revalidateDashboard(...paths: string[]) {
  for (const p of paths) revalidatePath(p);
  revalidatePath("/compromissos");
  revalidatePath("/saldo-projetado");
  revalidatePath("/");
}
