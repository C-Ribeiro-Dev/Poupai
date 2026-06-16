"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
}

export function NavItem({ href, icon: Icon, label, onClick }: NavItemProps) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
        isActive
          ? "bg-sidebar-primary/10 text-sidebar-primary"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-sidebar-primary" />
      )}
      <Icon className={cn("size-4 shrink-0", isActive && "text-sidebar-primary")} />
      <span>{label}</span>
    </Link>
  );
}
