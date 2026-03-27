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
      className={`
        fixed left-0 top-0 h-full bg-surface-container-lowest
        border-r border-outline-variant shadow-sm z-50
        transition-all duration-300
        ${isExpanded ? 'w-64' : 'w-20'}
      `}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo / Header */}
      <div className="px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 authority-gradient rounded-lg flex items-center justify-center shadow-md shadow-primary/20">
            <span
              className="material-symbols-outlined text-white"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              account_balance
            </span>
          </div>
          {isExpanded && (
            <div className="hidden md:block">
              <h1 className="text-lg font-bold tracking-tight text-blue-900 font-outfit">
                SUBGES/SEGER
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">
                Gov Management
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CTA — visível apenas expandido */}
      {isExpanded && (
        <div className="px-4 mb-4">
          <button className="authority-gradient text-white rounded-lg py-3 px-4 flex items-center justify-center gap-2 font-semibold text-sm hover:opacity-90 transition-all w-full active:scale-95">
            <span className="material-symbols-outlined text-white" style={{ fontSize: '18px' }}>add</span>
            Nova Solicitação
          </button>
        </div>
      )}

      {/* Navegação Principal */}
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <NavItem
            key={item.icon}
            icon={
              <span
                className="material-symbols-outlined"
                style={item.active ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
            }
            label={item.label}
            isExpanded={isExpanded}
            active={item.active}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 mt-auto border-t border-outline-variant/50 space-y-1">
        <NavItem
          icon={<span className="material-symbols-outlined">help</span>}
          label="Support"
          isExpanded={isExpanded}
        />
        <NavItem
          icon={<span className="material-symbols-outlined">logout</span>}
          label="Logout"
          isExpanded={isExpanded}
        />
      </div>
    </aside>
  )
}
