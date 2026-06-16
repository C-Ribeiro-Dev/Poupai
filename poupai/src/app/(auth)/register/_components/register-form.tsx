"use client";
import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { registerAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";

export function RegisterForm() {
  const [state, action, isPending] = useActionState(registerAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      {state?.error && (
        <div role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {state?.message && (
        <div role="status" className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500">
          {state.message}
        </div>
      )}

      <FloatingInput
        name="nome"
        type="text"
        label="Nome"
        autoComplete="name"
        aria-invalid={!!state?.fieldErrors?.nome}
        error={state?.fieldErrors?.nome?.[0]}
        disabled={isPending}
        required
      />

      <FloatingInput
        name="email"
        type="email"
        label="E-mail"
        autoComplete="email"
        aria-invalid={!!state?.fieldErrors?.email}
        error={state?.fieldErrors?.email?.[0]}
        disabled={isPending}
        required
      />

      <FloatingInput
        name="password"
        type="password"
        label="Senha"
        autoComplete="new-password"
        aria-invalid={!!state?.fieldErrors?.password}
        error={state?.fieldErrors?.password?.[0]}
        disabled={isPending}
        required
      />

      <FloatingInput
        name="confirmPassword"
        type="password"
        label="Confirmar senha"
        autoComplete="new-password"
        aria-invalid={!!state?.fieldErrors?.confirmPassword}
        error={state?.fieldErrors?.confirmPassword?.[0]}
        disabled={isPending}
        required
      />

      <Button type="submit" className="mt-1 h-12 w-full rounded-xl text-sm font-semibold" disabled={isPending}>
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
        <Link href="/login" className="text-foreground underline underline-offset-4 hover:opacity-80">
          Entrar
        </Link>
      </p>
    </form>
  );
}
