// src/components/common/AuthHydrator.tsx
// Componente client-side invisível que monta os três hooks de hidratação
// no layout autenticado. Deve ser renderizado ANTES do LoadingGuard para
// que os hooks estejam ativos enquanto o spinner está sendo exibido.
// P3 FIX: garante que usePermissionsHydrator e useVersionPolling estejam
// sempre montados nos layouts autenticados.
'use client'

import { useMe }                  from '@/hooks/useMe'
import { usePermissionsHydrator } from '@/hooks/usePermissionsHydrator'
import { useVersionPolling }      from '@/hooks/useVersionPolling'

export function AuthHydrator() {
  useMe()
  usePermissionsHydrator()
  useVersionPolling()
  return null
}
