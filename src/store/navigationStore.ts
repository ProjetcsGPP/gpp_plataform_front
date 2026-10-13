// src/store/navigationStore.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ResolvedNavItem } from '@/types/navigation'
import type { AppContext } from '@/types/auth'

interface NavigationState {
  items: ResolvedNavItem[]
  appContext: AppContext | null
  role: string | null
  isLoading: boolean
  manifestVersion: number
  setNavigation: (
    appContext: AppContext,
    role: string,
    items: ResolvedNavItem[],
  ) => void
  beginLoading: (appContext: AppContext) => void
  clearNavigation: () => void
  bumpManifestVersion: () => void
}

export const useNavigationStore = create<NavigationState>()(
  devtools(
    (set, get) => ({
      items: [],
      appContext: null,
      role: null,
      isLoading: true,
      manifestVersion: 0,
      setNavigation: (appContext, role, items) =>
        set({ appContext, role, items, isLoading: false }, false, 'nav/set'),
      beginLoading: (appContext) =>
        set(
          { appContext, items: [], role: null, isLoading: true },
          false,
          `nav/loading/${appContext}`,
        ),
      clearNavigation: () =>
        set(
          { appContext: null, items: [], role: null, isLoading: false },
          false,
          'nav/clear',
        ),
      bumpManifestVersion: () =>
        set(
          { manifestVersion: get().manifestVersion + 1 },
          false,
          'nav/bumpVersion'
        ),
    }),
    { name: 'gpp-navigation-store' }
  )
)
