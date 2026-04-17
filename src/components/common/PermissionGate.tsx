// src/components/common/PermissionGate.tsx
// Versão avançada de <Can> com suporte a múltiplas permissões,
// modo 'all'/'any' e fallback configurável.
//
// Uso:
//   // Requer UMA das permissões (any):
//   <PermissionGate permissions={['user.view', 'user.change']} mode="any">
//     <PainelDeUsuarios />
//   </PermissionGate>
//
//   // Requer TODAS as permissões (all):
//   <PermissionGate permissions={['relatorio.view', 'relatorio.export']}>
//     <BotaoExportar />
//   </PermissionGate>
//
//   // Com skeleton durante carregamento:
//   <PermissionGate permissions="user.view" loadingFallback={<Skeleton />}>
//     <TabelaUsuarios />
//   </PermissionGate>
"use client";

import { useScreenGuard } from "@/hooks/useScreenGuard";
import type { ReactNode } from "react";

interface PermissionGateProps {
  /** Permissão única ou array de permissões */
  permissions: string | string[];
  /**
   * 'all' → exige todas as permissões listadas (padrão)
   * 'any' → basta uma das permissões
   */
  mode?: "all" | "any";
  /** Renderizado quando o acesso é concedido */
  children: ReactNode;
  /** Renderizado quando o acesso é negado (opcional) */
  fallback?: ReactNode;
  /** Renderizado enquanto as permissões ainda estão carregando */
  loadingFallback?: ReactNode;
}

export function PermissionGate({
  permissions,
  mode = "all",
  children,
  fallback = null,
  loadingFallback = null,
}: PermissionGateProps) {
  const { allowed, isLoading } = useScreenGuard(permissions, mode);

  if (isLoading) return <>{loadingFallback}</>;
  return allowed ? <>{children}</> : <>{fallback}</>;
}
