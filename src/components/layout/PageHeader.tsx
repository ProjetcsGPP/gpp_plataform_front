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
          <span className="text-xs font-bold text-primary/60 uppercase tracking-[0.2em] font-headline">
            {eyebrow}
          </span>
        )}
        <h1 className="text-3xl md:text-4xl font-bold text-primary font-headline tracking-tight mt-1">
          {title}
        </h1>
        {subtitle && (
          <p className="text-on-surface-variant mt-2 max-w-xl text-sm md:text-base">
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
