'use client'

import { cn } from '@/lib/utils'

interface NavItemProps {
  icon: string
  label: string
  isExpanded: boolean
  active?: boolean
}

export function NavItem({ icon, label, isExpanded, active = false }: NavItemProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 overflow-hidden',
        active
          ? 'bg-blue-100 text-blue-900 font-semibold scale-95'
          : 'text-on-surface-variant hover:text-primary hover:bg-surface-container hover:shadow-sm'
      )}
    >
      {/* Ícone — tamanho fixo para o material-symbols renderizar */}
      <span
        className="material-symbols-outlined flex-shrink-0 text-[22px] leading-none"
        style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
        data-icon={icon}
      >
        {icon}
      </span>

      {/* Label — anima com max-width para não vazar durante recolher */}
      <span
        className={cn(
          'whitespace-nowrap text-sm font-medium transition-all duration-300 overflow-hidden',
          isExpanded ? 'max-w-[160px] opacity-100' : 'max-w-0 opacity-0'
        )}
      >
        {label}
      </span>
    </div>
  )
}
