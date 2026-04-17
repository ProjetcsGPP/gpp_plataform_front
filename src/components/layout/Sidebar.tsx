// src/components/layout/Sidebar.tsx
"use client";

import { useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { NavItem } from "@/components/common/NavItem";
import { NavItemGroup } from "@/components/common/NavItemGroup";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useNavigationStore } from "@/store/navigationStore";
import { logoutApp } from "@/lib/auth";
import { APP_CONFIG } from "@/types/auth";
import type { AppContext } from "@/types/auth";
import { NavReloadButton } from "@/components/dev/NavReloadButton";

interface SidebarProps {
  appContext: AppContext;
}

export default function Sidebar({ appContext }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  const clearAuth = useAuthStore((s) => s.clearAuth);

  const items = useNavigationStore((s) => s.items);
  const isLoading = useNavigationStore((s) => s.isLoading);

  const handleMouseEnter = () => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    if (isPinned) return;
    collapseTimer.current = setTimeout(() => setIsExpanded(false), 120);
  };

  const expanded = isExpanded || isPinned;

  async function handleLogout() {
    const { loginPath } = APP_CONFIG[appContext];
    await logoutApp(appContext);
    clearAuth();
    router.push(loginPath);
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full flex flex-col",
        "bg-surface-container-lowest border-r border-outline-variant shadow-sm z-50",
        "transition-[width] duration-300 ease-in-out",
        expanded ? "w-64" : "w-18",
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-expanded={expanded}
    >
      <div className="px-4 py-6 flex items-center gap-3 min-h-18">
        <button
          onClick={() => setIsPinned((p) => !p)}
          className={cn(
            "w-10 h-10 shrink-0 authority-gradient rounded-lg flex items-center justify-center shadow-md",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          )}
          aria-label={isPinned ? "Desafixar sidebar" : "Fixar sidebar"}
          title={isPinned ? "Desafixar sidebar" : "Fixar sidebar"}
        >
          <span
            className="material-symbols-outlined text-white text-[20px] leading-none"
            style={{
              fontVariationSettings: isPinned ? "'FILL' 1" : "'FILL' 0",
            }}
          >
            {isPinned ? "push_pin" : "account_balance"}
          </span>
        </button>

        <div
          className={cn(
            "flex flex-col overflow-hidden whitespace-nowrap",
            "transition-[opacity,transform] duration-300 ease-in-out",
            expanded
              ? "opacity-100 translate-x-0 pointer-events-auto"
              : "opacity-0 -translate-x-2 pointer-events-none",
          )}
          aria-hidden={!expanded}
        >
          <h1 className="text-base font-bold tracking-tight text-blue-900 font-outfit leading-tight">
            SUBGES/SEGER
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">
            Gov Management
          </p>
        </div>
      </div>

      <nav
        className="px-2 space-y-1 mt-2 flex-1"
        aria-label="Navegação principal"
      >
        {isLoading ? (
          <div className="px-3 py-2 text-xs text-on-surface-variant">
            Carregando navegação...
          </div>
        ) : items.length > 0 ? (
          items.map((item) =>
            item.children?.length ? (
              <NavItemGroup
                key={item.id}
                item={item}
                isExpanded={expanded}
                pathname={pathname}
                onNavigate={(href) => router.push(href)}
              />
            ) : (
              <NavItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                isExpanded={expanded}
                active={
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                }
                disabled={!item.enabled}
                onClick={
                  item.enabled ? () => router.push(item.href) : undefined
                }
              />
            ),
          )
        ) : (
          <div className="px-3 py-2 text-xs text-on-surface-variant">
            Nenhum item de navegação disponível
          </div>
        )}
      </nav>

      <div className="mt-auto px-2 pb-2 flex flex-col gap-1">
        <NavReloadButton />
        <NavItem
          icon="logout"
          label="Sair"
          isExpanded={expanded}
          onClick={handleLogout}
        />
      </div>
    </aside>
  );
}
