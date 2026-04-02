// src/components/layout/Sidebar.tsx
'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { NavItem } from '@/components/common/NavItem'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { logoutApp } from '@/lib/auth'
import { APP_CONFIG } from '@/types/auth'
import type { AppContext } from '@/types/auth'

const navItems = [
  { icon: 'dashboard',       label: 'Dashboard',       active: true },
  { icon: 'account_balance', label: 'Administrative' },
  { icon: 'groups',          label: 'Human Resources' },
  { icon: 'payments',        label: 'Financials' },
  { icon: 'monitoring',      label: 'Analytics' },
  { icon: 'settings',        label: 'Settings' },
]

interface SidebarProps {
  appContext: AppContext
}

export default function Sidebar({ appContext }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()
  const clearAuth = useAuthStore((s) => s.clearAuth)

  const handleMouseEnter = () => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current)
    setIsExpanded(true)
  }

  const handleMouseLeave = () => {
    if (isPinned) return
    collapseTimer.current = setTimeout(() => setIsExpanded(false), 120)
  }

  const expanded = isExpanded || isPinned

  async function handleLogout() {
    const { loginPath } = APP_CONFIG[appContext]
    await logoutApp(appContext)
    clearAuth()
    router.push(loginPath)
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full flex flex-col',
        'bg-surface-container-lowest border-r border-outline-variant shadow-sm z-50',
        'transition-[width] duration-300 ease-in-out',
        expanded ? 'w-64' : 'w-[72px]'
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-expanded={expanded}
    >
      {/* Logo / Header */}
      <div className="px-4 py-6 flex items-center gap-3 min-h-[72px]">
        <button
          onClick={() => setIsPinned((p) => !p)}
          className={cn(
            'w-10 h-10 flex-shrink-0 authority-gradient rounded-lg flex items-center justify-center shadow-md',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
          )}
          aria-label={isPinned ? 'Desafixar sidebar' : 'Fixar sidebar'}
          title={isPinned ? 'Desafixar sidebar' : 'Fixar sidebar'}
        >
          <span
            className="material-symbols-outlined text-white text-[20px] leading-none"
            style={{ fontVariationSettings: isPinned ? "'FILL' 1" : "'FILL' 0" }}
          >
            {isPinned ? 'push_pin' : 'account_balance'}
          </span>
        </button>

        <div
          className={cn(
            'flex flex-col overflow-hidden whitespace-nowrap',
            'transition-[opacity,transform] duration-300 ease-in-out',
            expanded
              ? 'opacity-100 translate-x-0 pointer-events-auto'
              : 'opacity-0 -translate-x-2 pointer-events-none'
          )}
          aria-hidden={!expanded}
        >
          <h1 className="text-base font-bold tracking-tight text-blue-900 font-outfit leading-tight">
            SUBGES/SEGER
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">
            Gov Management
          </p>
        </div>
      </div>

      {/* CTA */}
      <div
        className={cn(
          'px-4 mb-4 grid transition-[grid-template-rows,opacity] duration-300 ease-in-out',
          expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
        aria-hidden={!expanded}
      >
        <div className="overflow-hidden">
          <button className="authority-gradient text-white rounded-lg py-3 px-4 flex items-center justify-center gap-2 font-semibold text-sm hover:opacity-90 transition-opacity w-full active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            <span className="material-symbols-outlined text-white text-[18px] leading-none">add</span>
            Nova Solicitação
          </button>
        </div>
      </div>

      {/* Navegação Principal */}
      <nav className="px-2 space-y-1 mt-2 flex-1" aria-label="Navegação principal">
        {navItems.map((item) => (
          <NavItem
            key={item.icon}
            icon={item.icon}
            label={item.label}
            isExpanded={expanded}
            active={item.active}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-outline-variant/50 space-y-1">
        <NavItem icon="help"   label="Suporte" isExpanded={expanded} />
        <NavItem
          icon="logout"
          label="Sair"
          isExpanded={expanded}
          onClick={handleLogout}
        />
      </div>
    </aside>
  )
}
