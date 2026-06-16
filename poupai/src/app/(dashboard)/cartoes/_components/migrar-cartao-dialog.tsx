"use client";
import { useState, useTransition } from "react";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FloatingCombobox } from "@/components/ui/floating-combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { migrarMovimentacoesParaCartaoAction } from "@/actions/cartoes";
import type { CartaoRow } from "@/types/cartoes";

interface MigrarCartaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartoes: CartaoRow[];
}

export function MigrarCartaoDialog({ open, onOpenChange, cartoes }: MigrarCartaoDialogProps) {
  const [cartaoId, setCartaoId] = useState(0);
  const [isPending, startTransition] = useTransition();

  function handleMigrar() {
    if (!cartaoId) { toast.error("Selecione um cartão."); return; }
    startTransition(async () => {
      const result = await migrarMovimentacoesParaCartaoAction(cartaoId);
      if (result.success) {
        const desc = result.ignoradas > 0
          ? { description: `${result.ignoradas} já estavam no cartão e foram removidas das movimentações.` }
          : undefined;
        toast.success(`${result.migradas} compras migradas para o cartão.`, desc);
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>Migrar movimentações de cartão</DialogTitle>
          <DialogDescription>
            Move todas as transações importadas do CSV de fatura do Nubank para a tela de
            Cartões, e as remove de Movimentações. Selecione para qual cartão elas devem ir.
          </DialogDescription>
        </DialogHeader>

        <FloatingCombobox
          label="Cartão de destino"
          options={cartoes.map((c) => ({ value: String(c.id), label: c.nome }))}
          value={cartaoId ? String(cartaoId) : ""}
          onChange={(v) => setCartaoId(v ? Number(v) : 0)}
          disabled={isPending}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleMigrar} disabled={isPending || !cartaoId}>
            {isPending ? (
              <><Loader2 className="size-4 animate-spin" />Migrando...</>
            ) : (
              <><ArrowRightLeft className="size-4" />Migrar</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
