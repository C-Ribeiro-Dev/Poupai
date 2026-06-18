"use client";
import { useState, useTransition } from "react";
import { User, Lock, Download, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateNomeAction, updateSenhaAction, exportMovimentacoesAction } from "@/actions/configuracoes";

interface Props {
  nome: string;
  email: string;
}

export function ConfiguracoesClient({ nome: nomeInicial, email }: Props) {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Configurações</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Gerencie seu perfil e preferências</p>
      </div>

      <PerfilSection nome={nomeInicial} email={email} />
      <SenhaSection />
      <ExportarSection />
    </div>
  );
}

function PerfilSection({ nome: nomeInicial, email }: { nome: string; email: string }) {
  const [nome, setNome] = useState(nomeInicial);
  const [isPending, start] = useTransition();

  function handleSave() {
    start(async () => {
      const res = await updateNomeAction(nome);
      if (res.success) toast.success("Nome atualizado!");
      else toast.error(res.error);
    });
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 border-b border-border pb-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/10">
          <User className="size-4 text-indigo-500" />
        </div>
        <h2 className="font-semibold">Perfil</h2>
      </div>

      <div className="mt-5 flex flex-col gap-4 sm:max-w-md">
        <div>
          <label className="mb-1 block text-xs font-medium">E-mail</label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm text-muted-foreground"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">O e-mail não pode ser alterado.</p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium" htmlFor="nome">
            Nome
          </label>
          <input
            id="nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <Button
            onClick={handleSave}
            disabled={isPending || nome === nomeInicial}
            size="sm"
          >
            {isPending ? (
              <><Loader2 className="size-4 animate-spin" />Salvando...</>
            ) : (
              <><Check className="size-4" />Salvar nome</>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}

function SenhaSection() {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [isPending, start] = useTransition();

  function handleSave() {
    start(async () => {
      const res = await updateSenhaAction(novaSenha, confirmar);
      if (res.success) {
        toast.success("Senha alterada com sucesso!");
        setNovaSenha("");
        setConfirmar("");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 border-b border-border pb-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10">
          <Lock className="size-4 text-amber-500" />
        </div>
        <h2 className="font-semibold">Segurança</h2>
      </div>

      <div className="mt-5 flex flex-col gap-4 sm:max-w-md">
        <div>
          <label className="mb-1 block text-xs font-medium" htmlFor="nova-senha">
            Nova senha
          </label>
          <input
            id="nova-senha"
            type="password"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium" htmlFor="confirmar-senha">
            Confirmar nova senha
          </label>
          <input
            id="confirmar-senha"
            type="password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            placeholder="Repita a nova senha"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <Button
            onClick={handleSave}
            disabled={isPending || !novaSenha || !confirmar}
            size="sm"
          >
            {isPending ? (
              <><Loader2 className="size-4 animate-spin" />Salvando...</>
            ) : (
              <><Lock className="size-4" />Alterar senha</>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}

function ExportarSection() {
  const [isPending, start] = useTransition();

  function handleExport() {
    start(async () => {
      const res = await exportMovimentacoesAction();
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `poupai-movimentacoes-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Exportação concluída!");
    });
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 border-b border-border pb-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10">
          <Download className="size-4 text-emerald-500" />
        </div>
        <h2 className="font-semibold">Exportar dados</h2>
      </div>

      <div className="mt-5">
        <p className="text-sm text-muted-foreground">
          Baixe todas as suas movimentações registradas em formato CSV, compatível com Excel e
          Google Sheets.
        </p>
        <div className="mt-4">
          <Button onClick={handleExport} disabled={isPending} variant="outline" size="sm">
            {isPending ? (
              <><Loader2 className="size-4 animate-spin" />Gerando...</>
            ) : (
              <><Download className="size-4" />Exportar movimentações (CSV)</>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}
