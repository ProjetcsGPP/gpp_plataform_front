// src/components/common/AuthProvider.tsx
// AuthProvider é um wrapper puro de contexto.
// A hidratação de useMe, usePermissionsHydrator e useVersionPolling
// é responsabilidade exclusiva do AuthHydrator, que é montado
// explicitamente nos layouts autenticados.
// Manter useMe() aqui causava dupla instância SWR no mesmo cache key
// e race condition no useEffect de setUser/setAuthzVersion.
"use client";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return <>{children}</>;
}
