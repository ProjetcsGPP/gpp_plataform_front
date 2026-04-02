# GPP Platform Front — Prompts de Implementação por Fase

> **Repositório:** `ProjetcsGPP/gpp_plataform_front`
> **Branch base:** `feat/novo_layout`
> **Stack:** Next.js 16.2.1 · React 19 · TypeScript · Tailwind CSS v4 · Zustand 5 · SWR 2 · `pnpm`
> **Convenção de branches:** `feat/fase-N-descricao` criada a partir de `feat/novo_layout`

---

## FASE 1 — Zustand Store + `logoutApp` por aplicação

### Objetivo
Instalar o Zustand (já está no `package.json`, confirmar se está em `node_modules`), criar a store de autenticação global e corrigir todos os pontos do código que chamam `logout()` genérico, substituindo pela função `logoutApp(slug)` contextualizada por aplicação.

### Contexto do Projeto

#### Arquivos relevantes existentes

**`src/lib/auth.ts`** — contém as funções de autenticação atuais. Problemas identificados:
- Exporta uma função `logout()` genérica que é chamada por múltiplas apps
- Importa `Switch` de `next/navigation` (import desnecessário/morto)
- Não possui `logoutApp(slug: string)` contextualizado

**`src/app/acoes-pngi/dashboard/page.tsx`** — chama `logout()` genérico + redireciona manualmente.

**`src/app/carga-org-lot/dashboard/page.tsx`** — mesmo problema: `import { logout } from "@/lib/auth"` + `logout()` + `router.push('/carga-org-lot/login')`.

**`src/app/portal/dashboard/page.tsx`** — verificar se também usa `logout()` e corrigir.

**`package.json`** — `zustand: "^5.0.12"` já está em `dependencies`. Verificar se está instalado com `pnpm list zustand`. Se não, rodar `pnpm install`.

#### Tipo `AppContext` já existente

O backend retorna no campo `app_context` da resposta `/api/accounts/me/` um dos seguintes valores string: `"PORTAL"`, `"ACOES_PNGI"`, `"CARGA_ORG_LOT"`. Isso deve virar um union type TypeScript.

### Implementação Detalhada

#### 1.1 — Verificar e instalar dependência

```bash
pnpm list zustand
# Se não aparecer como instalado:
pnpm install
```

#### 1.2 — Criar `src/types/auth.ts`

Crie o arquivo `src/types/auth.ts` com o conteúdo abaixo. **Este arquivo não existia antes — é uma criação.**

```typescript
// src/types/auth.ts

/**
 * Valores retornados pelo backend no campo app_context.
 * Adicionasr novos apps aqui quando criados no backend.
 */
export type AppContext = 'PORTAL' | 'ACOES_PNGI' | 'CARGA_ORG_LOT'

/**
 * Resposta do endpoint GET /api/accounts/me/
 * Expandir conforme backend evoluir.
 */
export interface MeResponse {
  id: number
  username: string
  name: string
  email: string
  app_context: AppContext
  apps: AppContext[]
}

/**
 * Mapeamento de cada app para seu slug de logout e rota de login.
 * Utilizado por logoutApp() e pelo TopBar.
 */
export const APP_CONFIG: Record<AppContext, { slug: string; loginPath: string; label: string }> = {
  PORTAL:        { slug: 'portal',        loginPath: '/portal/login',        label: 'Portal GPP' },
  ACOES_PNGI:    { slug: 'acoes-pngi',    loginPath: '/acoes-pngi/login',    label: 'Ações PNGI' },
  CARGA_ORG_LOT: { slug: 'carga-org-lot', loginPath: '/carga-org-lot/login', label: 'Carga Org/Lot' },
}
```

#### 1.3 — Atualizar `src/lib/auth.ts`

Substituir o conteúdo do arquivo mantendo tudo que já existe, adicionando `logoutApp` e removendo o import morto de `Switch`:

- Remover: `import { Switch } from 'next/navigation'` (ou qualquer import de `Switch`)
- Manter: `loginApp`, `getSession`, `checkAuth` e demais funções existentes — **não remover nada além do import morto**
- Adicionar ao final do arquivo:

```typescript
// Adicionar import no topo do arquivo (junto aos imports existentes)
import type { AppContext } from '@/types/auth'
import { APP_CONFIG } from '@/types/auth'

/**
 * Faz logout apenas da aplicação especificada.
 * NÃO encerra sessões de outras apps.
 * 
 * @param appContext - Contexto da app que está fazendo logout
 * @returns Promise<void>
 */
export async function logoutApp(appContext: AppContext): Promise<void> {
  const { slug } = APP_CONFIG[appContext]
  try {
    await fetch(`/api/accounts/logout/${slug}/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    // Silencia erro de rede — o redirect acontece de qualquer forma
    console.warn(`[logoutApp] Falha ao chamar endpoint de logout para ${slug}:`, error)
  }
}
```

> **ATENÇÃO:** Se o endpoint de logout do backend ainda é `/api/accounts/logout/` (sem o slug), manter a URL atual e ajustar quando o backend expor o endpoint por app. Neste caso, `logoutApp` pode chamar o endpoint genérico por ora, mas deve ser o único ponto de chamada no frontend.

#### 1.4 — Criar `src/store/authStore.ts`

**Arquivo novo — não existe no projeto.** Criar em `src/store/authStore.ts`:

```typescript
// src/store/authStore.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { AppContext, MeResponse } from '@/types/auth'

interface AuthState {
  // ── Estado ────────────────────────────────────────────────
  user: MeResponse | null
  appContext: AppContext | null
  isAuthenticated: boolean
  isLoading: boolean

  // ── Ações ─────────────────────────────────────────────────
  /**
   * Chamado após login bem-sucedido ou após GET /api/accounts/me/ retornar 200.
   */
  setUser: (user: MeResponse, appContext: AppContext) => void

  /**
   * Chamado após logout bem-sucedido. Limpa todo o estado de auth.
   */
  clearAuth: () => void

  /**
   * Controla o estado de carregamento inicial (enquanto /me está sendo chamado).
   */
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      user: null,
      appContext: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user, appContext) =>
        set(
          { user, appContext, isAuthenticated: true, isLoading: false },
          false,
          'auth/setUser'
        ),

      clearAuth: () =>
        set(
          { user: null, appContext: null, isAuthenticated: false, isLoading: false },
          false,
          'auth/clearAuth'
        ),

      setLoading: (isLoading) =>
        set({ isLoading }, false, 'auth/setLoading'),
    }),
    { name: 'gpp-auth-store' }
  )
)
```

> A opção `devtools` com `name: 'gpp-auth-store'` permite inspecionar o estado no Redux DevTools do browser durante desenvolvimento.

#### 1.5 — Corrigir `src/app/acoes-pngi/dashboard/page.tsx`

Substituir as linhas que usam `logout()` genérico:

**Antes:**
```typescript
import { logout } from "@/lib/auth"
// ...
await logout()
router.push('/acoes-pngi/login')
```

**Depois:**
```typescript
import { logoutApp } from "@/lib/auth"
import { useAuthStore } from "@/store/authStore"
// ...
const clearAuth = useAuthStore((s) => s.clearAuth)
// ...
await logoutApp('ACOES_PNGI')
clearAuth()
router.push('/acoes-pngi/login')
```

#### 1.6 — Corrigir `src/app/carga-org-lot/dashboard/page.tsx`

Mesma correção:

**Antes:**
```typescript
import { logout } from "@/lib/auth"
// ...
await logout(); router.push("/carga-org-lot/login")
```

**Depois:**
```typescript
import { logoutApp } from "@/lib/auth"
import { useAuthStore } from "@/store/authStore"
// ...
const clearAuth = useAuthStore((s) => s.clearAuth)
// ...
await logoutApp('CARGA_ORG_LOT')
clearAuth()
router.push('/carga-org-lot/login')
```

#### 1.7 — Verificar e corrigir `src/app/portal/dashboard/page.tsx`

Buscar por `logout()` no arquivo. Se encontrado, aplicar a mesma correção com `logoutApp('PORTAL')`.

### Testes — Fase 1

Criar o arquivo `src/store/__tests__/authStore.test.ts`:

```typescript
// src/store/__tests__/authStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../authStore'
import type { MeResponse } from '@/types/auth'

const mockUser: MeResponse = {
  id: 1,
  username: 'joao.silva',
  name: 'João Silva',
  email: 'joao@es.gov.br',
  app_context: 'PORTAL',
  apps: ['PORTAL', 'ACOES_PNGI'],
}

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reseta o store antes de cada teste
    useAuthStore.setState({
      user: null,
      appContext: null,
      isAuthenticated: false,
      isLoading: true,
    })
  })

  it('estado inicial deve ter user nulo e isLoading true', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.appContext).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.isLoading).toBe(true)
  })

  it('setUser deve autenticar o usuário corretamente', () => {
    useAuthStore.getState().setUser(mockUser, 'PORTAL')
    const state = useAuthStore.getState()
    expect(state.user).toEqual(mockUser)
    expect(state.appContext).toBe('PORTAL')
    expect(state.isAuthenticated).toBe(true)
    expect(state.isLoading).toBe(false)
  })

  it('clearAuth deve limpar todo o estado', () => {
    useAuthStore.getState().setUser(mockUser, 'PORTAL')
    useAuthStore.getState().clearAuth()
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.appContext).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('setLoading deve atualizar somente isLoading', () => {
    useAuthStore.getState().setUser(mockUser, 'PORTAL')
    useAuthStore.getState().setLoading(true)
    const state = useAuthStore.getState()
    expect(state.isLoading).toBe(true)
    // user não deve ter sido afetado
    expect(state.user).toEqual(mockUser)
  })
})
```

> Se o projeto ainda não tiver Vitest configurado, usar o setup mínimo:
> `pnpm add -D vitest @vitejs/plugin-react jsdom`
> Adicionar `"test": "vitest"` nos scripts do `package.json`.

### Critérios de Aceite — Fase 1

- [ ] `pnpm list zustand` retorna `zustand@5.x`
- [ ] `src/types/auth.ts` criado com `AppContext`, `MeResponse`, `APP_CONFIG`
- [ ] `src/store/authStore.ts` criado com `setUser`, `clearAuth`, `setLoading`
- [ ] `src/lib/auth.ts` possui `logoutApp(appContext)` e não possui import morto de `Switch`
- [ ] `acoes-pngi/dashboard/page.tsx` usa `logoutApp('ACOES_PNGI')` + `clearAuth()`
- [ ] `carga-org-lot/dashboard/page.tsx` usa `logoutApp('CARGA_ORG_LOT')` + `clearAuth()`
- [ ] `portal/dashboard/page.tsx` usa `logoutApp('PORTAL')` + `clearAuth()` (se aplicável)
- [ ] Testes do store passam: `pnpm test`
- [ ] `pnpm build` sem erros de TypeScript

---

## FASE 2 — Sistema de Temas CSS por Aplicação

### Objetivo
Implementar um sistema de temas visuais por aplicação utilizando CSS custom properties ativadas por `data-app` no `<body>`, expandir os tokens do Tailwind v4 com classes semânticas (`bg-app-primary`, `text-app-primary-text` etc.) e criar o `AppThemeProvider` que aplica o tema correto automaticamente nos layouts de cada app.

### Pré-requisito
**Fase 1 concluída** — `src/types/auth.ts` com `AppContext` deve existir.

### Contexto do Projeto

**`src/app/globals.css`** — Tailwind v4 com `@theme {}`. Já possui:
- `.authority-gradient` → gradiente azul escuro do Portal
- `.bg-app-gradient` → gradiente azul claro (usado como fundo genérico)
- Tokens de cores no `@theme {}` baseados no tema "Comando Solar"

**Problema atual:** as cores de cada app estão hardcoded em valores hexadecimais espalhados nos componentes. Não existe mecanismo de tema por app.

**`src/app/layout.tsx`** — Root layout. Fontes Inter + Manrope via `next/font/google`, Material Symbols e Prodest Icons via `<link>`. Não alterar este arquivo nesta fase.

**Tailwind v4** — usa `@theme {}` para registrar tokens. Para tokens que devem variar por app (resolvidos em runtime por CSS custom properties), **não** registrar no `@theme` — registrar como aliases de variáveis CSS em `@theme inline` ou direto no CSS. Classes arbitrárias Tailwind como `bg-[var(--app-primary)]` funcionam, mas é melhor registrar os tokens semânticos no `@theme` apontando para as variáveis.

### Implementação Detalhada

#### 2.1 — Adicionar tokens semânticos de app no `globals.css`

Adicionar ao final de `src/app/globals.css`, **após a seção 10 (UTILITIES COMANDO SOLAR)**:

```css
/* =========================================================================
   11. TOKENS SEMÂNTICOS POR APLICAÇÃO
   Ativados via [data-app="NOME"] no <body>.
   Componentes usam var(--app-*) ou as classes Tailwind bg-app-* / text-app-*
   ========================================================================= */

/* ── Valores padrão (fallback quando nenhum data-app está ativo) ── */
:root {
  --app-primary:         #00244a;
  --app-primary-hover:   #003a70;
  --app-primary-text:    #ffffff;
  --app-sidebar-bg:      #00244a;
  --app-topbar-bg:       #ffffff;
  --app-accent:          #1B3A6B;
  --app-accent-light:    #e8eef7;
  --app-bg-from:         #468BC4;
  --app-bg-to:           #3F93B8;
  --app-gradient:        linear-gradient(135deg, #f0f4fa 0%, #e8eef7 100%);
  --authority-gradient-app: linear-gradient(135deg, #00244a 0%, #1B3A6B 100%);
}

/* ── PORTAL ─────────────────────────────────────────────────────── */
[data-app="PORTAL"] {
  --app-primary:         #00244a;
  --app-primary-hover:   #003a70;
  --app-primary-text:    #ffffff;
  --app-sidebar-bg:      #00244a;
  --app-topbar-bg:       #ffffff;
  --app-accent:          #1B3A6B;
  --app-accent-light:    #e8eef7;
  --app-bg-from:         #468BC4;
  --app-bg-to:           #3F93B8;
  --app-gradient:        linear-gradient(135deg, #f0f4fa 0%, #e8eef7 100%);
  --authority-gradient-app: linear-gradient(135deg, #00244a 0%, #003a70 100%);
}

/* ── AÇÕES PNGI ──────────────────────────────────────────────────── */
[data-app="ACOES_PNGI"] {
  --app-primary:         #1a5c38;
  --app-primary-hover:   #144a2d;
  --app-primary-text:    #ffffff;
  --app-sidebar-bg:      #1a5c38;
  --app-topbar-bg:       #ffffff;
  --app-accent:          #2d7a50;
  --app-accent-light:    #e6f3ec;
  --app-bg-from:         #4aad78;
  --app-bg-to:           #2d8f5e;
  --app-gradient:        linear-gradient(135deg, #f0f7f3 0%, #e6f3ec 100%);
  --authority-gradient-app: linear-gradient(135deg, #1a5c38 0%, #2d7a50 100%);
}

/* ── CARGA ORG/LOT ───────────────────────────────────────────────── */
[data-app="CARGA_ORG_LOT"] {
  --app-primary:         #7b2d00;
  --app-primary-hover:   #5c2200;
  --app-primary-text:    #ffffff;
  --app-sidebar-bg:      #7b2d00;
  --app-topbar-bg:       #ffffff;
  --app-accent:          #a03d00;
  --app-accent-light:    #fdf0e8;
  --app-bg-from:         #c45c20;
  --app-bg-to:           #a03d00;
  --app-gradient:        linear-gradient(135deg, #fdf5f0 0%, #fdf0e8 100%);
  --authority-gradient-app: linear-gradient(135deg, #7b2d00 0%, #a03d00 100%);
}
```

#### 2.2 — Registrar tokens semânticos no `@theme` do `globals.css`

Adicionar dentro do bloco `@theme {}` existente (na seção 3 do arquivo), **logo após os tokens de fontes**:

```css
/* Tokens semânticos por app — resolvem para as CSS vars definidas em [data-app] */
--color-app-primary:         var(--app-primary);
--color-app-primary-hover:   var(--app-primary-hover);
--color-app-primary-text:    var(--app-primary-text);
--color-app-sidebar-bg:      var(--app-sidebar-bg);
--color-app-topbar-bg:       var(--app-topbar-bg);
--color-app-accent:          var(--app-accent);
--color-app-accent-light:    var(--app-accent-light);
```

> Isso gera automaticamente as classes Tailwind: `bg-app-primary`, `text-app-primary`, `text-app-primary-text`, `bg-app-sidebar-bg`, `bg-app-topbar-bg`, `bg-app-accent`, `bg-app-accent-light`, `border-app-primary` etc.

#### 2.3 — Atualizar `.authority-gradient` e `.bg-app-gradient` no `globals.css`

Substituir as definições hardcoded existentes (seção 10) pelas versões que usam as variáveis:

```css
/* Substituir as versões hardcoded existentes por estas: */
.authority-gradient {
  background: var(--authority-gradient-app);
}
.bg-app-gradient {
  background: linear-gradient(135deg, var(--app-bg-from) 0%, var(--app-bg-to) 100%);
}
```

> Manter as classes com os mesmos nomes — apenas trocar os valores fixos por variáveis. Componentes existentes que já usam essas classes NÃO precisam ser alterados.

#### 2.4 — Criar `src/components/common/AppThemeProvider.tsx`

**Arquivo novo — não existe no projeto.**

```typescript
// src/components/common/AppThemeProvider.tsx
'use client'

import { useEffect } from 'react'
import type { AppContext } from '@/types/auth'

interface AppThemeProviderProps {
  /** Contexto da app — define qual bloco [data-app] será aplicado no <body> */
  appContext: AppContext
  children: React.ReactNode
}

/**
 * Aplica o atributo data-app no <body> para ativar o tema CSS da aplicação.
 * Deve envolver o conteúdo do layout de cada app.
 * 
 * Nota: a hidratação da authStore (useMe) será adicionada na Fase 5.
 */
export function AppThemeProvider({ appContext, children }: AppThemeProviderProps) {
  useEffect(() => {
    document.body.setAttribute('data-app', appContext)

    // Cleanup: remove o atributo ao desmontar (ex: navegação entre apps no dev)
    return () => {
      document.body.removeAttribute('data-app')
    }
  }, [appContext])

  return <>{children}</>
}
```

#### 2.5 — Atualizar `src/app/portal/dashboard/layout.tsx`

Envolver o conteúdo com `AppThemeProvider`:

```typescript
// src/app/portal/dashboard/layout.tsx
import { AppThemeProvider } from '@/components/common/AppThemeProvider'
// ... manter todos os imports existentes

export default function PortalDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppThemeProvider appContext="PORTAL">
      {/* Manter exatamente o JSX existente aqui dentro */}
    </AppThemeProvider>
  )
}
```

#### 2.6 — Atualizar layouts das demais apps

Aplicar o mesmo padrão em:
- `src/app/acoes-pngi/dashboard/layout.tsx` (se existir) com `appContext="ACOES_PNGI"`
- `src/app/carga-org-lot/dashboard/layout.tsx` (se existir) com `appContext="CARGA_ORG_LOT"`

Se os layouts ainda não existirem, criar com estrutura mínima.

### Testes — Fase 2

Criar `src/components/common/__tests__/AppThemeProvider.test.tsx`:

```typescript
// src/components/common/__tests__/AppThemeProvider.test.tsx
import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { AppThemeProvider } from '../AppThemeProvider'

afterEach(() => {
  cleanup()
  document.body.removeAttribute('data-app')
})

describe('AppThemeProvider', () => {
  it('deve aplicar data-app="PORTAL" no body', () => {
    render(
      <AppThemeProvider appContext="PORTAL">
        <div>conteúdo</div>
      </AppThemeProvider>
    )
    expect(document.body.getAttribute('data-app')).toBe('PORTAL')
  })

  it('deve aplicar data-app="ACOES_PNGI" no body', () => {
    render(
      <AppThemeProvider appContext="ACOES_PNGI">
        <div>conteúdo</div>
      </AppThemeProvider>
    )
    expect(document.body.getAttribute('data-app')).toBe('ACOES_PNGI')
  })

  it('deve remover data-app do body ao desmontar', () => {
    const { unmount } = render(
      <AppThemeProvider appContext="PORTAL">
        <div>conteúdo</div>
      </AppThemeProvider>
    )
    unmount()
    expect(document.body.getAttribute('data-app')).toBeNull()
  })
})
```

### Critérios de Aceite — Fase 2

- [ ] Bloco `[data-app="PORTAL"]`, `[data-app="ACOES_PNGI"]`, `[data-app="CARGA_ORG_LOT"]` em `globals.css`
- [ ] Tokens `--color-app-*` registrados no `@theme {}`
- [ ] Classes `.authority-gradient` e `.bg-app-gradient` usam variáveis CSS (não valores fixos)
- [ ] `src/components/common/AppThemeProvider.tsx` criado
- [ ] Layouts das 3 apps envolvidos com `AppThemeProvider` + `appContext` correto
- [ ] Inspecionando o DOM no browser: `<body data-app="PORTAL">` ao acessar `/portal/dashboard`
- [ ] Visual: a sidebar e o topbar do Portal mantêm a cor azul escura (#00244a)
- [ ] Testes do provider passam: `pnpm test`
- [ ] `pnpm build` sem erros

---

## FASE 3 — `TopBar` e `Sidebar` orientados a `appContext`

### Objetivo
Refatorar `TopBar` e `Sidebar` para consumir o `appContext` via props e o `user` via Zustand store. O botão "Sair" de cada componente deve chamar `logoutApp(appContext)` + `clearAuth()` + redirecionar para o login da app correta. Remover botões de logout inline dos dashboards que serão movidos para o `TopBar`.

### Pré-requisitos
- **Fase 1 concluída** — `logoutApp`, `APP_CONFIG`, `useAuthStore` disponíveis
- **Fase 2 concluída** — classes `bg-app-primary`, `text-app-primary-text` etc. disponíveis

### Contexto dos Componentes

**`src/components/layout/TopBar.tsx`** — estado atual: recebe `title` e `titleMinor` como props estáticas. Não tem lógica de logout. Não exibe o nome do usuário. O botão de logout, se existir, não está funcional.

**`src/components/layout/Sidebar.tsx`** (ou similar) — possui `NavItem` para "Sair" que provavelmente chama `logout()` genérico ou não faz nada.

**`src/app/acoes-pngi/dashboard/page.tsx`** — ainda pode ter botão de logout inline (da Fase 1, já corrigido para `logoutApp`, mas o botão em si pode ser removido pois migra para o TopBar).

**`src/app/carga-org-lot/dashboard/page.tsx`** — mesmo caso.

### Implementação Detalhada

#### 3.1 — Atualizar tipos do `TopBar`

```typescript
// src/components/layout/TopBar.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { logoutApp } from '@/lib/auth'
import { APP_CONFIG } from '@/types/auth'
import type { AppContext } from '@/types/auth'

// Tipo atualizado — adicionar appContext
interface TopBarProps {
  titleMinor: string
  title: string
  appContext: AppContext   // NOVO — obrigatório
}
```

#### 3.2 — Implementar lógica de logout no `TopBar`

Dentro do componente `TopBar`, adicionar:

```typescript
export default function TopBar({ titleMinor, title, appContext }: TopBarProps) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  const firstName = user?.name?.split(' ')[0] ?? user?.username ?? ''

  async function handleLogout() {
    const { loginPath } = APP_CONFIG[appContext]
    await logoutApp(appContext)
    clearAuth()
    router.push(loginPath)
  }

  // ... manter o JSX existente, adicionando:
  // 1. firstName próximo ao avatar (se houver espaço visual)
  // 2. onClick={handleLogout} no botão de sair existente
  // 3. title={`Sair de ${APP_CONFIG[appContext].label}`} no botão
}
```

**NÃO redesenhar o componente** — apenas adicionar a lógica. Manter o JSX existente intacto e plugar as funções nos elementos já existentes.

#### 3.3 — Atualizar chamadas do `TopBar` nos layouts

Em `src/app/portal/dashboard/layout.tsx` e demais layouts, adicionar `appContext`:

```tsx
<TopBar
  title="Portal de Aplicações"
  titleMinor="SEGER/SUBGES/GPP"
  appContext="PORTAL"    {/* NOVO */}
/>
```

#### 3.4 — Atualizar o botão "Sair" da `Sidebar`

Localizar no `Sidebar.tsx` o `NavItem` ou elemento que representa "Sair". Substituir a chamada de logout:

```typescript
// Sidebar.tsx — adicionar props necessárias
interface SidebarProps {
  // ... props existentes
  appContext: AppContext   // NOVO
}

// Dentro do componente:
const router = useRouter()
const clearAuth = useAuthStore((s) => s.clearAuth)

async function handleLogout() {
  const { loginPath } = APP_CONFIG[appContext]
  await logoutApp(appContext)
  clearAuth()
  router.push(loginPath)
}

// No NavItem "Sair":
<NavItem
  icon="logout"
  label="Sair"
  isExpanded={expanded}
  onClick={handleLogout}
/>
```

#### 3.5 — Remover botões de logout inline dos dashboards

Após o `TopBar` ter o logout funcional, os botões inline nos dashboards devem ser removidos:

- `src/app/acoes-pngi/dashboard/page.tsx`: remover o `<Button>` de logout (o `import` de `logout`/`logoutApp`, o `useRouter` de logout e o botão em si, se o layout já tem `TopBar`)
- `src/app/carga-org-lot/dashboard/page.tsx`: mesma remoção
- Verificar `src/app/portal/dashboard/page.tsx`

### Testes — Fase 3

Criar `src/components/layout/__tests__/TopBar.test.tsx`:

```typescript
// src/components/layout/__tests__/TopBar.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TopBar from '../TopBar'
import { useAuthStore } from '@/store/authStore'
import * as authLib from '@/lib/auth'

// Mock do router
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

// Mock do logoutApp
vi.spyOn(authLib, 'logoutApp').mockResolvedValue()

describe('TopBar', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: 1, username: 'maria.souza', name: 'Maria Souza',
        email: 'maria@es.gov.br', app_context: 'PORTAL', apps: ['PORTAL'],
      },
      appContext: 'PORTAL',
      isAuthenticated: true,
      isLoading: false,
    })
  })

  it('deve renderizar o título corretamente', () => {
    render(<TopBar title="Portal GPP" titleMinor="SEGER" appContext="PORTAL" />)
    expect(screen.getByText('Portal GPP')).toBeInTheDocument()
    expect(screen.getByText('SEGER')).toBeInTheDocument()
  })

  it('deve chamar logoutApp com o appContext correto ao clicar em sair', async () => {
    render(<TopBar title="Portal GPP" titleMinor="SEGER" appContext="PORTAL" />)
    const logoutBtn = screen.getByRole('button', { name: /sair/i })
    fireEvent.click(logoutBtn)
    await waitFor(() => {
      expect(authLib.logoutApp).toHaveBeenCalledWith('PORTAL')
    })
  })

  it('deve exibir o primeiro nome do usuário autenticado', () => {
    render(<TopBar title="Portal GPP" titleMinor="SEGER" appContext="PORTAL" />)
    expect(screen.getByText('Maria')).toBeInTheDocument()
  })
})
```

### Critérios de Aceite — Fase 3

- [ ] `TopBar` recebe `appContext: AppContext` como prop obrigatória
- [ ] Clicar em "Sair" no `TopBar` chama `logoutApp(appContext)` + `clearAuth()` + redirect correto
- [ ] `Sidebar` possui botão "Sair" funcional com mesma lógica
- [ ] Layouts das 3 apps passam `appContext` para o `TopBar`
- [ ] Dashboards não possuem mais botões de logout inline duplicados
- [ ] Nome do usuário (primeiro nome) visível no `TopBar` quando `user` está na store
- [ ] Testes do `TopBar` passam: `pnpm test`
- [ ] `pnpm build` sem erros de TypeScript

---

## FASE 4 — Middleware Multi-Cookie por Aplicação

### Objetivo
Implementar o `middleware.ts` do Next.js para verificar a existência do cookie de sessão específico de cada aplicação (`gpp_session_{app}`), protegendo rotas de dashboard. Rotas não autenticadas devem redirecionar para o login da app correspondente com parâmetro de query informando o motivo.

### Pré-requisito
**Fase 1 concluída** — `APP_CONFIG` e `AppContext` disponíveis.
Esta fase é **independente das Fases 2, 3 e 5**.

### Contexto do Projeto

Verificar se existe `src/middleware.ts` ou `src/proxy.ts` no projeto. Se existir `src/proxy.ts` com lógica de proxy/middleware, analisar o conteúdo antes de substituir.

O backend define cookies de sessão com o nome `gpp_session_{slug}` para cada app (ex: `gpp_session_portal`, `gpp_session_acoes-pngi`). O middleware deve verificar esses cookies.

> **ATENÇÃO:** Confirmar com o backend qual é exatamente o nome do cookie de sessão antes de implementar. Se o nome for diferente, ajustar o `COOKIE_NAME` abaixo.

### Implementação Detalhada

#### 4.1 — Criar `src/middleware.ts`

**Se `src/proxy.ts` existir**, ler seu conteúdo antes. Se ele apenas faz proxy de requisições API, pode ser mantido separadamente ou integrado. Criar `src/middleware.ts`:

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server'

/**
 * Mapeamento de prefixo de rota para o cookie de sessão correspondente.
 * Chave: prefixo do pathname (sem barra final)
 * Valor: nome exato do cookie de sessão definido pelo backend
 */
const ROUTE_COOKIE_MAP: Record<string, string> = {
  '/portal':        'gpp_session_portal',
  '/acoes-pngi':    'gpp_session_acoes-pngi',
  '/carga-org-lot': 'gpp_session_carga-org-lot',
}

/**
 * Mapeamento de prefixo de rota para a página de login correspondente.
 */
const ROUTE_LOGIN_MAP: Record<string, string> = {
  '/portal':        '/portal/login',
  '/acoes-pngi':    '/acoes-pngi/login',
  '/carga-org-lot': '/carga-org-lot/login',
}

/**
 * Rotas que NÃO devem ser protegidas (públicas).
 * O middleware passa por elas sem verificar cookie.
 */
function isPublicRoute(pathname: string): boolean {
  const publicSuffixes = ['/login', '/api/', '/_next/', '/favicon', '/static']
  return publicSuffixes.some((suffix) => pathname.includes(suffix))
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Não processar rotas públicas
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Encontrar qual app corresponde a esta rota
  const appPrefix = Object.keys(ROUTE_COOKIE_MAP).find((prefix) =>
    pathname.startsWith(prefix)
  )

  // Rota não mapeada — deixar passar
  if (!appPrefix) {
    return NextResponse.next()
  }

  const cookieName = ROUTE_COOKIE_MAP[appPrefix]
  const loginPath = ROUTE_LOGIN_MAP[appPrefix]
  const sessionCookie = request.cookies.get(cookieName)

  // Cookie ausente → redirecionar para login da app
  if (!sessionCookie?.value) {
    const loginUrl = new URL(loginPath, request.url)
    loginUrl.searchParams.set('reason', 'session_expired')
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  /**
   * Aplicar middleware apenas nas rotas de dashboard das apps.
   * Excluir explicitamente: API routes, arquivos estáticos, _next.
   */
  matcher: [
    '/portal/dashboard/:path*',
    '/acoes-pngi/dashboard/:path*',
    '/carga-org-lot/dashboard/:path*',
  ],
}
```

#### 4.2 — Tratamento do parâmetro `reason` nas páginas de login

Verificar se as páginas de login (`src/app/portal/login/page.tsx` etc.) já exibem alguma mensagem quando o usuário é redirecionado por sessão expirada. Se não, adicionar leitura do `searchParams`:

```typescript
// Exemplo em src/app/portal/login/page.tsx
// Adicionar leitura de searchParams (é um Server Component — pode ler diretamente)

interface LoginPageProps {
  searchParams: { reason?: string; redirect?: string }
}

export default function PortalLoginPage({ searchParams }: LoginPageProps) {
  const sessionExpired = searchParams.reason === 'session_expired'
  
  return (
    <LoginPage
      theme={portalTheme}
      sessionExpiredMessage={sessionExpired ? 'Sua sessão expirou. Faça login novamente.' : undefined}
    />
  )
}
```

> Se o componente `LoginPage` ainda não aceita `sessionExpiredMessage`, adicionar como prop opcional e exibir o alerta quando presente. Isso é opcional nesta fase — marcar como TODO se necessário.

### Testes — Fase 4

Criar `src/__tests__/middleware.test.ts`:

```typescript
// src/__tests__/middleware.test.ts
import { describe, it, expect } from 'vitest'
import { middleware } from '../middleware'
import { NextRequest } from 'next/server'

function makeRequest(pathname: string, cookies: Record<string, string> = {}): NextRequest {
  const url = `http://localhost:3000${pathname}`
  const req = new NextRequest(url)
  Object.entries(cookies).forEach(([name, value]) => {
    req.cookies.set(name, value)
  })
  return req
}

describe('middleware', () => {
  it('deve redirecionar para /portal/login quando cookie ausente', () => {
    const req = makeRequest('/portal/dashboard')
    const res = middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/portal/login')
    expect(res.headers.get('location')).toContain('reason=session_expired')
  })

  it('deve deixar passar quando cookie de portal está presente', () => {
    const req = makeRequest('/portal/dashboard', {
      'gpp_session_portal': 'valid-session-token',
    })
    const res = middleware(req)
    expect(res.status).toBe(200)
  })

  it('deve redirecionar acoes-pngi sem cookie correto', () => {
    // Tem cookie do portal mas não do acoes-pngi
    const req = makeRequest('/acoes-pngi/dashboard', {
      'gpp_session_portal': 'valid-session-token',
    })
    const res = middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/acoes-pngi/login')
  })

  it('deve deixar rotas de login passarem sem verificar cookie', () => {
    const req = makeRequest('/portal/login')
    const res = middleware(req)
    expect(res.status).toBe(200)
  })

  it('deve deixar rotas de API passarem', () => {
    const req = makeRequest('/api/accounts/me/')
    const res = middleware(req)
    expect(res.status).toBe(200)
  })
})
```

### Critérios de Aceite — Fase 4

- [ ] `src/middleware.ts` criado com `matcher` correto
- [ ] Acessar `/portal/dashboard` sem cookie redireciona para `/portal/login?reason=session_expired`
- [ ] Acessar `/acoes-pngi/dashboard` sem cookie redireciona para `/acoes-pngi/login?reason=session_expired`
- [ ] Cookie do portal NÃO protege rotas de outra app (sessões independentes)
- [ ] Rotas `/login` são públicas (não redirecionam)
- [ ] Rotas `/api/` não são interceptadas pelo middleware
- [ ] Testes do middleware passam: `pnpm test`
- [ ] `pnpm build` sem erros

---

## FASE 5 — Hidratação da Store e Hook `useMe`

### Objetivo
Criar o hook `useMe` com SWR para buscar os dados do usuário autenticado e hidratar a `authStore` automaticamente ao carregar qualquer página de dashboard. Garantir que o `TopBar` exiba o nome do usuário sem piscar (flash de conteúdo) e que erros 401 do Axios redirecionem para o login da app correta usando o `appContext` da store.

### Pré-requisitos
- **Fases 1, 2 e 3 concluídas**
- `useAuthStore` com `setUser`, `clearAuth`, `setLoading` disponíveis
- `AppThemeProvider` existente (será expandido)

### Contexto do Projeto

**`src/lib/api.ts`** — instância do Axios. Verificar se possui interceptor de resposta. Se tiver um handler genérico para 401, ele precisa ser contextualizado com o `appContext` da store.

**SWR** já está em `dependencies` do `package.json` (`"swr": "^2.4.1"`).

O endpoint de dados do usuário é `GET /api/accounts/me/`. Retorna o formato `MeResponse` definido em `src/types/auth.ts` (Fase 1).

### Implementação Detalhada

#### 5.1 — Criar `src/hooks/useMe.ts`

**Arquivo novo.**

```typescript
// src/hooks/useMe.ts
'use client'

import useSWR from 'swr'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import type { MeResponse } from '@/types/auth'

/**
 * Fetcher tipado para o SWR — usa a instância Axios configurada do projeto.
 */
const fetchMe = (url: string): Promise<MeResponse> =>
  api.get<MeResponse>(url).then((res) => res.data)

/**
 * Hook para buscar e cachear os dados do usuário autenticado.
 * 
 * - Faz GET /api/accounts/me/ usando SWR (cache automático, revalidação em foco)
 * - Hidrata a authStore com os dados recebidos
 * - Limpa a store em caso de erro (401 = sessão inválida)
 * - Cache de 5 minutos (dedupingInterval)
 * 
 * @returns { me, isLoading, isError }
 */
export function useMe() {
  const setUser = useAuthStore((s) => s.setUser)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const setLoading = useAuthStore((s) => s.setLoading)

  const { data, error, isLoading } = useSWR<MeResponse>(
    '/api/accounts/me/',
    fetchMe,
    {
      dedupingInterval: 5 * 60 * 1000,  // 5 minutos
      revalidateOnFocus: false,           // não revalidar ao trocar de aba
      shouldRetryOnError: false,          // não tentar novamente em 401
      onSuccess(data) {
        setUser(data, data.app_context)
      },
      onError() {
        clearAuth()
      },
    }
  )

  // Sincroniza isLoading da store com o estado do SWR
  useEffect(() => {
    setLoading(isLoading)
  }, [isLoading, setLoading])

  return {
    me: data ?? null,
    isLoading,
    isError: !!error,
  }
}
```

#### 5.2 — Integrar `useMe` no `AppThemeProvider`

Atualizar `src/components/common/AppThemeProvider.tsx` para chamar `useMe()`:

```typescript
// src/components/common/AppThemeProvider.tsx
'use client'

import { useEffect } from 'react'
import { useMe } from '@/hooks/useMe'
import type { AppContext } from '@/types/auth'

interface AppThemeProviderProps {
  appContext: AppContext
  children: React.ReactNode
}

export function AppThemeProvider({ appContext, children }: AppThemeProviderProps) {
  // Hidrata a store com os dados do usuário autenticado
  useMe()

  useEffect(() => {
    document.body.setAttribute('data-app', appContext)
    return () => {
      document.body.removeAttribute('data-app')
    }
  }, [appContext])

  return <>{children}</>
}
```

#### 5.3 — Atualizar interceptor 401 no `src/lib/api.ts`

Localizar o interceptor de resposta do Axios. Substituir o redirect hardcoded (se existir) por um redirect contextualizado:

```typescript
// src/lib/api.ts — dentro do interceptor de resposta

import { APP_CONFIG } from '@/types/auth'
import { useAuthStore } from '@/store/authStore'

// No interceptor de erro (response.interceptors.use):
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Ler appContext da store (fora de hook — acesso direto ao getState)
      const appContext = useAuthStore.getState().appContext

      if (appContext) {
        const { loginPath } = APP_CONFIG[appContext]
        useAuthStore.getState().clearAuth()
        // Redirecionar apenas se não estiver já na página de login
        if (!window.location.pathname.includes('/login')) {
          window.location.href = `${loginPath}?reason=session_expired`
        }
      }
    }
    return Promise.reject(error)
  }
)
```

> **Nota:** `useAuthStore.getState()` é a forma correta de acessar o Zustand fora de componentes React (sem hook). É seguro chamar em qualquer contexto.

#### 5.4 — Adicionar `LoadingGuard` nos layouts (opcional mas recomendado)

Para evitar flash de conteúdo enquanto `useMe` carrega, adicionar um guard mínimo no layout:

```typescript
// src/components/common/LoadingGuard.tsx
'use client'

import { useAuthStore } from '@/store/authStore'

interface LoadingGuardProps {
  children: React.ReactNode
}

/**
 * Exibe um loader enquanto os dados do usuário estão sendo buscados.
 * Evita flash de conteúdo não autenticado.
 */
export function LoadingGuard({ children }: LoadingGuardProps) {
  const isLoading = useAuthStore((s) => s.isLoading)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app-gradient">
        <span className="material-symbols-outlined animate-spin text-white text-4xl">
          progress_activity
        </span>
      </div>
    )
  }

  return <>{children}</>
}
```

Usar nos layouts:
```tsx
<AppThemeProvider appContext="PORTAL">
  <LoadingGuard>
    <TopBar ... />
    <main>{children}</main>
  </LoadingGuard>
</AppThemeProvider>
```

### Testes — Fase 5

Criar `src/hooks/__tests__/useMe.test.ts`:

```typescript
// src/hooks/__tests__/useMe.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useMe } from '../useMe'
import { useAuthStore } from '@/store/authStore'
import * as apiModule from '@/lib/api'

const mockMe = {
  id: 1, username: 'carlos.lima', name: 'Carlos Lima',
  email: 'carlos@es.gov.br', app_context: 'ACOES_PNGI' as const,
  apps: ['ACOES_PNGI' as const],
}

describe('useMe', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null, appContext: null,
      isAuthenticated: false, isLoading: true,
    })
    vi.clearAllMocks()
  })

  it('deve hidratar a store com os dados do usuário após GET /me bem-sucedido', async () => {
    vi.spyOn(apiModule.api, 'get').mockResolvedValue({ data: mockMe })

    renderHook(() => useMe())

    await waitFor(() => {
      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockMe)
      expect(state.appContext).toBe('ACOES_PNGI')
      expect(state.isAuthenticated).toBe(true)
      expect(state.isLoading).toBe(false)
    })
  })

  it('deve chamar clearAuth quando GET /me retorna erro', async () => {
    vi.spyOn(apiModule.api, 'get').mockRejectedValue(new Error('401'))
    useAuthStore.setState({ user: mockMe, appContext: 'ACOES_PNGI', isAuthenticated: true, isLoading: false })

    renderHook(() => useMe())

    await waitFor(() => {
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })
})
```

### Critérios de Aceite — Fase 5

- [ ] `src/hooks/useMe.ts` criado com SWR + hidratação da store
- [ ] `AppThemeProvider` chama `useMe()` internamente
- [ ] Ao recarregar qualquer dashboard, o nome do usuário aparece no `TopBar` sem piscar
- [ ] Interceptor 401 do Axios redireciona para o login da app correta (testado manualmente)
- [ ] `LoadingGuard` evita flash de conteúdo durante carregamento inicial
- [ ] Testes do `useMe` passam: `pnpm test`
- [ ] `pnpm build` sem warnings de TypeScript
- [ ] Testar fluxo completo: login → dashboard (nome aparece) → F5 (nome reaparece sem flash) → logout (redireciona para login correto)

---

## Resumo de Dependências entre Fases

```
FASE 1 (Zustand + logoutApp)
    │
    ├── FASE 2 (Temas CSS)        ← pode rodar em paralelo com Fase 4
    │       │
    │       └── FASE 3 (TopBar/Sidebar)
    │                   │
    │                   └── FASE 5 (useMe + hidratação)
    │
    └── FASE 4 (Middleware)       ← pode rodar em paralelo com Fase 2
```

## Convenção de Commits por Fase

```
feat(fase1): add Zustand authStore and contextual logoutApp
feat(fase2): add per-app CSS theme system with AppThemeProvider
feat(fase3): refactor TopBar and Sidebar to consume appContext
feat(fase4): add Next.js middleware for multi-cookie session guard
feat(fase5): add useMe hook with SWR and store hydration
```
