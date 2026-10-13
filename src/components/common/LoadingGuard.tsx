"use client";

import { useAuthStore } from "@/store/authStore";
import { usePermissionsStore } from "@/store/permissionsStore";
import { debugLog } from "@/lib/debug";

export function LoadingGuard({ children }: { children: React.ReactNode }) {
  const authLoading = useAuthStore((s) => s.isLoading);
  const permsLoading = usePermissionsStore((s) => s.isLoading);

  const loading = authLoading || permsLoading;

  debugLog("loading-guard", "estado atualizado", {
    authLoading,
    permsLoading,
    loading,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app-gradient">
        <div
          className="w-10 h-10 rounded-full border-4 border-white/30 border-t-white animate-spin"
          role="status"
          aria-label="Carregando..."
        />
      </div>
    );
  }

  debugLog("loading-guard", "liberando shell");

  return <>{children}</>;
}
