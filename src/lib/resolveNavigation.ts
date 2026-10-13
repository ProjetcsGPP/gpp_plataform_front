// src/lib/resolveNavigation.ts
import type { AppContext } from "@/types/auth";
import type { NavItemDefinition, ResolvedNavItem } from "@/types/navigation";

/**
 * Remove do fallback local itens cuja disponibilidade é definida pelo backend.
 * Isso impede que uma falha no endpoint de menus transforme o manifest em uma
 * concessão implícita de capability.
 */
export function getNavigationFallback(
  items: NavItemDefinition[],
): NavItemDefinition[] {
  return items
    .filter((item) => !item.capabilityControlled)
    .map((item) => ({
      ...item,
      children: item.children
        ? getNavigationFallback(item.children)
        : undefined,
    }));
}

export function resolveNavigation(
  items: NavItemDefinition[],
  granted: string[],
  appContext: AppContext,
): ResolvedNavItem[] {
  return items
    .filter((item) => item.app === appContext)
    .map((item): ResolvedNavItem => {
      const enabled =
        !item.permissionKey || granted.includes(item.permissionKey);

      const visible = enabled || item.visibleWhenDenied === true;

      return {
        ...item,
        enabled,
        visible,
        children: item.children
          ? resolveNavigation(item.children, granted, appContext)
          : undefined,
      };
    })
    .sort((a, b) => a.order - b.order);
}
