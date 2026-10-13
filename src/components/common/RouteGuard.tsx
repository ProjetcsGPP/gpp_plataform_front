// src/components/common/RouteGuard.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useScreenGuard } from "@/hooks/useScreenGuard";
import type { PermissionKey } from "@/lib/permissions";
import type { ReactNode } from "react";
import { debugLog } from "@/lib/debug";

interface RouteGuardProps {
  permission: PermissionKey | PermissionKey[];
  mode?: "all" | "any";
  redirectTo?: string;
  children: ReactNode;
  loadingFallback?: ReactNode;
}

export function RouteGuard({
  permission,
  mode = "all",
  redirectTo = "/acesso-negado",
  children,
  loadingFallback = null,
}: RouteGuardProps) {
  const router = useRouter();

  const { allowed, isLoading, isHydrated } = useScreenGuard(permission, mode);

  useEffect(() => {
    debugLog("route-guard", "rota avaliada", {
      permission,
      mode,
      allowed,
      isLoading,
      isHydrated,
      redirectTo,
    });

    if (isHydrated && !isLoading && !allowed) {
      router.replace(redirectTo);
    }
  }, [permission, mode, allowed, isLoading, isHydrated, redirectTo, router]);

  if (isLoading || !isHydrated) {
    return <>{loadingFallback}</>;
  }

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}
