'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  trend?: string
  icon: ReactNode
  variant?: 'proj' | 'proc' | 'alert' | 'efi'
  /** Usado apenas em variant="efi" — número de 0 a 100 */
  progress?: number
}

export function StatCard({ label, value, trend, icon, variant = 'proj', progress }: StatCardProps) {
  const variants = {
    proj:  'border-l-primary  hover:bg-primary-container hover:text-white hover:shadow-primary/20',
    proc:  'border-l-blue-400 hover:bg-blue-600 hover:text-white hover:shadow-blue-200',
    alert: 'border-l-error    hover:bg-error hover:text-white hover:shadow-red-200',
    efi:   'border-l-[#632901] hover:bg-[#632901] hover:text-white hover:shadow-orange-200',
  }

  const progressValue = variant === 'efi' ? (progress ?? (typeof value === 'string' ? parseFloat(value) : value)) : null

  return (
    <div
      className={cn(
        'group relative bg-surface-container-lowest p-6 rounded-lg shadow-sm border-l-4 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-px hover:z-10',
        variants[variant],
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant group-hover:text-white/90 font-body transition-colors">
          {label}
        </span>
        <div className="opacity-75 group-hover:opacity-100 text-on-surface-variant group-hover:text-white transition-all">
          {icon}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-3xl font-extrabold font-headline tracking-tight block leading-none text-on-surface group-hover:text-white transition-colors">
          {value}
        </span>

        {trend && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full group-hover:bg-green-600 group-hover:text-white transition-colors">
              {trend}
            </span>
            <span className="text-[10px] text-on-surface-variant group-hover:text-white/70 font-body">
              vs. mês anterior
            </span>
          </div>
        )}

        {variant === 'efi' && progressValue !== null && (
          <div className="mt-2">
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden group-hover:bg-white/30 transition-colors">
              <div
                className="bg-[#632901] h-full group-hover:bg-white transition-all rounded-full"
                style={{ width: `${progressValue}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
