// src/components/common/NavItem.tsx
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
      role="button"
      tabIndex={0}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer',
        'transition-colors duration-200',
        'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary',
        active
          ? 'bg-blue-100 text-blue-900 font-semibold'
          : 'text-on-surface-variant hover:text-primary hover:bg-surface-container hover:shadow-sm'
      )}
    >
      {/* Ícone sempre visível, tamanho fixo para não causar reflow */}
      <span
        className="material-symbols-outlined flex-shrink-0 text-[22px] leading-none w-[22px] h-[22px]"
        style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
      >
        {icon}
      </span>

      {/* Label: opacity + translateX. Largura reservada pelo flex do pai */}
      <span
        className={cn(
          'whitespace-nowrap text-sm font-medium select-none',
          'transition-[opacity,transform] duration-300 ease-in-out',
          isExpanded
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 -translate-x-1 w-0 overflow-hidden'
        )}
        aria-hidden={!isExpanded}
      >
        {label}
      </span>
    </div>
  )
}
