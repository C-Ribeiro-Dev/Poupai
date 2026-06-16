"use client";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  UserPlus,
  ShieldCheck,
  Trash2,
  Loader2,
  AlertTriangle,
  Users,
  Eye,
  EyeOff,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { novoUsuarioSchema, type NovoUsuarioFormData, type UsuarioRow } from "@/types/admin";
import {
  createUsuarioAction,
  deleteUsuarioAction,
  toggleAcessoCompartilhadoAction,
} from "@/actions/admin";

const formatDate = (iso: string | null): string => {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
};

interface AdminClientProps {
  usuarios: UsuarioRow[];
  currentUserId: string;
  loadError: string | null;
}

export function AdminClient({ usuarios, currentUserId, loadError }: AdminClientProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UsuarioRow | null>(null);
  const [senhasVisiveis, setSenhasVisiveis] = useState<Set<string>>(new Set());

  function toggleSenha(id: string) {
    setSenhasVisiveis((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <ShieldCheck className="size-5 text-emerald-500" />
            Administração
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Gerencie quem tem acesso ao Poupai
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm" className="shrink-0">
          <UserPlus className="size-4" />
          <span className="hidden sm:inline">Novo usuário</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          Erro ao listar usuários: {loadError}
        </div>
      )}

      {/* Tabela de usuários */}
      <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Usuário
                </th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-muted-foreground lg:table-cell">
                  Senha
                </th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-muted-foreground sm:table-cell">
                  Criado em
                </th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-muted-foreground md:table-cell">
                  Último acesso
                </th>
                <th className="hidden px-4 py-2.5 text-center text-xs font-medium text-muted-foreground md:table-cell">
                  Acesso compartilhado
                </th>
                <th className="w-16 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                      <Users className="size-9 text-muted-foreground/30" />
                      <p className="text-sm font-medium text-muted-foreground">
                        Nenhum usuário encontrado
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                usuarios.map((u) => (
                  <UsuarioRow
                    key={u.id}
                    usuario={u}
                    currentUserId={currentUserId}
                    senhaVisivel={senhasVisiveis.has(u.id)}
                    onToggleSenha={() => toggleSenha(u.id)}
                    onDelete={() => setDeleteTarget(u)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        {usuarios.length > 0 && (
          <div className="border-t bg-muted/20 px-4 py-2.5">
            <p className="text-xs text-muted-foreground">
              {usuarios.length} usuário{usuarios.length !== 1 ? "s" : ""} com acesso
            </p>
          </div>
        )}
      </div>

      <NovoUsuarioDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ExcluirUsuarioDialog
        open={!!deleteTarget}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDeleteTarget(null);
        }}
        usuario={deleteTarget}
      />
    </div>
  );
}

// ─── Linha da tabela ─────────────────────────────────────────────────────────

function UsuarioRow({
  usuario: u,
  currentUserId,
  senhaVisivel,
  onToggleSenha,
  onDelete,
}: {
  usuario: UsuarioRow;
  currentUserId: string;
  senhaVisivel: boolean;
  onToggleSenha: () => void;
  onDelete: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggleCompartilhado() {
    startTransition(async () => {
      const result = await toggleAcessoCompartilhadoAction(u.id, !u.acessoCompartilhado);
      if (!result.success) toast.error(result.error);
    });
  }

  return (
    <tr className="group/row transition-colors hover:bg-muted/30">
      {/* Usuário */}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-2 font-medium">
            {u.nome ?? u.email}
            {u.isAdmin && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="size-3" />
                Admin
              </span>
            )}
            {u.id === currentUserId && (
              <span className="rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[11px] font-medium text-blue-700 dark:text-blue-400">
                Você
              </span>
            )}
          </span>
          <span className="text-xs text-muted-foreground">{u.email}</span>
        </div>
      </td>

      {/* Senha */}
      <td className="hidden px-4 py-3 lg:table-cell">
        {u.senhaTemp ? (
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs">
              {senhaVisivel ? u.senhaTemp : "••••••••"}
            </span>
            <button
              type="button"
              onClick={onToggleSenha}
              className="text-muted-foreground hover:text-foreground"
              aria-label={senhaVisivel ? "Ocultar senha" : "Mostrar senha"}
            >
              {senhaVisivel ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>

      {/* Criado em */}
      <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground sm:table-cell">
        {formatDate(u.criadoEm)}
      </td>

      {/* Último acesso */}
      <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground md:table-cell">
        {formatDate(u.ultimoLogin)}
      </td>

      {/* Acesso compartilhado */}
      <td className="hidden px-4 py-3 md:table-cell">
        {u.id !== currentUserId ? (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleToggleCompartilhado}
              disabled={isPending}
              aria-label={
                u.acessoCompartilhado
                  ? "Desativar acesso compartilhado"
                  : "Ativar acesso compartilhado"
              }
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                u.acessoCompartilhado
                  ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
                isPending && "pointer-events-none opacity-50"
              )}
            >
              {isPending ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Share2 className="size-3" />
              )}
              {u.acessoCompartilhado ? "Ativo" : "Inativo"}
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="text-xs text-muted-foreground">—</span>
          </div>
        )}
      </td>

      {/* Ações */}
      <td className="px-4 py-3">
        {u.id !== currentUserId && (
          <div className="flex justify-end transition-opacity md:opacity-0 md:focus-within:opacity-100 md:group-hover/row:opacity-100">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onDelete}
              aria-label={`Excluir ${u.email}`}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        )}
      </td>
    </tr>
  );
}

// ─── Dialog: novo usuário ────────────────────────────────────────────────────

function NovoUsuarioDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<NovoUsuarioFormData>({
    resolver: zodResolver(novoUsuarioSchema),
    defaultValues: { nome: "", email: "", senha: "" },
  });

  useEffect(() => {
    if (open) form.reset({ nome: "", email: "", senha: "" });
  }, [open, form]);

  function onSubmit(data: NovoUsuarioFormData) {
    startTransition(async () => {
      const result = await createUsuarioAction(data);
      if (result.success) {
        toast.success("Usuário criado com sucesso.", {
          description: "Ele já pode entrar com e-mail e senha (sem confirmação por e-mail).",
        });
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>Novo usuário</DialogTitle>
          <DialogDescription>
            O usuário é criado já confirmado — basta entrar com o e-mail e a senha definidos
            aqui.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FloatingInput
            label="Nome"
            id="nome"
            aria-invalid={!!form.formState.errors.nome}
            error={form.formState.errors.nome?.message}
            disabled={isPending}
            {...form.register("nome")}
          />

          <FloatingInput
            label="E-mail"
            id="email"
            type="email"
            autoComplete="off"
            aria-invalid={!!form.formState.errors.email}
            error={form.formState.errors.email?.message}
            disabled={isPending}
            {...form.register("email")}
          />

          <FloatingInput
            label="Senha"
            id="senha"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!form.formState.errors.senha}
            error={form.formState.errors.senha?.message}
            disabled={isPending}
            {...form.register("senha")}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <UserPlus className="size-4" />
                  Criar usuário
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Dialog: excluir usuário ─────────────────────────────────────────────────

function ExcluirUsuarioDialog({
  open,
  onOpenChange,
  usuario,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: UsuarioRow | null;
}) {
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    if (!usuario) return;
    startTransition(async () => {
      const result = await deleteUsuarioAction(usuario.id);
      if (result.success) {
        toast.success("Usuário excluído com sucesso.");
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
          <DialogTitle>Excluir usuário</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir{" "}
            <span className="font-medium text-foreground">{usuario?.email}</span>? O acesso
            será revogado imediatamente. Os dados financeiros registrados por ele permanecem
            no banco.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
            className={cn(isPending && "pointer-events-none")}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="size-4" />
                Excluir
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
