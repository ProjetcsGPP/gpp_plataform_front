'use client'

import { cn } from '@/lib/utils'

export type ProjectStatus = 'Em Dia' | 'Atenção' | 'Atrasado'

interface StatusBadgeProps {
  status: ProjectStatus
  className?: string
}

const mapStatus: Record<ProjectStatus, { label: string; container: string; dot: string }> = {
  'Em Dia': {
    label: 'Em Dia',
    container: 'bg-green-100 text-green-700',
    dot: 'bg-green-600',
  },
  'Atenção': {
    label: 'Atenção',
    container: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-600',
  },
  'Atrasado': {
    label: 'Atrasado',
    container: 'bg-error-container text-on-error-container',
    dot: 'bg-error',
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const cfg = mapStatus[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold',
        cfg.container,
        className,
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  )
}
