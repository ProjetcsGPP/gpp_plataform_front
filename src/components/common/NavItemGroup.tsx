"use client";

import { useState } from "react";
import { NavItem } from "@/components/common/NavItem";
import type { ResolvedNavItem } from "@/types/navigation";

interface NavItemGroupProps {
  item: ResolvedNavItem;
  isExpanded: boolean;
  pathname: string;
  onNavigate: (href: string) => void;
  depth?: number; // ← controla o recuo visual por nível
}

export function NavItemGroup({
  item,
  isExpanded,
  pathname,
  onNavigate,
  depth = 0,
}: NavItemGroupProps) {
  const isChildActive = item.children?.some(
    (c) => pathname === c.href || pathname.startsWith(`${c.href}/`),
  );
  const [open, setOpen] = useState(isChildActive ?? false);

  // Recuo visual: 16px por nível (pl-4 = 16px)
  const indentClass = depth > 0 ? `pl-${Math.min(depth * 4, 12)}` : "";

  return (
    <div className={indentClass}>
      <NavItem
        icon={item.icon}
        label={item.label}
        isExpanded={isExpanded}
        active={isChildActive}
        onClick={() => {
          if (isExpanded) setOpen((o) => !o);
          else if (item.href) onNavigate(item.href);
        }}
        trailingIcon={
          isExpanded ? (open ? "expand_less" : "expand_more") : undefined
        }
      />

      {open &&
        isExpanded &&
        item.children?.map((child) =>
          // ↓ AQUI: se já estamos no nível 1 (depth >= 1), nunca renderiza subgrupo
          child.children?.length && depth < 2 ? (
            // Filho é grupo E ainda não atingimos o limite → recursão
            <NavItemGroup
              key={child.id}
              item={child}
              isExpanded={isExpanded}
              pathname={pathname}
              onNavigate={onNavigate}
              depth={depth + 1}
            />
          ) : (
            // Filho é item simples OU limite de profundidade atingido → NavItem direto
            <div key={child.id} className="pl-4">
              <NavItem
                icon={child.icon}
                label={child.label}
                isExpanded={isExpanded}
                active={
                  pathname === child.href ||
                  pathname.startsWith(`${child.href}/`)
                }
                onClick={
                  child.enabled ? () => onNavigate(child.href) : undefined
                }
              />
            </div>
          ),
        )}
    </div>
  );
}
