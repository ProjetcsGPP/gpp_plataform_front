// src/components/common/NavigationLoader.tsx
'use client'

import { useNavigation } from '@/hooks/useNavigation'
import type { AppContext } from '@/types/auth'

interface NavigationLoaderProps {
  appContext: AppContext
}

export function NavigationLoader({ appContext }: NavigationLoaderProps) {
  useNavigation(appContext)
  return null
}
