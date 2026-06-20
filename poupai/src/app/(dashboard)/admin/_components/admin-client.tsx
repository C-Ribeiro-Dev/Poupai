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
  Pencil,
  X,
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
import {
  novoUsuarioSchema,
  editarUsuarioSchema,
  type NovoUsuarioFormData,
  type EditarUsuarioFormData,
  type UsuarioRow,
} from "@/types/admin";
import {
  createUsuarioAction,
  updateUsuarioAction,
  deleteUsuarioAction,
  setAcessoCompartilhadoAction,
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
  const [editTarget, setEditTarget] = useState<UsuarioRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UsuarioRow | null>(null);
  const [compartilhadoTarget, setCompartilhadoTarget] = useState<UsuarioRow | null>(null);
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

      {/* Tabela */}
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
                <th className="w-20 px-4 py-2.5" />
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
                  <UsuarioTableRow
                    key={u.id}
                    usuario={u}
                    todos={usuarios}
                    currentUserId={currentUserId}
                    senhaVisivel={senhasVisiveis.has(u.id)}
                    onToggleSenha={() => toggleSenha(u.id)}
                    onEdit={() => setEditTarget(u)}
                    onDelete={() => setDeleteTarget(u)}
                    onCompartilhado={() => setCompartilhadoTarget(u)}
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

      <EditarUsuarioDialog
        open={!!editTarget}
        usuario={editTarget}
        onOpenChange={(v) => { if (!v) setEditTarget(null); }}
      />

      <AcessoCompartilhadoDialog
        open={!!compartilhadoTarget}
        usuario={compartilhadoTarget}
        todos={usuarios}
        onOpenChange={(v) => { if (!v) setCompartilhadoTarget(null); }}
      />

      <ExcluirUsuarioDialog
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
        usuario={deleteTarget}
      />
    </div>
  );
}

// ─── Linha da tabela ──────────────────────────────────────────────────────────

function UsuarioTableRow({
  usuario: u,
  todos,
  currentUserId,
  senhaVisivel,
  onToggleSenha,
  onEdit,
  onDelete,
  onCompartilhado,
}: {
  usuario: UsuarioRow;
  todos: UsuarioRow[];
  currentUserId: string;
  senhaVisivel: boolean;
  onToggleSenha: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCompartilhado: () => void;
}) {
  const contaVinculada = u.contaCompartilhadaId
    ? todos.find((x) => x.id === u.contaCompartilhadaId)
    : null;

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
              onClick={onCompartilhado}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                contaVinculada
                  ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <Share2 className="size-3" />
              {contaVinculada ? (contaVinculada.nome ?? contaVinculada.email) : "Inativo"}
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
          <div className="flex justify-end gap-1 transition-opacity md:opacity-0 md:focus-within:opacity-100 md:group-hover/row:opacity-100">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onEdit}
              aria-label={`Editar ${u.email}`}
            >
              <Pencil className="size-3.5" />
            </Button>
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
        toast.success("Usuário criado com sucesso.");
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
            O usuário é criado já confirmado — basta entrar com o e-mail e a senha definidos aqui.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FloatingInput label="Nome" id="nome" disabled={isPending}
            error={form.formState.errors.nome?.message} {...form.register("nome")} />
          <FloatingInput label="E-mail" id="email" type="email" autoComplete="off"
            disabled={isPending} error={form.formState.errors.email?.message}
            {...form.register("email")} />
          <FloatingInput label="Senha" id="senha" type="password" autoComplete="new-password"
            disabled={isPending} error={form.formState.errors.senha?.message}
            {...form.register("senha")} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <><Loader2 className="size-4 animate-spin" />Criando...</> : <><UserPlus className="size-4" />Criar usuário</>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Dialog: editar usuário ──────────────────────────────────────────────────

function EditarUsuarioDialog({
  open,
  usuario,
  onOpenChange,
}: {
  open: boolean;
  usuario: UsuarioRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<EditarUsuarioFormData>({
    resolver: zodResolver(editarUsuarioSchema),
    defaultValues: { nome: "", email: "", senha: "" },
  });

  useEffect(() => {
    if (open && usuario) {
      form.reset({ nome: usuario.nome ?? "", email: usuario.email, senha: "" });
    }
  }, [open, usuario, form]);

  function onSubmit(data: EditarUsuarioFormData) {
    if (!usuario) return;
    startTransition(async () => {
      const result = await updateUsuarioAction(usuario.id, data);
      if (result.success) {
        toast.success("Usuário atualizado.");
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
          <DialogTitle>Editar usuário</DialogTitle>
          <DialogDescription>
            Deixe a senha em branco para não alterá-la.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FloatingInput label="Nome" id="edit-nome" disabled={isPending}
            error={form.formState.errors.nome?.message} {...form.register("nome")} />
          <FloatingInput label="E-mail" id="edit-email" type="email" autoComplete="off"
            disabled={isPending} error={form.formState.errors.email?.message}
            {...form.register("email")} />
          <FloatingInput label="Nova senha (opcional)" id="edit-senha" type="password"
            autoComplete="new-password" disabled={isPending}
            error={form.formState.errors.senha?.message} {...form.register("senha")} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <><Loader2 className="size-4 animate-spin" />Salvando...</> : <><Pencil className="size-4" />Salvar</>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Dialog: acesso compartilhado ────────────────────────────────────────────

function AcessoCompartilhadoDialog({
  open,
  usuario,
  todos,
  onOpenChange,
}: {
  open: boolean;
  usuario: UsuarioRow | null;
  todos: UsuarioRow[];
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [contaId, setContaId] = useState<string>("");

  useEffect(() => {
    if (open && usuario) setContaId(usuario.contaCompartilhadaId ?? "");
  }, [open, usuario]);

  const opcoes = todos.filter((u) => u.id !== usuario?.id);

  function handleSalvar() {
    if (!usuario) return;
    startTransition(async () => {
      const result = await setAcessoCompartilhadoAction(usuario.id, contaId || null);
      if (result.success) {
        toast.success(contaId ? "Acesso compartilhado configurado." : "Acesso compartilhado removido.");
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
          <DialogTitle>Acesso compartilhado</DialogTitle>
          <DialogDescription>
            Selecione de qual conta <strong>{usuario?.nome ?? usuario?.email}</strong> poderá visualizar os dados.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setContaId("")}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
              !contaId
                ? "border-indigo-500 bg-indigo-500/10 text-foreground"
                : "border-border hover:bg-muted/50"
            )}
          >
            <X className="size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Sem acesso compartilhado</p>
              <p className="text-xs text-muted-foreground">O usuário vê apenas os próprios dados</p>
            </div>
          </button>

          {opcoes.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => setContaId(u.id)}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                contaId === u.id
                  ? "border-indigo-500 bg-indigo-500/10 text-foreground"
                  : "border-border hover:bg-muted/50"
              )}
            >
              <Share2 className="size-4 shrink-0 text-indigo-500" />
              <div>
                <p className="text-sm font-medium">{u.nome ?? u.email}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={isPending}>
            {isPending ? <><Loader2 className="size-4 animate-spin" />Salvando...</> : "Salvar"}
          </Button>
        </DialogFooter>
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
            será revogado imediatamente. Os dados financeiros permanecem no banco.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
            {isPending ? <><Loader2 className="size-4 animate-spin" />Excluindo...</> : <><Trash2 className="size-4" />Excluir</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
