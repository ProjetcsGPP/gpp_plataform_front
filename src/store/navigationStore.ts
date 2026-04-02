// src/store/navigationStore.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ResolvedNavItem } from '@/types/navigation'

interface NavigationState {
  items: ResolvedNavItem[]
  role: string | null
  isLoading: boolean
  manifestVersion: number
  setNavigation: (role: string, items: ResolvedNavItem[]) => void
  setLoading: (loading: boolean) => void
  clearNavigation: () => void
  bumpManifestVersion: () => void
}

export const useNavigationStore = create<NavigationState>()(
  devtools(
    (set, get) => ({
      items: [],
      role: null,
      isLoading: true,
      manifestVersion: 0,
      setNavigation: (role, items) =>
        set({ role, items, isLoading: false }, false, 'nav/set'),
      setLoading: (isLoading) =>
        set({ isLoading }, false, 'nav/setLoading'),
      clearNavigation: () =>
        set({ items: [], role: null, isLoading: true }, false, 'nav/clear'),
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
