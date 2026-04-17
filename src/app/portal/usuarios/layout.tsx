// src/app/portal/usuarios/layout.tsx
// P4 FIX: guard centralizado no layout — protege todas as sub-rotas de
// usuarios/ (usuarios/[id], usuarios/novo, etc.) sem precisar repetir
// RouteGuard em cada page.tsx.
'use client'

import { RouteGuard }  from '@/components/common/RouteGuard'
import { PERMISSIONS } from '@/lib/permissions'

export default function UsuariosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RouteGuard permission={PERMISSIONS.USER_VIEW}>
      {children}
    </RouteGuard>
  )
}
