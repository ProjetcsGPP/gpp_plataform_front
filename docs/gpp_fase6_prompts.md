---
Repositório: ProjetcsGPP/gpp_plataform_front
Branch base: feat/novo_layout
Stack: Next.js 16.2.1 · React 19 · TypeScript · Tailwind CSS v4 · Zustand 5 · SWR 2 · pnpm
Convenção de branches: feat/fase-N-descricao criadas a partir de feat/novo_layout
---

# GPP Platform Front — Prompts de Implementação por Fase

---

## TITLE: GPP Platform Front Prompts de Implementação por Fase — FASE 6 Sidebar RBAC: Permission Manifest via JSON externo + DevTools de reload

### Objetivo

O manifest de navegação de cada app é lido de arquivos JSON na pasta `public/nav/`, editáveis sem reiniciar o servidor. O hook `usePermissions` carrega o JSON e o cruza com as `permission_keys` do backend. Um botão de reload (`<NavReloadButton>`) é renderizado no Sidebar exclusivamente em `development`, permitindo recarregar o manifest sem recarregar a página inteira.

---

### Pré-requisito

Fase 5 concluída.

---

### Implementação Detalhada

#### 6.1 — Criar os arquivos JSON em `public/nav/`

Criar a pasta `public/nav/` e um arquivo por app. Estes arquivos são a única fonte de dados de navegação — editá-los em desenvolvimento reflete imediatamente após clicar no botão de reload.

```
public/
  nav/
    PORTAL.json
    ACOES_PNGI.json
    CARGA_ORG_LOT.json
```

`public/nav/PORTAL.json`:

```json
{
  "items": [
    {
      "id": "dashboard",
      "label": "Dashboard",
      "icon": "dashboard",
      "href": "/portal/dashboard",
      "order": 1
    },
    {
      "id": "programas",
      "label": "Programas",
      "icon": "account_tree",
      "href": "/portal/programas",
      "order": 2,
      "permissionKey": "programas.view",
      "visibleWhenDenied": false,
      "children": [
        {
          "id": "programas-list",
          "label": "Listar Programas",
          "icon": "list",
          "href": "/portal/programas",
          "order": 1,
          "permissionKey": "programas.view"
        },
        {
          "id": "programas-new",
          "label": "Novo Programa",
          "icon": "add_circle",
          "href": "/portal/programas/novo",
          "order": 2,
          "permissionKey": "programas.create"
        }
      ]
    },
    {
      "id": "relatorios",
      "label": "Relatórios",
      "icon": "bar_chart",
      "href": "/portal/relatorios",
      "order": 3,
      "permissionKey": "relatorios.view",
      "visibleWhenDenied": true
    },
    {
      "id": "usuarios",
      "label": "Usuários",
      "icon": "group",
      "href": "/portal/usuarios",
      "order": 4,
      "permissionKey": "usuarios.manage",
      "visibleWhenDenied": false
    }
  ]
}
```

Criar `ACOES_PNGI.json` e `CARGA_ORG_LOT.json` com a mesma estrutura adaptada para cada app. Estes arquivos devem ser commitados no repositório — são configuração de UI, não dados sensíveis.

> **Atenção:** Adicionar `public/nav/*.json` ao `.gitignore` seria um erro — estes arquivos são fonte da verdade de navegação e devem ser versionados.

---

#### 6.2 — Criar `src/types/navigation.ts`

```typescript
// src/types/navigation.ts — arquivo novo

/** Estrutura de um item de menu conforme definido nos JSONs de public/nav/ */
export interface NavItemDefinition {
  id: string
  label: string
  icon: string
  href: string
  order: number
  /** Se presente, o backend deve incluir esta chave em `granted` para o item ser habilitado */
  permissionKey?: string
  /**
   * true  → item aparece desabilitado (cinza + tooltip) quando sem permissão
   * false → item é completamente oculto quando sem permissão (padrão)
   */
  visibleWhenDenied?: boolean
  children?: NavItemDefinition[]
}

/** Formato do JSON em public/nav/{APP}.json */
export interface NavManifestFile {
  items: NavItemDefinition[]
}

/** Item já resolvido após cruzar com permissões do backend */
export interface ResolvedNavItem extends NavItemDefinition {
  enabled: boolean
  visible: boolean
}

/** Resposta do endpoint GET /api/accounts/me/permissions/?app={APP} */
export interface PermissionsResponse {
  role: string
  granted: string[]
}
```

---

#### 6.3 — Criar `src/lib/resolveNavigation.ts`

Função pura — nenhuma dependência de React, stores ou I/O. Testável isoladamente.

```typescript
// src/lib/resolveNavigation.ts — arquivo novo
import type { NavItemDefinition, ResolvedNavItem } from '@/types/navigation'

function resolveItem(
  item: NavItemDefinition,
  grantedSet: Set<string>
): ResolvedNavItem | null {
  const hasPermission = item.permissionKey
    ? grantedSet.has(item.permissionKey)
    : true

  const visible = hasPermission || (item.visibleWhenDenied ?? false)
  if (!visible) return null

  const resolvedChildren = item.children
    ?.map((child) => resolveItem(child, grantedSet))
    .filter((c): c is ResolvedNavItem => c !== null)
    .sort((a, b) => a.order - b.order)

  return {
    ...item,
    children: resolvedChildren?.length ? resolvedChildren : undefined,
    enabled: hasPermission,
    visible: true,
  }
}

/**
 * Cruza o manifest com as permissões concedidas.
 *
 * @param manifest - Itens lidos do JSON de public/nav/
 * @param granted  - permission_keys retornados pelo backend (ou [] em fallback)
 */
export function resolveNavigation(
  manifest: NavItemDefinition[],
  granted: string[]
): ResolvedNavItem[] {
  const grantedSet = new Set(granted)
  return manifest
    .map((item) => resolveItem(item, grantedSet))
    .filter((item): item is ResolvedNavItem => item !== null)
    .sort((a, b) => a.order - b.order)
}

/**
 * Extrai todos os permissionKeys de um manifest (incluindo children).
 * Usado para gerar o fallback permissivo quando o backend ainda não está pronto.
 */
export function extractAllPermissionKeys(manifest: NavItemDefinition[]): string[] {
  return manifest.flatMap((item) => [
    ...(item.permissionKey ? [item.permissionKey] : []),
    ...(item.children ? extractAllPermissionKeys(item.children) : []),
  ])
}
```

---

#### 6.4 — Criar `src/store/navigationStore.ts`

Store separada da `authStore` — identidade e navegação são responsabilidades distintas.

```typescript
// src/store/navigationStore.ts — arquivo novo
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ResolvedNavItem } from '@/types/navigation'

interface NavigationState {
  items: ResolvedNavItem[]
  role: string | null
  isLoading: boolean
  /** Incrementado pelo NavReloadButton para forçar re-fetch do manifest */
  manifestVersion: number
  setNavigation: (role: string, items: ResolvedNavItem[]) => void
  setLoading: (loading: boolean) => void
  clearNavigation: () => void
  /** Incrementa manifestVersion, forçando SWR a re-buscar o JSON */
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
        set({ manifestVersion: get().manifestVersion + 1 }, false, 'nav/bumpVersion'),
    }),
    { name: 'gpp-navigation-store' }
  )
)
```

> O campo `manifestVersion` é a chave do reload: quando incrementado, a SWR key muda e o fetch do JSON é disparado novamente — sem `window.location.reload()`.

---

#### 6.5 — Criar `src/hooks/usePermissions.ts`

```typescript
// src/hooks/usePermissions.ts — arquivo novo
'use client'

import useSWR from 'swr'
import { useEffect } from 'react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useNavigationStore } from '@/store/navigationStore'
import { resolveNavigation, extractAllPermissionKeys } from '@/lib/resolveNavigation'
import type { NavManifestFile, PermissionsResponse } from '@/types/navigation'
import type { AppContext } from '@/types/auth'

/** Busca o manifest JSON de public/nav/ — sem cache de módulo, lê sempre do disco */
const fetchManifest = (url: string): Promise<NavManifestFile> =>
  fetch(url, { cache: 'no-store' }).then((r) => {
    if (!r.ok) throw new Error(`Manifest não encontrado: ${url}`)
    return r.json()
  })

/** Busca as permissões concedidas do backend */
const fetchPermissions = (url: string): Promise<PermissionsResponse> =>
  api.get<PermissionsResponse>(url).then((r) => r.data)

export function usePermissions(appContext: AppContext) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const manifestVersion = useNavigationStore((s) => s.manifestVersion)
  const setNavigation = useNavigationStore((s) => s.setNavigation)
  const setLoading = useNavigationStore((s) => s.setLoading)

  // SWR key inclui manifestVersion — ao incrementar, re-fetcha o JSON
  const manifestKey = `/nav/${appContext}.json?v=${manifestVersion}`

  const { data: manifestData, isLoading: manifestLoading } = useSWR<NavManifestFile>(
    manifestKey,
    fetchManifest,
    {
      revalidateOnFocus: false,
      // Em produção, cache por 5 min; em dev, sempre fresco
      dedupingInterval: process.env.NODE_ENV === 'development' ? 0 : 5 * 60 * 1000,
    }
  )

  const { data: permissionsData, isLoading: permissionsLoading } = useSWR<PermissionsResponse>(
    isAuthenticated && manifestData
      ? `/api/accounts/me/permissions/?app=${appContext}`
      : null,
    fetchPermissions,
    {
      dedupingInterval: 2 * 60 * 1000,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  )

  useEffect(() => {
    if (!manifestData) return

    const manifest = manifestData.items
    const granted = permissionsData?.granted
      // Fallback permissivo: backend ainda não pronto → todos os itens habilitados
      ?? extractAllPermissionKeys(manifest)

    const role = permissionsData?.role ?? 'UNKNOWN'
    const resolved = resolveNavigation(manifest, granted)
    setNavigation(role, resolved)
  }, [manifestData, permissionsData, setNavigation])

  useEffect(() => {
    setLoading(manifestLoading || permissionsLoading)
  }, [manifestLoading, permissionsLoading, setLoading])
}
```

---

#### 6.6 — Criar `src/components/dev/NavReloadButton.tsx`

Este componente só existe em `process.env.NODE_ENV === 'development'`. O Next.js faz tree-shaking do bloco `if (process.env.NODE_ENV !== 'development') return null` em build de produção — o componente não aparece no bundle final.

```typescript
// src/components/dev/NavReloadButton.tsx — arquivo novo
'use client'

import { useNavigationStore } from '@/store/navigationStore'

/**
 * Botão de reload do manifest de navegação.
 * APENAS em development — removido automaticamente em produção pelo tree-shaking.
 */
export function NavReloadButton() {
  // Guard de produção: garantia dupla além do tree-shaking
  if (process.env.NODE_ENV !== 'development') return null

  const bumpManifestVersion = useNavigationStore((s) => s.bumpManifestVersion)
  const isLoading = useNavigationStore((s) => s.isLoading)
  const manifestVersion = useNavigationStore((s) => s.manifestVersion)

  return (
    <button
      onClick={bumpManifestVersion}
      disabled={isLoading}
      title={`Recarregar manifest de navegação (v${manifestVersion})`}
      aria-label="Recarregar menu de navegação"
      className={[
        'flex items-center gap-1.5 w-full px-3 py-1.5 rounded-md',
        'text-xs font-medium',
        'border border-dashed',
        'text-orange-400 border-orange-400/40 bg-orange-400/5',
        'hover:bg-orange-400/15 hover:border-orange-400/70',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        'transition-all duration-150',
      ].join(' ')}
    >
      <span
        className={[
          'material-symbols-outlined text-[16px] leading-none',
          isLoading ? 'animate-spin' : '',
        ].join(' ')}
        aria-hidden="true"
      >
        {isLoading ? 'progress_activity' : 'refresh'}
      </span>
      <span>{isLoading ? 'Recarregando...' : 'Recarregar nav.json'}</span>
      <span className="ml-auto opacity-50 font-mono">v{manifestVersion}</span>
    </button>
  )
}
```

---

#### 6.7 — Adicionar `NavReloadButton` ao Sidebar

Inserir no rodapé do sidebar, antes do botão "Sair". O componente se auto-oculta em produção.

```typescript
// Sidebar.tsx — adicionar ao final do conteúdo da sidebar, antes do NavItem "Sair"
import { NavReloadButton } from '@/components/dev/NavReloadButton'

// No JSX, logo antes do botão de logout:
<div className="mt-auto px-2 pb-2 flex flex-col gap-1">
  {/* Separador visual de dev tools */}
  <NavReloadButton />
  <NavItem
    icon="logout"
    label="Sair"
    isExpanded={expanded}
    onClick={handleLogout}
  />
</div>
```

---

#### 6.8 — Integrar `usePermissions` no `AppThemeProvider`

```typescript
// AppThemeProvider.tsx — atualização da Fase 5
export function AppThemeProvider({ appContext, children }: AppThemeProviderProps) {
  useMe()
  usePermissions(appContext)  // Onda 2 — lê JSON + permissões backend

  useEffect(() => {
    document.body.setAttribute('data-app', appContext)
    return () => document.body.removeAttribute('data-app')
  }, [appContext])

  return <>{children}</>
}
```

---

### Testes — Fase 6

```typescript
// src/lib/__tests__/resolveNavigation.test.ts
import { describe, it, expect } from 'vitest'
import { resolveNavigation, extractAllPermissionKeys } from '../resolveNavigation'
import type { NavItemDefinition } from '@/types/navigation'

const manifest: NavItemDefinition[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: '/', order: 1 },
  { id: 'relatorios', label: 'Relatórios', icon: 'bar_chart', href: '/rel', order: 2,
    permissionKey: 'relatorios.view', visibleWhenDenied: true },
  { id: 'admin', label: 'Admin', icon: 'settings', href: '/admin', order: 3,
    permissionKey: 'admin.manage', visibleWhenDenied: false },
]

describe('resolveNavigation', () => {
  it('item sem permissionKey é sempre visível e habilitado', () => {
    const items = resolveNavigation(manifest, [])
    const d = items.find((i) => i.id === 'dashboard')
    expect(d?.enabled).toBe(true)
    expect(d?.visible).toBe(true)
  })

  it('visibleWhenDenied:true → aparece desabilitado sem permissão', () => {
    const items = resolveNavigation(manifest, [])
    const r = items.find((i) => i.id === 'relatorios')
    expect(r?.visible).toBe(true)
    expect(r?.enabled).toBe(false)
  })

  it('visibleWhenDenied:false → oculto sem permissão', () => {
    const items = resolveNavigation(manifest, [])
    expect(items.find((i) => i.id === 'admin')).toBeUndefined()
  })

  it('habilitado quando permissão está em granted', () => {
    const items = resolveNavigation(manifest, ['relatorios.view', 'admin.manage'])
    expect(items.find((i) => i.id === 'relatorios')?.enabled).toBe(true)
    expect(items.find((i) => i.id === 'admin')?.enabled).toBe(true)
  })

  it('extractAllPermissionKeys retorna todas as chaves do manifest', () => {
    const keys = extractAllPermissionKeys(manifest)
    expect(keys).toContain('relatorios.view')
    expect(keys).toContain('admin.manage')
    expect(keys).not.toContain(undefined)
  })
})
```

---

### Critérios de Aceite — Fase 6

- Pasta `public/nav/` com `PORTAL.json`, `ACOES_PNGI.json`, `CARGA_ORG_LOT.json`
- `src/types/navigation.ts` tipando `NavManifestFile`, `NavItemDefinition`, `ResolvedNavItem`, `PermissionsResponse`
- `src/lib/resolveNavigation.ts` — função pura com testes passando
- `src/store/navigationStore.ts` com campo `manifestVersion` e `bumpManifestVersion`
- `src/hooks/usePermissions.ts` — fetcha JSON + permissões backend, fallback permissivo quando backend indisponível
- Editar `public/nav/PORTAL.json`, clicar no botão → sidebar atualiza sem recarregar a página
- `<NavReloadButton>` visível em `pnpm dev`, invisível em `pnpm build && pnpm start`
- `AppThemeProvider` chama `usePermissions(appContext)`
- Testes de `resolveNavigation` passam: `pnpm test`
- `pnpm build` sem erros e sem referências ao `NavReloadButton` no bundle client

---

### Fluxo em Design Time

```
Você edita public/nav/PORTAL.json
         ↓
Clica no botão 🔄 "Recarregar nav.json" no Sidebar
         ↓
bumpManifestVersion() → manifestVersion: 0 → 1
         ↓
SWR key muda: /nav/PORTAL.json?v=1
         ↓
fetch() lê o arquivo atualizado (cache: 'no-store')
         ↓
resolveNavigation() processa novo manifest
         ↓
navigationStore.items atualiza
         ↓
Sidebar re-renderiza com novos itens ✓
```

---

## Resumo de Dependências entre Fases

```
FASE 1 — Zustand / logoutApp
FASE 2 — Temas CSS           (pode rodar em paralelo com Fase 4)
FASE 3 — TopBar / Sidebar
FASE 5 — useMe / hidratação
FASE 4 — Middleware          (pode rodar em paralelo com Fase 2)
FASE 6 — RBAC / usePermissions / NavReloadButton
```

---

## Convenção de Commits por Fase

```
feat/fase-1 — add Zustand authStore and contextual logoutApp
feat/fase-2 — add per-app CSS theme system with AppThemeProvider
feat/fase-3 — refactor TopBar and Sidebar to consume appContext
feat/fase-4 — add Next.js middleware for multi-cookie session guard
feat/fase-5 — add useMe hook with SWR and store hydration
feat/fase-6 — add RBAC permission manifest via external JSON and NavReloadButton devtool
```
