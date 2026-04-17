// src/components/common/LoadingGuard.tsx
"use client";

import { useAuthStore } from "@/store/authStore";

export function LoadingGuard({ children }: { children: React.ReactNode }) {
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) {
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
