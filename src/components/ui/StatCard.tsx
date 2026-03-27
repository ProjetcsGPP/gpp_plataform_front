'use client'

import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  /** Badge de tendência (ex: "+12%", "94% Comp.") */
  trend?: string
  /** Subtexto simples sem badge (ex: "Require immediate action") */
  subtext?: string
  /** Nome do Material Symbol (ex: "rocket_launch") */
  icon: string
  variant?: 'proj' | 'proc' | 'alert' | 'efi'
  /** Percentual para a barra de progresso — somente variant="efi" */
  progress?: number
}

export function StatCard({
  label,
  value,
  trend,
  subtext,
  icon,
  variant = 'proj',
  progress,
}: StatCardProps) {

  // Estilos exatos extraídos do visao-Google.html
  const cardBase = 'bg-surface-container-lowest p-6 rounded-lg shadow-sm border-l-4 group transition-all duration-300 cursor-pointer'

  const cardVariant = {
    proj:  'border-primary           hover:bg-primary-container   hover:text-white',
    proc:  'border-blue-400          hover:bg-blue-600            hover:text-white',
    alert: 'border-error             hover:bg-error               hover:text-white',
    efi:   'border-tertiary-container hover:bg-on-tertiary-container hover:text-white',
  }

  const labelHover = {
    proj:  'group-hover:text-blue-100',
    proc:  'group-hover:text-blue-100',
    alert: 'group-hover:text-white',
    efi:   'group-hover:text-white',
  }

  const iconColor = {
    proj:  'text-primary           group-hover:text-blue-200',
    proc:  'text-blue-500          group-hover:text-blue-100',
    alert: 'text-error             group-hover:text-white',
    efi:   'text-tertiary-container group-hover:text-white',
  }

  // FILL=1 apenas nos ícones que ficam melhores preenchidos
  const iconFill = variant === 'alert' ? "'FILL' 1" : "'FILL' 0"

  const progressValue =
    variant === 'efi'
      ? (progress ?? (typeof value === 'string' ? parseFloat(value) : (value as number)))
      : null

  return (
    <div className={cn(cardBase, cardVariant[variant])}>

      {/* Header: label + ícone */}
      <div className="flex justify-between items-start">
        <span
          className={cn(
            'text-xs font-bold uppercase tracking-wider text-on-surface-variant',
            labelHover[variant],
          )}
        >
          {label}
        </span>
        <span
          className={cn('material-symbols-outlined', iconColor[variant])}
          style={{ fontVariationSettings: iconFill }}
        >
          {icon}
        </span>
      </div>

      {/* Valor principal — fonte Outfit igual ao HTML original */}
      <div className="mt-4">
        <span className="text-3xl font-extrabold font-outfit tracking-tight">
          {value}
        </span>

        {/* Trend badge — verde para proj, azul para proc */}
        {trend && variant === 'proj' && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full group-hover:bg-green-600 group-hover:text-white transition-colors">
              {trend}
            </span>
            <span className="text-[10px] text-on-surface-variant group-hover:text-blue-200">
              vs. last month
            </span>
          </div>
        )}

        {trend && variant === 'proc' && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full group-hover:bg-blue-400 group-hover:text-white transition-colors">
              {trend}
            </span>
          </div>
        )}

        {/* Subtexto simples — alert card */}
        {subtext && variant === 'alert' && (
          <div className="flex items-center gap-2 mt-2 text-on-error-container group-hover:text-white">
            <span className="text-[10px] font-bold">{subtext}</span>
          </div>
        )}

        {/* Barra de progresso — efi card */}
        {variant === 'efi' && progressValue !== null && (
          <div className="flex items-center gap-2 mt-2">
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="bg-tertiary-container h-full group-hover:bg-white transition-all"
                style={{ width: `${progressValue}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
