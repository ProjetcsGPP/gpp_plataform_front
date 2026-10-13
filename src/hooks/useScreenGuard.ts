"use client";

import { usePermissions } from "@/hooks/usePermissions";
import type { PermissionKey } from "@/lib/permissions";
import { debugLog } from "@/lib/debug";

type MatchMode = "all" | "any";

export function useScreenGuard(
  permissions: PermissionKey | PermissionKey[],
  mode: MatchMode = "all",
): {
  allowed: boolean;
  isLoading: boolean;
  isHydrated: boolean;
} {
  const { can, hasAny, hasAll, isLoading, isHydrated } = usePermissions();

  const keys = Array.isArray(permissions) ? permissions : [permissions];

  const allowed = isHydrated
    ? mode === "all"
      ? keys.length === 1
        ? can(keys[0])
        : hasAll(keys)
      : hasAny(keys)
    : false;

  debugLog("screen-guard", "permissões avaliadas", {
    keys,
    mode,
    allowed,
    isLoading,
    isHydrated,
  });

  return {
    allowed,
    isLoading,
    isHydrated,
  };
}
