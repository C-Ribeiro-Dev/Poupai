"use client";
import { NavItem } from "./nav-item";
import { navItems } from "./nav-config";

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-60 md:shrink-0 md:flex-col md:border-r md:border-sidebar-border md:bg-sidebar">
      <div className="flex h-14 shrink-0 items-center border-b border-sidebar-border px-6">
        <span className="text-base font-bold text-sidebar-foreground">Poupai</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {navItems.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>
    </aside>
  );
}
