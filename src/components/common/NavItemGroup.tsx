// src/components/common/NavItemGroup.tsx
// P6a: filtra filhos por visible antes de renderizar
// P6b: oculta cabeçalho do grupo quando não há filhos visíveis
// P6c: trata href opcional — grupo sem href não navega na sidebar colapsada
"use client";

import { useState } from "react";
import { NavItem }  from "@/components/common/NavItem";
import type { ResolvedNavItem } from "@/types/navigation";

interface NavItemGroupProps {
  item: ResolvedNavItem;
  isExpanded: boolean;
  pathname: string;
  onNavigate: (href: string) => void;
}

export function NavItemGroup({
  item,
  isExpanded,
  pathname,
  onNavigate,
}: NavItemGroupProps) {
  // P6a: filtra por visible — resolveNavigation já calcula o campo,
  // mas NavItemGroup não estava respeitando o resultado
  const visibleChildren = item.children?.filter((c) => c.visible) ?? [];
  const isChildActive = visibleChildren.some(
    (c) => c.href && (pathname === c.href || pathname.startsWith(`${c.href}/`)),
  );
  const [open, setOpen] = useState(isChildActive);

  // P6b: grupo sem filhos visíveis não renderiza (exceto visibleWhenDenied)
  if (visibleChildren.length === 0 && !item.visibleWhenDenied) return null;

  return (
    <div>
      <NavItem
        icon={item.icon}
        label={item.label}
        isExpanded={isExpanded}
        active={isChildActive}
        disabled={!item.enabled}
        onClick={() => {
          // P6c: sidebar expandida → toggle submenu
          // sidebar colapsada + href → navega
          // sidebar colapsada + sem href → no-op
          if (isExpanded) {
            setOpen((o) => !o);
          } else if (item.href) {
            onNavigate(item.href);
          }
        }}
        trailingIcon={
          isExpanded ? (open ? "expand_less" : "expand_more") : undefined
        }
      />

      {open && isExpanded && (
        <div
          role="group"
          aria-label={`Submenu de ${item.label}`}
          className="ml-4 border-l border-outline-variant/60 pl-2"
        >
          {/* P6a: usa visibleChildren em vez de item.children */}
          {visibleChildren.map((child) =>
            child.children?.length ? (
              <NavItemGroup
                key={child.id}
                item={child}
                isExpanded={isExpanded}
                pathname={pathname}
                onNavigate={onNavigate}
              />
            ) : (
              <NavItem
                key={child.id}
                icon={child.icon}
                label={child.label}
                isExpanded={isExpanded}
                active={
                  !!child.href &&
                  (pathname === child.href ||
                    pathname.startsWith(`${child.href}/`))
                }
                disabled={!child.enabled}
                onClick={
                  child.enabled && child.href
                    ? () => onNavigate(child.href!)
                    : undefined
                }
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}
