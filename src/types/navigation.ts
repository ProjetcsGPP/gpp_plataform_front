// src/types/navigation.ts

/** Estrutura de um item de menu conforme definido nos JSONs de public/nav/ */
export interface NavItemDefinition {
  id: string
  label: string
  icon: string
  href: string
  order: number
  /** Se presente, o backend deve incluir esta chave em `granted` para o item ser habilitado */
  permissionKey?: string
  /**
   * true  -> item aparece desabilitado (cinza + tooltip) quando sem permissão
   * false -> item é completamente oculto quando sem permissão (padrão)
   */
  visibleWhenDenied?: boolean
  children?: NavItemDefinition[]
}

/** Formato do JSON em public/nav/{APP}.json */
export interface NavManifestFile {
  items: NavItemDefinition[]
}

/** Item já resolvido após cruzar com permissões do backend */
export interface ResolvedNavItem extends NavItemDefinition {
  enabled: boolean
  visible: boolean
}

/** Resposta do endpoint GET /api/accounts/me/permissions/?app={APP} */
export interface PermissionsResponse {
  role: string
  granted: string[]
}
