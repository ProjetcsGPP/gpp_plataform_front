'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  trend?: string
  subtext?: string
  icon: ReactNode
  variant?: 'proj' | 'proc' | 'alert' | 'efi'
  /** Usado apenas em variant="efi" — número de 0 a 100 */
  progress?: number
}

export function StatCard({ label, value, trend, subtext, icon, variant = 'proj', progress }: StatCardProps) {
  const variants = {
    //  border-left  | hover background               | hover texto
    proj:  'border-primary          hover:bg-primary-container      hover:text-white',
    proc:  'border-blue-400         hover:bg-blue-600               hover:text-white',
    alert: 'border-error            hover:bg-error                  hover:text-white',
    efi:   'border-[#632901]        hover:bg-[#e48f60]              hover:text-white',
  }

  // Cor do label no estado normal
  const labelNormal = 'text-on-surface-variant'

  // Cor do label no hover — cada variante tem tom diferente
  const labelHover = {
    proj:  'group-hover:text-blue-100',
    proc:  'group-hover:text-blue-100',
    alert: 'group-hover:text-white',
    efi:   'group-hover:text-white',
  }

  // Cor do ícone no estado normal
  const iconNormal = {
    proj:  'text-primary',
    proc:  'text-blue-500',
    alert: 'text-error',
    efi:   'text-[#632901]',
  }

  // Badge de trend — cor diferente por variante
  const trendBadge = {
    proj:  'bg-green-100 text-green-700 group-hover:bg-green-600 group-hover:text-white',
    proc:  'bg-blue-100  text-blue-700  group-hover:bg-blue-400  group-hover:text-white',
    alert: 'bg-red-100   text-red-700   group-hover:bg-red-600   group-hover:text-white',
    efi:   'bg-orange-100 text-orange-700 group-hover:bg-orange-600 group-hover:text-white',
  }

  const progressValue =
    variant === 'efi'
      ? (progress ?? (typeof value === 'string' ? parseFloat(value) : (value as number)))
      : null

  return (
    <div
      className={cn(
        'group bg-surface-container-lowest p-6 rounded-lg shadow-sm border-l-4 cursor-pointer transition-all duration-300',
        variants[variant],
      )}
    >
      {/* Header: label + ícone */}
      <div className="flex justify-between items-start">
        <span
          className={cn(
            'text-xs font-bold uppercase tracking-wider font-body transition-colors',
            labelNormal,
            labelHover[variant],
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            'material-symbols-outlined transition-colors',
            iconNormal[variant],
            'group-hover:text-white/90',
          )}
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
        >
          {/* icon é passado como string do Material Symbol ou ReactNode legado */}
          {typeof icon === 'string' ? icon : null}
        </span>
        {typeof icon !== 'string' && (
          <span className={cn('transition-colors', iconNormal[variant], 'group-hover:text-white/90')}>
            {icon}
          </span>
        )}
      </div>

      {/* Valor principal */}
      <div className="mt-4 space-y-2">
        <span className="text-3xl font-extrabold font-headline tracking-tight block leading-none text-on-surface group-hover:text-white transition-colors">
          {value}
        </span>

        {/* Trend badge */}
        {trend && (
          <div className="flex items-center gap-2 mt-2">
            <span
              className={cn(
                'text-xs font-bold px-2 py-0.5 rounded-full transition-colors',
                trendBadge[variant],
              )}
            >
              {trend}
            </span>
            {variant !== 'alert' && (
              <span className="text-[10px] text-on-surface-variant group-hover:text-white/80 font-body">
                vs. mês anterior
              </span>
            )}
          </div>
        )}

        {/* Subtexto customizado (ex: alert card) */}
        {subtext && !trend && (
          <div className="flex items-center gap-2 mt-2 text-on-error-container group-hover:text-white">
            <span className="text-[10px] font-bold">{subtext}</span>
          </div>
        )}

        {/* Barra de progresso — somente variant efi */}
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
