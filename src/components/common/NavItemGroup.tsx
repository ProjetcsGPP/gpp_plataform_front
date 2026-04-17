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
  depth?: number;
}

export function NavItemGroup({
  item,
  isExpanded,
  pathname,
  onNavigate,
  depth = 0,
}: NavItemGroupProps) {
  // P6a: filtra por visible — resolveNavigation já calcula o campo,
  // mas NavItemGroup não estava respeitando o resultado
  const visibleChildren = item.children?.filter((c) => c.visible) ?? [];

  // P6b: grupo sem filhos visíveis não renderiza (exceto visibleWhenDenied)
  if (visibleChildren.length === 0 && !item.visibleWhenDenied) return null;

  const isChildActive = visibleChildren.some(
    (c) => c.href && (pathname === c.href || pathname.startsWith(`${c.href}/`)),
  );
  const [open, setOpen] = useState(isChildActive);

  // Recuo visual: 16px por nível (pl-4 = 16px)
  const indentClass = depth > 0 ? `pl-${Math.min(depth * 4, 12)}` : "";

  return (
    <div className={indentClass}>
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

      {open &&
        isExpanded &&
        // P6a: usa visibleChildren em vez de item.children
        visibleChildren.map((child) =>
          child.children?.length && depth < 2 ? (
            <NavItemGroup
              key={child.id}
              item={child}
              isExpanded={isExpanded}
              pathname={pathname}
              onNavigate={onNavigate}
              depth={depth + 1}
            />
          ) : (
            <div key={child.id} className="pl-4">
              <NavItem
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
            </div>
          ),
        )}
    </div>
  );
}
