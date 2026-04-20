"use client";

import { useNavigation } from "@/hooks/useNavigation";
import { useAuthStore } from "@/store/authStore";

interface NavigationProviderProps {
  children: React.ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  useNavigation(); // sem parâmetro — lê appContext internamente via authStore
  return <>{children}</>;
}
