// src/components/common/PermissionGate.tsx
"use client";

import { useScreenGuard } from "@/hooks/useScreenGuard";
import type { PermissionKey } from "@/lib/permissions";
import type { ReactNode } from "react";
import { debugLog } from "@/lib/debug";

interface PermissionGateProps {
  permissions: PermissionKey | PermissionKey[];

  /**
   * "all" exige todas as permissões.
   * "any" exige pelo menos uma.
   */
  mode?: "all" | "any";

  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
}

export function PermissionGate({
  permissions,
  mode = "all",
  children,
  fallback = null,
  loadingFallback = null,
}: PermissionGateProps) {
  const { allowed, isLoading } = useScreenGuard(permissions, mode);

  debugLog("permissions", "PermissionGate avaliado", {
    permissions,
    mode,
    allowed,
    isLoading,
  });

  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  return allowed ? <>{children}</> : <>{fallback}</>;
}
