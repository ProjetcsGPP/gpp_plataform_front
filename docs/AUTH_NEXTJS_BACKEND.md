# Contrato backend de autenticação consumido pelo frontend

Este resumo não substitui a documentação canônica do backend. Ele mantém o
repositório frontend alinhado ao contrato vigente de sessão multiaplicação.

## Endpoints

| Finalidade | Método e endpoint | Corpo | Observação |
|---|---|---|---|
| Bootstrap CSRF | `GET /api/accounts/auth/csrf/` | — | Emite `csrftoken` legível |
| Login | `POST /api/accounts/login/` | `identifier`, `password`, `app_context` | `identifier` é opaco |
| Estado atual | `GET /api/accounts/me/` | — | Usa a sessão da aplicação |
| Troca de aplicação | `POST /api/accounts/switch-app/` | `app_context` | Não reenvia credenciais |
| Logout seletivo | `POST /api/accounts/logout/{app_slug}/` | — | Exige CSRF e remove apenas o cookie alvo |

O endpoint `resolve-user` foi removido e não possui consumidor ou fallback no
frontend.

## Sessões e cookies

- cada aplicação possui cookie `gpp_session_<APP>`;
- cookies de sessão são HttpOnly e `SameSite=Lax`, com `Secure` em produção;
- `csrftoken` é legível para composição de `X-CSRFToken`;
- login pode rotacionar CSRF, portanto o token não é mantido em memória;
- sessão expirada, revogada, pertencente a usuário inativo ou usada em contexto
  divergente é recusada pelo backend;
- o backend continua sendo a autoridade para autorização, menus, capabilities,
  aplicações disponíveis e permissões técnicas.

## Respostas relevantes

- login: `400` requisição inválida, `401` credenciais inválidas, `403` contexto
  ou acesso recusado, `429` throttling e `5xx` indisponibilidade;
- endpoints autenticados: `401` para sessão inválida;
- logout seletivo: idempotente para cookie ausente, mas sempre protegido por
  CSRF;
- falhas do login não devem permitir distinguir identificador inexistente,
  senha inválida ou ausência de vínculo pela mensagem da interface.

## Responsabilidade do frontend

Consumir o contrato pelo Axios compartilhado com `withCredentials: true`,
preservar os hydrators/Zustand/SWR existentes, usar redirects internos
validados e nunca derivar autorização de nomes de roles.
