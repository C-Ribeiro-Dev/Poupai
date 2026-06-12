"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/actions/auth";

interface UserMenuProps {
  email: string;
  name?: string | null;
  isAdmin?: boolean;
}

function getInitials(name: string | null | undefined, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
}

export function UserMenu({ email, name, isAdmin }: UserMenuProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const initials = getInitials(name, email);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-full p-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Menu do usuário"
      >
        <Avatar className="size-8">
          <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-0.5">
              {name && <span className="text-sm font-medium">{name}</span>}
              <span className="truncate text-xs text-muted-foreground">{email}</span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {isAdmin && (
          <>
            <DropdownMenuItem onClick={() => router.push("/admin")}>
              <ShieldCheck className="size-4" />
              Administração
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          variant="destructive"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await logoutAction();
            });
          }}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LogOut className="size-4" />
          )}
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
