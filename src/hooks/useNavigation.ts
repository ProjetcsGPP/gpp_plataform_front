// src/hooks/useNavigation.ts
'use client'

import { useEffect } from 'react'
import useSWR from 'swr'

import { useNavigationStore } from '@/store/navigationStore'
import { useMePermissions } from '@/hooks/useMe'
import { resolveNavigation } from '@/lib/resolveNavigation'
import type { AppContext } from '@/types/auth'
import type { NavManifestFile } from '@/types/navigation'

const APP_NAV_MAP: Record<AppContext, string> = {
  ACOES_PNGI:    '/nav/ACOES_PNGI.json',
  PORTAL:        '/nav/PORTAL.json',
  CARGA_ORG_LOT: '/nav/CARGA_ORG_LOT.json',
}

const fetcher = (url: string): Promise<NavManifestFile> =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`Manifest não encontrado: ${url}`)
    return r.json()
  })

export function useNavigation(appContext: AppContext) {
  const manifestVersion = useNavigationStore((s) => s.manifestVersion)
  const setNavigation   = useNavigationStore((s) => s.setNavigation)
  const setLoading      = useNavigationStore((s) => s.setLoading)

  const manifestUrl = APP_NAV_MAP[appContext]

  const { data: manifest, isLoading: manifestLoading } = useSWR<NavManifestFile>(
    // manifestVersion na key força revalidação quando NavReloadButton é clicado
    [manifestUrl, manifestVersion],
    ([url]) => fetcher(url as string),
    { revalidateOnFocus: false }
  )

  const { granted, role, isLoading: permLoading } = useMePermissions()

  useEffect(() => {
    const loading = manifestLoading || permLoading
    setLoading(loading)

    if (loading || !manifest) return

    const resolved = resolveNavigation(manifest.items, granted)
    setNavigation(role ?? '', resolved)
  }, [manifest, manifestLoading, granted, role, permLoading, setNavigation, setLoading])
}
