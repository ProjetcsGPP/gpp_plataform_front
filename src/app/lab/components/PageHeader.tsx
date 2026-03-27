'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  className,
}: PageHeaderProps) {
  return (
    <section className={cn('flex flex-col gap-4 md:flex-row md:items-end md:justify-between', className)}>
      <div>
        {eyebrow && (
          <span className="text-xs font-bold text-blue-900/60 uppercase tracking-[0.2em] font-outfit">
            {eyebrow}
          </span>
        )}
        <h3 className="text-4xl font-bold text-primary font-outfit tracking-tight mt-1">
          {title}
        </h3>
        {subtitle && (
          <p className="text-on-surface-variant mt-2 max-w-lg">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="flex md:justify-end">
          {action}
        </div>
      )}
    </section>
  )
}
