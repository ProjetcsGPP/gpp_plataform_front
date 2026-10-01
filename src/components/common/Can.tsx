// src/components/common/Can.tsx
"use client";

import { usePermissions } from "@/hooks/usePermissions";
import type { PermissionKey } from "@/lib/permissions";
import type { ReactNode } from "react";
import { debugLog } from "@/lib/debug";

interface CanProps {
  permission: PermissionKey;
  children: ReactNode;
  fallback?: ReactNode;
}

export function Can({ permission, children, fallback = null }: CanProps) {
  const { can, isLoading } = usePermissions();

  if (isLoading) {
    debugLog("permissions", "permissões ainda carregando", {
      permission,
    });

    return null;
  }

  const allowed = can(permission);

  debugLog("permissions", "permissão avaliada", {
    permission,
    allowed,
  });

  return allowed ? <>{children}</> : <>{fallback}</>;
}
