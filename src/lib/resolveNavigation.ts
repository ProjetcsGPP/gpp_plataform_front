// src/lib/resolveNavigation.ts

import type { NavItemDefinition, ResolvedNavItem } from '@/types/navigation'

export function resolveNavigation(
  items: NavItemDefinition[],
  granted: string[]
): ResolvedNavItem[] {
  return items
    .sort((a, b) => a.order - b.order)
    .map((item): ResolvedNavItem => {
      const hasPermission =
        !item.permissionKey || granted.includes(item.permissionKey)

      const resolved: ResolvedNavItem = {
        ...item,
        enabled: hasPermission,
        visible: hasPermission || (item.visibleWhenDenied ?? false),
      }

      if (item.children?.length) {
        resolved.children = resolveNavigation(item.children, granted)
      }

      return resolved
    })
    .filter((item) => item.visible)
}
