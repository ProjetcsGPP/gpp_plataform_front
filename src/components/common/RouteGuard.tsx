// src/components/common/RouteGuard.tsx
// Guard de rota: redireciona para /acesso-negado se o usuário não tiver
// a permissão necessária para acessar a tela.
//
// Deve ser usado em layouts de sub-rotas de cada app_context.
//
// Uso (em um layout.tsx de rota protegida):
//   export default function UsuariosLayout({ children }) {
//     return (
//       <RouteGuard permission="usuarios.view">
//         {children}
//       </RouteGuard>
//     )
//   }
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useScreenGuard } from "@/hooks/useScreenGuard";
import type { ReactNode } from "react";

interface RouteGuardProps {
  /** Permissão requerida para acessar a rota */
  permission: string;
  /** Rota de redirecionamento ao negar acesso (padrão: '/acesso-negado') */
  redirectTo?: string;
  children: ReactNode;
  /** Renderizado enquanto as permissões estão carregando */
  loadingFallback?: ReactNode;
}

export function RouteGuard({
  permission,
  redirectTo = "/acesso-negado",
  children,
  loadingFallback = null,
}: RouteGuardProps) {
  const router = useRouter();
  const { allowed, isLoading, isHydrated } = useScreenGuard(permission);

  useEffect(() => {
    // Só redireciona após a store estar hidratada (evita flash de redirect)
    if (isHydrated && !allowed) {
      router.replace(redirectTo);
    }
  }, [isHydrated, allowed, redirectTo, router]);

  // Enquanto carrega ou ainda não hidratou: mostra fallback
  if (isLoading || !isHydrated) return <>{loadingFallback}</>;

  // Não renderiza conteúdo se negado (o redirect está acontecendo)
  if (!allowed) return null;

  return <>{children}</>;
}
