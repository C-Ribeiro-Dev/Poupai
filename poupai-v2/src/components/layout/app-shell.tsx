import { getCurrentUser } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { getNotificacoes } from "@/services/notificacoes";
import type { Notificacao } from "@/services/notificacoes";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const email = user?.email ?? "";
  const name = (user?.user_metadata?.nome as string | undefined) ?? null;
  const isAdmin = isAdminEmail(email);

  let notificacoes: Notificacao[] = [];
  if (user) {
    try {
      notificacoes = await getNotificacoes(user.id);
    } catch {
      // Notificações são opcionais — não derrubam o shell
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          userEmail={email}
          userName={name}
          isAdmin={isAdmin}
          notificacoes={notificacoes}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
