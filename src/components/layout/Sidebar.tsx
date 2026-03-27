'use client'

import { useState } from 'react'
import { NavItem } from '@/components/common/NavItem'

const navItems = [
  { icon: 'dashboard',       label: 'Dashboard',       active: true },
  { icon: 'account_balance', label: 'Administrative' },
  { icon: 'groups',          label: 'Human Resources' },
  { icon: 'payments',        label: 'Financials' },
  { icon: 'monitoring',      label: 'Analytics' },
  { icon: 'settings',        label: 'Settings' },
]

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-surface-container-lowest',
        'border-r border-outline-variant shadow-sm z-50',
        'transition-all duration-300 overflow-hidden',
        isExpanded ? 'w-64' : 'w-[72px]'
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo / Header */}
      <div className="px-4 py-6 flex items-center gap-3 overflow-hidden">
        <div className="w-10 h-10 flex-shrink-0 authority-gradient rounded-lg flex items-center justify-center shadow-md">
          <span
            className="material-symbols-outlined text-white text-[20px] leading-none"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            account_balance
          </span>
        </div>
        <div
          className={cn(
            'overflow-hidden transition-all duration-300 whitespace-nowrap',
            isExpanded ? 'max-w-[160px] opacity-100' : 'max-w-0 opacity-0'
          )}
        >
          <h1 className="text-base font-bold tracking-tight text-blue-900 font-outfit">
            SUBGES/SEGER
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">
            Gov Management
          </p>
        </div>
      </div>

      {/* CTA — anima com max-height */}
      <div
        className={cn(
          'px-4 mb-4 overflow-hidden transition-all duration-300',
          isExpanded ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <button className="authority-gradient text-white rounded-lg py-3 px-4 flex items-center justify-center gap-2 font-semibold text-sm hover:opacity-90 transition-all w-full active:scale-95">
          <span className="material-symbols-outlined text-white text-[18px] leading-none">add</span>
          Nova Solicitação
        </button>
      </div>

      {/* Navegação Principal */}
      <nav className="px-2 space-y-1 mt-2">
        {navItems.map((item) => (
          <NavItem
            key={item.icon}
            icon={item.icon}
            label={item.label}
            isExpanded={isExpanded}
            active={item.active}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2 mt-auto border-t border-outline-variant/50 space-y-1">
        <NavItem icon="help"   label="Support" isExpanded={isExpanded} />
        <NavItem icon="logout" label="Logout"  isExpanded={isExpanded} />
      </div>
    </aside>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
