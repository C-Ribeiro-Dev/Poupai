import type { Metadata } from "next";
import { getCurrentUserId } from "@/lib/auth";
import { getTiposMovimentacao } from "@/services/tipos";
import { getCategorias } from "@/services/categorias";
import { getContas } from "@/services/contas";
import { getCartoes } from "@/services/cartoes";
import { getSugestoesCategoria, getIdsExternosImportados, getIdsExternosComprasCartao } from "@/services/importacao";
import { ImportarClient } from "./_components/importar-client";

export const metadata: Metadata = { title: "Importar extrato" };

export default async function ImportarPage({
  searchParams,
}: {
  searchParams: Promise<{ cartao?: string }>;
}) {
  const [userId, { cartao }] = await Promise.all([getCurrentUserId(), searchParams]);
  const [tipos, categorias, contasData, cartoes, sugestoes, idsMovimentacoes, idsCompras] = await Promise.all([
    getTiposMovimentacao(userId),
    getCategorias(userId),
    getContas(userId),
    getCartoes(userId),
    getSugestoesCategoria(userId),
    getIdsExternosImportados(userId),
    getIdsExternosComprasCartao(userId),
  ]);

  const initialCartaoId = cartao ? parseInt(cartao, 10) || 0 : 0;

  return (
    <ImportarClient
      tipos={tipos}
      categorias={categorias}
      contas={contasData.contas.filter((c) => c.ativo)}
      cartoes={cartoes.filter((c) => c.ativo)}
      sugestoes={sugestoes}
      idsImportados={idsMovimentacoes}
      idsComprasImportadas={idsCompras}
      initialModo={initialCartaoId ? "cartao" : "conta"}
      initialCartaoId={initialCartaoId}
    />
  );
}
