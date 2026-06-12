"use client";
import { useState, useTransition } from "react";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cartao-migrar">Cartão de destino</Label>
          <select
            id="cartao-migrar"
            value={cartaoId || ""}
            onChange={(e) => setCartaoId(Number(e.target.value) || 0)}
            disabled={isPending}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Selecione...</option>
            {cartoes.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>

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
