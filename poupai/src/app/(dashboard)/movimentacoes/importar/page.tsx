import type { Metadata } from "next";
import { getCurrentUserId } from "@/lib/auth";
import { getTiposMovimentacao } from "@/services/tipos";
import { getCategorias } from "@/services/categorias";
import { getContas } from "@/services/contas";
import { getCartoes } from "@/services/cartoes";
import { getSugestoesCategoria, getIdsExternosImportados, getIdsExternosComprasCartao } from "@/services/importacao";
import { ImportarClient } from "./_components/importar-client";

export const metadata: Metadata = { title: "Importar extrato" };

export default async function ImportarPage() {
  const userId = await getCurrentUserId();
  const [tipos, categorias, contasData, cartoes, sugestoes, idsMovimentacoes, idsCompras] = await Promise.all([
    getTiposMovimentacao(userId),
    getCategorias(userId),
    getContas(userId),
    getCartoes(userId),
    getSugestoesCategoria(userId),
    getIdsExternosImportados(userId),
    getIdsExternosComprasCartao(userId),
  ]);

  return (
    <ImportarClient
      tipos={tipos}
      categorias={categorias}
      contas={contasData.contas.filter((c) => c.ativo)}
      cartoes={cartoes.filter((c) => c.ativo)}
      sugestoes={sugestoes}
      idsImportados={idsMovimentacoes}
      idsComprasImportadas={idsCompras}
    />
  );
}
