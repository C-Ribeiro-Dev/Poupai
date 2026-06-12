"use client";
import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { registerAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const [state, action, isPending] = useActionState(registerAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      {state?.error && (
        <div
          role="alert"
          className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
        >
          {state.error}
        </div>
      )}

      {state?.message && (
        <div
          role="status"
          className="rounded-lg bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-500"
        >
          {state.message}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nome">Nome</Label>
        <Input
          id="nome"
          name="nome"
          type="text"
          placeholder="Seu nome"
          autoComplete="name"
          aria-invalid={!!state?.fieldErrors?.nome}
          disabled={isPending}
          required
        />
        {state?.fieldErrors?.nome && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.nome[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="seu@email.com"
          autoComplete="email"
          aria-invalid={!!state?.fieldErrors?.email}
          disabled={isPending}
          required
        />
        {state?.fieldErrors?.email && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.email[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          aria-invalid={!!state?.fieldErrors?.password}
          disabled={isPending}
          required
        />
        {state?.fieldErrors?.password && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.password[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Confirmar senha</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          aria-invalid={!!state?.fieldErrors?.confirmPassword}
          disabled={isPending}
          required
        />
        {state?.fieldErrors?.confirmPassword && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.confirmPassword[0]}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full mt-2" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Criando conta...
          </>
        ) : (
          "Criar conta"
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link
          href="/login"
          className="text-foreground underline underline-offset-4 hover:opacity-80"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}
