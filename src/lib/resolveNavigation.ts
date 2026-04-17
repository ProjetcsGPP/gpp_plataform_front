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
      return {
        ...item,
        enabled: !item.permissionKey || granted.includes(item.permissionKey),
        visible:
          item.visibleWhenDenied !== false ||
          !item.permissionKey ||
          granted.includes(item.permissionKey),
        children: item.children
          ? resolveNavigation(item.children, granted)
          : undefined,
      };
    })
    .sort((a, b) => a.order - b.order);
}
