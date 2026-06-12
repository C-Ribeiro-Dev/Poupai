"use client";
import { useRouter } from "next/navigation";
import { Bell, AlertCircle, Clock, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Notificacao, NotificacaoUrgencia } from "@/services/notificacoes";

const urgenciaIcon: Record<NotificacaoUrgencia, { icon: React.ElementType; cls: string }> = {
  alta: { icon: AlertCircle, cls: "text-red-500" },
  media: { icon: Clock, cls: "text-amber-500" },
  baixa: { icon: Info, cls: "text-blue-500" },
};

interface NotificationsMenuProps {
  notificacoes: Notificacao[];
}

export function NotificationsMenu({ notificacoes }: NotificationsMenuProps) {
  const router = useRouter();
  const count = notificacoes.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "relative inline-flex size-8 items-center justify-center rounded-lg transition-colors",
          "hover:bg-muted hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
        aria-label={`Notificações${count > 0 ? ` (${count})` : ""}`}
      >
        <Bell className="size-4" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Notificações</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {count === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
            Tudo em dia! Nenhuma notificação. 🎉
          </div>
        ) : (
          notificacoes.map((n) => {
            const cfg = urgenciaIcon[n.urgencia];
            const Icon = cfg.icon;
            return (
              <DropdownMenuItem key={n.id} onClick={() => router.push(n.href)}>
                <Icon className={cn("size-4 shrink-0", cfg.cls)} />
                <span className="line-clamp-2 text-xs leading-snug">{n.texto}</span>
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
