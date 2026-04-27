// src/components/common/NavItemGroup.tsx
'use client'

import { useState } from 'react'
import { NavItem } from '@/components/common/NavItem'
import type { ResolvedNavItem } from '@/types/navigation'

interface NavItemGroupProps {
  item: ResolvedNavItem
  isExpanded: boolean
  pathname: string
  onNavigate: (href: string) => void
}

export function NavItemGroup({
  item,
  isExpanded,
  pathname,
  onNavigate,
}: NavItemGroupProps) {
  const isChildActive = item.children?.some(
    (c) => pathname === c.href || pathname.startsWith(`${c.href}/`)
  )
  const [open, setOpen] = useState(isChildActive ?? false)

  return (
    <div>
      <NavItem
        icon={item.icon}
        label={item.label}
        isExpanded={isExpanded}
        active={isChildActive}
        onClick={() => {
          if (isExpanded) setOpen((o) => !o)
          else if (item.href) onNavigate(item.href)
        }}
        trailingIcon={isExpanded ? (open ? 'expand_less' : 'expand_more') : undefined}
      />
      {open && isExpanded && item.children?.map((child) => (
        <div key={child.id} className="pl-4">
          <NavItem
            icon={child.icon}
            label={child.label}
            isExpanded={isExpanded}
            active={pathname === child.href || pathname.startsWith(`${child.href}/`)}
            onClick={child.enabled ? () => onNavigate(child.href) : undefined}
          />
        </div>
      ))}
    </div>
  )
}
