// src/lib/resolveNavigation.ts

import type { NavItemDefinition, ResolvedNavItem } from "@/types/navigation";
export function resolveNavigation(
  items: NavItemDefinition[],
  granted: string[],
): ResolvedNavItem[] {
  return items
    .sort((a, b) => a.order - b.order)
    .map((item): ResolvedNavItem => {
      const hasPermission =
        !item.permissionKey || granted.includes(item.permissionKey);

      const { children, ...rest } = item;

      const resolved: ResolvedNavItem = {
        ...rest,
        enabled: hasPermission,
        visible: hasPermission || (item.visibleWhenDenied ?? false),
      };

      if (children?.length) {
        resolved.children = resolveNavigation(children, granted);
      }

      return resolved;
    })
    .filter((item) => item.visible);
}
