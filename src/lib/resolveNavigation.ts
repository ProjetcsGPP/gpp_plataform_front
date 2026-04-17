// src/lib/resolveNavigation.ts
// Transforma NavItemDefinition[] + granted[] em ResolvedNavItem[].
//
// Regras:
//   enabled = granted.includes(permissionKey) (ou true se sem permissionKey)
//   visible = enabled || visibleWhenDenied === true
//
// Frontend NÃO decide regra de negócio. Apenas aplica:
//   UI = f(grantedPermissions)

import type { NavItemDefinition, ResolvedNavItem } from "@/types/navigation";

export function resolveNavigation(
  items: NavItemDefinition[],
  granted: string[],
): ResolvedNavItem[] {
  return items
    .map((item): ResolvedNavItem => {
      const enabled = item.permissionKey
        ? granted.includes(item.permissionKey)
        : true; // sem permissionKey → sempre habilitado (item público da nav)

      const visible = enabled || item.visibleWhenDenied === true;

      return {
        ...item,
        enabled,
        visible,
        children: item.children
          ? resolveNavigation(item.children, granted)
          : undefined,
      };
    })
    .sort((a, b) => a.order - b.order);
}
