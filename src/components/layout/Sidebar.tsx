'use client'

import { useState } from 'react'
import { 
  LayoutDashboard, 
  FolderKanban, 
  FileText, 
  BarChart3, 
  Settings, 
  HelpCircle,
  LogOut 
} from 'lucide-react'

import { NavItem } from '@/components/common/NavItem'

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false)

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', active: true },
    { icon: FolderKanban, label: 'Projetos' },
    { icon: FileText, label: 'Processos' },
    { icon: BarChart3, label: 'Analytics' },
    { icon: Settings, label: 'Configurações' },
  ]

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
      {/* Logo/Header */}
      <div className="px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-on-primary text-xl">
              account_balance
            </span>
          </div>
          {isExpanded && (
            <div>
              <h1 className="text-lg font-bold tracking-tight text-primary font-headline">
                GPP Plataforma
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">
                Gov Management
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navegação Principal */}
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item, index) => (
          <NavItem 
            key={index}
            icon={<item.icon size={20} />}
            label={item.label}
            isExpanded={isExpanded}
            active={item.active}
          />
        ))}
      </nav>

      {/* Footer: Suporte e Logout */}
      <div className="p-4 mt-auto border-t border-outline-variant/50 space-y-2">
        <NavItem 
          icon={<HelpCircle size={18} />}
          label="Suporte"
          isExpanded={isExpanded}
        />
        <NavItem 
          icon={<LogOut size={18} />}
          label="Logout"
          isExpanded={isExpanded}
        />
      </div>
    </aside>
  )
}
