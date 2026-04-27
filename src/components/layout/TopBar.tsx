// src/components/layout/TopBar.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { logoutApp } from '@/lib/auth'
import { APP_CONFIG } from '@/types/auth'
import type { AppContext } from '@/types/auth'

interface TopBarProps {
  titleMinor: string
  title: string
  appContext: AppContext
}

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

  return (
    <header className="flex justify-between items-center w-full px-8 py-4 sticky top-0 z-40 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/50 shadow-sm transition-all duration-200 ease-in-out">
      
      {/* Título + Nav */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold text-blue-900/60 uppercase tracking-[0.2em] font-outfit">
          {titleMinor}
        </span>
        <h2 className="text-xl font-extrabold text-blue-900 font-outfit tracking-tight">
          {title}
        </h2>
      </div>

      {/* Busca + Ícones + Perfil */}
      <div className="flex items-center gap-6">
        {/* Busca */}
        <div className="relative hidden sm:block">
          <span
            className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
            style={{ fontSize: '18px' }}
          >
            search
          </span>
          <input
            className="pl-10 pr-4 py-2 bg-surface-container-highest rounded-lg text-sm w-64 focus:ring-2 focus:ring-primary focus:bg-white transition-all placeholder:text-on-surface-variant/60 border-none outline-none"
            placeholder="Global search..."
            type="text"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Notificações */}
          <button className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container rounded-full transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>

          {/* Apps */}
          <button className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container rounded-full transition-colors">
            <span className="material-symbols-outlined">apps</span>
          </button>

          <div className="h-8 w-px bg-outline-variant mx-1" />

          {/* Sair */}
          <button
            onClick={handleLogout}
            title={`Sair de ${APP_CONFIG[appContext].label}`}
            className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-red-600 rounded-full transition-colors"
            aria-label={`Sair de ${APP_CONFIG[appContext].label}`}
          >
            <span className="material-symbols-outlined">logout</span>
          </button>

          {/* Avatar + Nome */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-surface-container-high flex items-center justify-center overflow-hidden cursor-pointer">
              <span
                className="material-symbols-outlined text-on-surface-variant"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                account_circle
              </span>
            </div>
            {firstName && (
              <span className="hidden md:block text-sm font-medium text-blue-900">
                {firstName}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
