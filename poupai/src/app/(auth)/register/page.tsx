import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RegisterForm } from "./_components/register-form";

export const metadata: Metadata = { title: "Cadastro" };

export default function RegisterPage() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="text-2xl font-bold tracking-tight">Poupai</span>
        <span className="text-sm text-muted-foreground">
          Crie sua conta gratuitamente
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Criar conta</CardTitle>
          <CardDescription>
            Preencha os dados abaixo para começar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
    </div>
  );
}
