import { MobileNav } from "./mobile-nav";
import { GlobalSearch } from "./global-search";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { NotificationsMenu } from "./notifications-menu";
import type { Notificacao } from "@/services/notificacoes";

interface HeaderProps {
  userEmail: string;
  userName?: string | null;
  isAdmin?: boolean;
  notificacoes?: Notificacao[];
}

export function Header({ userEmail, userName, isAdmin, notificacoes = [] }: HeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
      <MobileNav />
      <span className="text-sm font-semibold md:hidden">Poupai</span>
      <div className="flex-1" />
      <GlobalSearch />
      <NotificationsMenu notificacoes={notificacoes} />
      <ThemeToggle />
      <UserMenu email={userEmail} name={userName} isAdmin={isAdmin} />
    </header>
  );
}
