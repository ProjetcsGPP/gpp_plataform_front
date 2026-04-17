// src/lib/__tests__/resolveNavigation.submenu.test.ts
// Complemento de testes para grupos e submenus — adiciona cobertura
// dos casos de N níveis que não existiam nos testes originais.
import { describe, it, expect } from 'vitest'
import { resolveNavigation }    from '@/lib/resolveNavigation'
import type { NavItemDefinition } from '@/types/navigation'

const groupManifest: NavItemDefinition[] = [
  {
    id: 'gestao',
    label: 'Gestão',
    icon: 'manage_accounts',
    order: 1,
    children: [
      {
        id: 'usuarios',
        label: 'Usuários',
        href: '/portal/usuarios',
        icon: 'group',
        order: 1,
        permissionKey: 'view_user',
      },
      {
        id: 'perfis',
        label: 'Perfis',
        href: '/portal/perfis',
        icon: 'badge',
        order: 2,
        permissionKey: 'view_userprofile',
      },
    ],
  },
]

describe('resolveNavigation — grupos e submenus', () => {
  it('grupo com todos os filhos negados: visible: false em todos os filhos', () => {
    const result = resolveNavigation(groupManifest, [])
    const group  = result[0]

    expect(group.children?.every((c) => c.visible === false)).toBe(true)
  })

  it('grupo com visibleWhenDenied e filhos negados: grupo visível mas enabled: false', () => {
    const manifest: NavItemDefinition[] = [
      { ...groupManifest[0], visibleWhenDenied: true },
    ]

    const result = resolveNavigation(manifest, [])
    const group  = result[0]

    expect(group.visible).toBe(true)
    expect(group.enabled).toBe(false)
  })

  it('quando granted inclui permissão de um filho, esse filho fica visible e enabled', () => {
    const result   = resolveNavigation(groupManifest, ['view_user'])
    const group    = result[0]
    const usuarios = group.children?.find((c) => c.id === 'usuarios')
    const perfis   = group.children?.find((c) => c.id === 'perfis')

    expect(usuarios?.visible).toBe(true)
    expect(usuarios?.enabled).toBe(true)
    expect(perfis?.visible).toBe(false)
  })

  it('submenu N níveis: resolução recursiva preserva visible/enabled em cada nível', () => {
    const deepManifest: NavItemDefinition[] = [
      {
        id: 'nivel1',
        label: 'Nível 1',
        icon: 'folder',
        order: 1,
        children: [
          {
            id: 'nivel2',
            label: 'Nível 2',
            icon: 'folder_open',
            order: 1,
            children: [
              {
                id: 'nivel3',
                label: 'Nível 3',
                href: '/deep',
                icon: 'description',
                order: 1,
                permissionKey: 'view_aplicacao',
              },
            ],
          },
        ],
      },
    ]

    const result = resolveNavigation(deepManifest, ['view_aplicacao'])
    const n1 = result[0]
    const n2 = n1.children?.[0]
    const n3 = n2?.children?.[0]

    expect(n3?.visible).toBe(true)
    expect(n3?.enabled).toBe(true)
    expect(n2?.visible).toBe(true)
    expect(n1?.visible).toBe(true)
  })
})
