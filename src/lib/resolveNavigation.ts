import type { AppContext } from "@/types/auth";
import type { NavItemDefinition, ResolvedNavItem } from "@/types/navigation";

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
