// src/lib/__tests__/resolveNavigation.submenu.test.ts
// Testes de grupos e submenus para resolveNavigation.
// REGRA: um grupo sem permissionKey e' sempre enabled=true.
// Para testar enabled=false no grupo, o proprio grupo precisa ter permissionKey.
import { describe, it, expect } from 'vitest'
import { resolveNavigation }    from '@/lib/resolveNavigation'
import type { NavItemDefinition } from '@/types/navigation'

const groupManifest: NavItemDefinition[] = [
  {
    id: 'gestao',
    label: 'Gestao',
    icon: 'manage_accounts',
    order: 1,
    // sem permissionKey -> sempre enabled, visible depende dos filhos
    children: [
      {
        id: 'usuarios',
        label: 'Usuarios',
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

  it('grupo SEM permissionKey e filhos negados: grupo enabled=true (sem restricao propria)', () => {
    // Grupo sem permissionKey nao tem restricao propria — sempre enabled
    const result = resolveNavigation(groupManifest, [])
    const group  = result[0]

    expect(group.enabled).toBe(true)
  })

  it('grupo COM permissionKey negada e visibleWhenDenied: visible=true mas enabled=false', () => {
    // Grupo com permissionKey propria negada + visibleWhenDenied=true
    const manifest: NavItemDefinition[] = [
      {
        ...groupManifest[0],
        permissionKey:    'view_role',   // permissao propria do grupo
        visibleWhenDenied: true,
      },
    ]

    const result = resolveNavigation(manifest, []) // granted vazio -> negado
    const group  = result[0]

    expect(group.visible).toBe(true)   // visibleWhenDenied=true mantem visivel
    expect(group.enabled).toBe(false)  // mas desabilitado
  })

  it('quando granted inclui permissao de um filho, esse filho fica visible e enabled', () => {
    const result   = resolveNavigation(groupManifest, ['view_user'])
    const group    = result[0]
    const usuarios = group.children?.find((c) => c.id === 'usuarios')
    const perfis   = group.children?.find((c) => c.id === 'perfis')

    expect(usuarios?.visible).toBe(true)
    expect(usuarios?.enabled).toBe(true)
    expect(perfis?.visible).toBe(false)
  })

  it('submenu N niveis: resolucao recursiva preserva visible/enabled em cada nivel', () => {
    const deepManifest: NavItemDefinition[] = [
      {
        id: 'nivel1',
        label: 'Nivel 1',
        icon: 'folder',
        order: 1,
        children: [
          {
            id: 'nivel2',
            label: 'Nivel 2',
            icon: 'folder_open',
            order: 1,
            children: [
              {
                id: 'nivel3',
                label: 'Nivel 3',
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
