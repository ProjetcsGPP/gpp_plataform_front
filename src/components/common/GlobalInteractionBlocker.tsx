"use client";

import { Loader2 } from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import { useNavigationStore } from "@/store/navigationStore";
import { useNetworkActivityStore } from "@/store/networkActivityStore";

export function GlobalInteractionBlocker() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigationLoading = useNavigationStore((state) => state.isLoading);
  const pendingRequests = useNetworkActivityStore(
    (state) => state.pendingRequests,
  );
  const blocked = pendingRequests > 0 || (isAuthenticated && navigationLoading);

  if (!blocked) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex cursor-wait items-center justify-center bg-slate-950/20 backdrop-blur-[1px]"
      role="status"
      aria-live="polite"
      aria-label="Aguarde. Carregando informações."
    >
      <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-xl ring-1 ring-slate-200">
        <Loader2 className="size-5 animate-spin text-app-primary" aria-hidden="true" />
        Aguarde, carregando informações...
      </div>
    </div>
  );
}
