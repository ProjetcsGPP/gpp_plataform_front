"use client";

import { useNavigation } from "@/hooks/useNavigation";
import { useAuthStore } from "@/store/authStore";

interface NavigationProviderProps {
  children: React.ReactNode;
}

/**
 * Componente interno que inicializa a navegação.
 * Separado para garantir que useNavigation() seja sempre chamado
 * na mesma ordem de hooks — nunca condicionalmente.
 */
function NavigationInitializer() {
  useNavigation();
  return null;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <>
      {isAuthenticated && <NavigationInitializer />}
      {children}
    </>
  );
}
