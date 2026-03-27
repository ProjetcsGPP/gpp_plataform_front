'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  trend?: string
  trendDirection?: 'up' | 'down'
  icon: ReactNode
  color?: 'primary' | 'blue' | 'error' | 'success' | 'tertiary'
  className?: string
}

const colorClasses = {
  primary: 'border-primary hover:bg-primary hover:text-on-primary',
  blue: 'border-blue-500 hover:bg-blue-600 hover:text-white',
  error: 'border-error hover:bg-error hover:text-on-error',
  success: 'border-success hover:bg-success hover:text-white',
  tertiary: 'border-tertiary-container hover:bg-tertiary-container hover:text-on-tertiary-container'
}

export function StatCard({
  label,
  value,
  trend,
  trendDirection = 'up',
  icon,
  color = 'primary',
  className
}: StatCardProps) {
  return (
    <div className={cn(
      'group bg-surface-container-lowest p-6 rounded-lg shadow-sm border-l-4 cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-0.5',
      colorClasses[color],
      className
    )}>
      <div className="flex justify-between items-start mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant group-hover:text-on-primary/80">
          {label}
        </span>
        <div className="opacity-75 group-hover:opacity-100 transition-opacity">
          {icon}
        </div>
      </div>
      
      <div className="space-y-2">
        <span className="text-3xl font-extrabold font-headline tracking-tight block">
          {value}
        </span>
        
        {trend && (
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-xs font-bold px-2 py-0.5 rounded-full',
              trendDirection === 'up' 
                ? 'bg-success text-success font-semibold' 
                : 'bg-error text-error font-semibold'
            )}>
              {trend}
            </span>
            <span className="text-[10px] text-on-surface-variant group-hover:text-on-primary/80">
              vs. mês anterior
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
