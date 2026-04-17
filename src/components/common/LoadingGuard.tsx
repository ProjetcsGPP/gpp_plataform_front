// src/components/common/LoadingGuard.tsx
// P2 FIX: aguarda AMBAS as stores antes de liberar o shell visual.
// Antes só observava authStore.isLoading — a permissionsStore iniciava
// com isLoading:true e podia liberar o layout antes de /me/permissions/ resolver.
"use client";

import { useAuthStore }        from "@/store/authStore";
import { usePermissionsStore } from "@/store/permissionsStore";

export function LoadingGuard({ children }: { children: React.ReactNode }) {
  const authLoading  = useAuthStore((s) => s.isLoading);
  const permsLoading = usePermissionsStore((s) => s.isLoading);

  if (authLoading || permsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app-gradient">
        {/* Spinner CSS puro — não depende de icon font */}
        <div
          className="w-10 h-10 rounded-full border-4 border-white/30 border-t-white animate-spin"
          role="status"
          aria-label="Carregando..."
        />
      </div>
    );
  }

  return <>{children}</>;
}
