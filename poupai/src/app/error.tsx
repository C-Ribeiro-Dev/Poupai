"use client";
import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-6 text-destructive" />
      </div>
      <div>
        <h1 className="text-lg font-semibold">Algo deu errado</h1>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Não foi possível carregar os dados. Verifique sua conexão e tente novamente.
        </p>
      </div>
      <Button onClick={reset} variant="outline">
        <RotateCcw className="size-4" />
        Tentar novamente
      </Button>
    </div>
  );
}
