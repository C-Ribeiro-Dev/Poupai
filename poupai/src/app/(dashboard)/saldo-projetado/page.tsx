import { getCurrentUserId } from "@/lib/auth";
import { getSaldoProjetado } from "@/services/saldo-projetado";
import { SaldoProjetadoClient } from "./_components/saldo-projetado-client";

export default async function SaldoProjetadoPage() {
  const userId = await getCurrentUserId();
  const data = await getSaldoProjetado(userId);
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <SaldoProjetadoClient data={data} />
    </div>
  );
}
