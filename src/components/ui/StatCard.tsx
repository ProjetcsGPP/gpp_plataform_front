'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  trend?: string
  icon: ReactNode
  variant?: 'proj' | 'proc' | 'alert' | 'efi'
}

export function StatCard({ label, value, trend, icon, variant = 'proj' }: StatCardProps) {
  const variants = {
    proj: 'border-l-primary hover:bg-primary-container/50 hover:text-primary hover:shadow-primary/20',
    proc: 'border-l-blue-400 hover:bg-blue-50 hover:text-blue-800 hover:shadow-blue-200',
    alert: 'border-l-error hover:bg-error-container hover:text-on-error-container hover:shadow-red-200',
    efi: 'border-l-orange-400 hover:bg-orange-50 hover:text-orange-800 hover:shadow-orange-200'
  }

  return (
    <div className={cn(
      'group relative bg-white p-6 rounded-lg shadow-sm border-l-4 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-px hover:z-10',
      variants[variant]
    )}>
      <div className="flex justify-between items-start mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-primary font-body">
          {label}
        </span>
        <div className="opacity-75 group-hover:opacity-100 transition-all">
          {icon}
        </div>
      </div>
      
      <div className="space-y-2">
        <span className="text-3xl font-extrabold font-headline tracking-tight block leading-none text-slate-900">
          {value}
        </span>
        {trend && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-px rounded-full group-hover:bg-emerald-600/90 group-hover:text-white transition-all border border-emerald-300">
              {trend}
            </span>
            <span className="text-[10px] text-slate-500 group-hover:text-slate-700 font-body">
              vs. mês anterior
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
