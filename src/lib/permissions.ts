// src/lib/permissions.ts
// Registry central de permissões — strings validadas contra o payload real de
// GET /api/accounts/me/permissions/ (formato Django ORM: {action}_{model}).
// NUNCA use strings literais de permissão fora deste arquivo.

export const PERMISSIONS = {
  // ── Usuários (model: user) ─────────────────────────────────────────────
  USER_VIEW: "view_user",
  USER_ADD: "add_user",
  USER_CHANGE: "change_user",
  USER_DELETE: "delete_user",

  // ── Perfil de Usuário (model: userprofile) ────────────────────────────
  USERPROFILE_VIEW: "view_userprofile",
  USERPROFILE_ADD: "add_userprofile",
  USERPROFILE_CHANGE: "change_userprofile",
  USERPROFILE_DELETE: "delete_userprofile",

  // ── Roles (model: role) ───────────────────────────────────────────────
  ROLE_VIEW: "view_role",
  ROLE_ADD: "add_role",
  ROLE_CHANGE: "change_role",
  ROLE_DELETE: "delete_role",

  // ── Associação Usuário-Role (model: userrole) ─────────────────────────
  USERROLE_VIEW: "view_userrole",
  USERROLE_ADD: "add_userrole",
  USERROLE_CHANGE: "change_userrole",
  USERROLE_DELETE: "delete_userrole",

  // ── Atributos / Overrides (model: attribute) ──────────────────────────
  ATTRIBUTE_VIEW: "view_attribute",
  ATTRIBUTE_ADD: "add_attribute",
  ATTRIBUTE_CHANGE: "change_attribute",
  ATTRIBUTE_DELETE: "delete_attribute",

  // ── Grupos Django (model: group) ──────────────────────────────────────
  GROUP_VIEW: "view_group",
  GROUP_ADD: "add_group",
  GROUP_CHANGE: "change_group",
  GROUP_DELETE: "delete_group",

  // ── Permissões Django (model: permission) ─────────────────────────────
  PERMISSION_VIEW: "view_permission",
  PERMISSION_ADD: "add_permission",
  PERMISSION_CHANGE: "change_permission",
  PERMISSION_DELETE: "delete_permission",

  // ── Aplicações (model: aplicacao) ────────────────────────────────────
  APLICACAO_VIEW: "view_aplicacao",
  APLICACAO_ADD: "add_aplicacao",
  APLICACAO_CHANGE: "change_aplicacao",
  APLICACAO_DELETE: "delete_aplicacao",

  // ── Tipos auxiliares de Usuário ───────────────────────────────────────
  TIPOUSUARIO_VIEW: "view_tipousuario",
  TIPOUSUARIO_ADD: "add_tipousuario",
  TIPOUSUARIO_CHANGE: "change_tipousuario",
  TIPOUSUARIO_DELETE: "delete_tipousuario",

  STATUSUSUARIO_VIEW: "view_statususuario",
  STATUSUSUARIO_ADD: "add_statususuario",
  STATUSUSUARIO_CHANGE: "change_statususuario",
  STATUSUSUARIO_DELETE: "delete_statususuario",

  CLASSIFICACAOUSUARIO_VIEW: "view_classificacaousuario",
  CLASSIFICACAOUSUARIO_ADD: "add_classificacaousuario",
  CLASSIFICACAOUSUARIO_CHANGE: "change_classificacaousuario",
  CLASSIFICACAOUSUARIO_DELETE: "delete_classificacaousuario",

  // ── Sessões (model: accountssession) ─────────────────────────────────
  ACCOUNTSSESSION_VIEW: "view_accountssession",
  ACCOUNTSSESSION_ADD: "add_accountssession",
  ACCOUNTSSESSION_CHANGE: "change_accountssession",
  ACCOUNTSSESSION_DELETE: "delete_accountssession",

  // ── Django core session (raramente usado no frontend) ─────────────────
  SESSION_VIEW: "view_session",
  SESSION_ADD: "add_session",
  SESSION_CHANGE: "change_session",
  SESSION_DELETE: "delete_session",

  // ── Log de auditoria (model: logentry) ───────────────────────────────
  LOGENTRY_VIEW: "view_logentry",
  LOGENTRY_ADD: "add_logentry",
  LOGENTRY_CHANGE: "change_logentry",
  LOGENTRY_DELETE: "delete_logentry",

  // Estado de autorização
  USERAUTHZSTATE_VIEW: "view_userauthzstate",
  USERAUTHZSTATE_ADD: "add_userauthzstate",
  USERAUTHZSTATE_CHANGE: "change_userauthzstate",
  USERAUTHZSTATE_DELETE: "delete_userauthzstate",

  // Overrides de permissão
  USERPERMISSIONOVERRIDE_VIEW: "view_userpermissionoverride",
  USERPERMISSIONOVERRIDE_ADD: "add_userpermissionoverride",
  USERPERMISSIONOVERRIDE_CHANGE: "change_userpermissionoverride",
  USERPERMISSIONOVERRIDE_DELETE: "delete_userpermissionoverride",

  // ── Eixos PNGI (model: eixo) ──────────────────────────────────────────
  EIXO_VIEW: "view_eixo",
  EIXO_ADD: "add_eixo",
  EIXO_CHANGE: "change_eixo",
  EIXO_DELETE: "delete_eixo",

  // ── Situações de Ação PNGI (model: situacaoacao) ──────────────────────
  SITUACAOACAO_VIEW: "view_situacaoacao",
  SITUACAOACAO_ADD: "add_situacaoacao",
  SITUACAOACAO_CHANGE: "change_situacaoacao",
  SITUACAOACAO_DELETE: "delete_situacaoacao",

  // ── Carga de Organograma e Lotação ────────────────────────────────
  PATRIARCA_VIEW: "view_patriarca",
  PATRIARCA_ADD: "add_patriarca",
  PATRIARCA_CHANGE: "change_patriarca",
  IMPORTACAOPLANILHA_VIEW: "view_importacaoplanilha",
  IMPORTACAOPLANILHA_ADD: "add_importacaoplanilha",
  IMPORTACAOPLANILHA_CHANGE: "change_importacaoplanilha",
  IMPORTACAOPLANILHA_DELETE: "delete_importacaoplanilha",
  ITEMORGANOGRAMA_VIEW: "view_itemorganograma",
  ITEMORGANOGRAMA_ADD: "add_itemorganograma",
  ITEMORGANOGRAMA_CHANGE: "change_itemorganograma",
  ITEMORGANOGRAMA_DELETE: "delete_itemorganograma",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
