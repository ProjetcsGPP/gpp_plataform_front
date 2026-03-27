'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface NavItemProps {
  icon: ReactNode
  label: string
  isExpanded: boolean
  active?: boolean
}

export function NavItem({ icon, label, isExpanded, active = false }: NavItemProps) {
  return (
    <div className={cn(
      'group flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm',
      active 
        ? 'bg-primary-container text-on-primary font-semibold border-r-2 border-primary shadow-sm' 
        : 'text-on-surface-variant hover:text-primary hover:bg-surface-container hover:shadow-md'
    )}>
      <div className="min-w-[24px] flex-shrink-0">{icon}</div>
      {isExpanded && (
        <span className="whitespace-nowrap font-medium text-sm">{label}</span>
      )}
    </div>
  )
}
