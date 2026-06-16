"use client";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";

export function LoginForm() {
  const [state, action, isPending] = useActionState(loginAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      {state?.error && (
        <div
          role="alert"
          className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {state.error}
        </div>
      )}

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
        autoComplete="current-password"
        aria-invalid={!!state?.fieldErrors?.password}
        error={state?.fieldErrors?.password?.[0]}
        disabled={isPending}
        required
      />

      <Button type="submit" className="mt-1 h-12 w-full rounded-xl text-sm font-semibold" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Entrando...
          </>
        ) : (
          "Entrar"
        )}
      </Button>
    </form>
  );
}
