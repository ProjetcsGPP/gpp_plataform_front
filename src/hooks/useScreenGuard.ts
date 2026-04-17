// src/hooks/useScreenGuard.ts
// Guard de nível de tela: retorna se o usuário pode acessar uma tela
// com base em uma ou mais permissões.
//
// Uso:
//   const { allowed, isLoading } = useScreenGuard('user.view')
//   const { allowed } = useScreenGuard(['user.view', 'user.change'], 'any')
//
// Regra: o componente/rota deve exibir loading enquanto isLoading=true,
// e redirecionar ou mostrar acesso negado quando allowed=false.
"use client";

import { usePermissions } from "@/hooks/usePermissions";

type MatchMode = "all" | "any";

/**
 * Verifica se o usuário tem acesso a uma tela com base em permissões.
 *
 * @param permissions - Permissão única ou lista de permissões a verificar
 * @param mode        - 'all' exige todas; 'any' basta uma (padrão: 'all')
 */
export function useScreenGuard(
  permissions: string | string[],
  mode: MatchMode = "all",
): { allowed: boolean; isLoading: boolean; isHydrated: boolean } {
  const { can, isLoading, isHydrated } = usePermissions();

  const keys = Array.isArray(permissions) ? permissions : [permissions];

  const allowed = isHydrated
    ? mode === "all"
      ? keys.every((p) => can(p))
      : keys.some((p) => can(p))
    : false;

  return { allowed, isLoading, isHydrated };
}
