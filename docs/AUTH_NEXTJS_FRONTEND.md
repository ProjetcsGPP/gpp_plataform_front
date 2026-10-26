# Integração Next.js com a autenticação GPP

## Fonte de verdade

Este documento registra o consumo frontend do contrato vigente descrito em
`backend/docs/AUTH_NEXTJS_FRONTEND.md`, `backend/docs/AUTH_NEXTJS_BACKEND.md` e
`backend/docs/API_CONTRACT.md`. O frontend preserva o singleton Axios de
`src/lib/api.ts`; não deve criar wrapper `fetch`, cliente HTTP ou mecanismo de
autenticação paralelo.

## Regras obrigatórias

- autenticação por sessão Django, sem JWT e sem tokens em `localStorage`;
- Axios compartilhado com `baseURL: "/api"` e `withCredentials: true`;
- cookie HttpOnly separado por aplicação: `gpp_session_<APP>`;
- cookie CSRF legível `csrftoken`, obtido por
  `GET /api/accounts/auth/csrf/` antes da primeira mutação;
- `X-CSRFToken` em todo `POST`, `PUT`, `PATCH` e `DELETE`;
- releitura do cookie antes de cada mutação, pois o login pode rotacioná-lo;
- login exclusivamente com `identifier`, `password` e `app_context`;
- nenhuma chamada ou fallback para `resolve-user`;
- falhas de credenciais e de acesso exibidas genericamente, sem enumeração;
- capabilities distribuem funcionalidade e permissões técnicas autorizam
  ações; componentes não verificam nomes de roles.

## Fluxos

### Login

1. `GET /api/accounts/auth/csrf/` se `csrftoken` ainda não existir.
2. `POST /api/accounts/login/` com:

   ```json
   {
     "identifier": "valor opaco informado pelo usuário",
     "password": "...",
     "app_context": "PORTAL"
   }
   ```

3. Em sucesso, fazer navegação completa para um destino interno permitido da
   mesma aplicação.
4. Hidratar `/accounts/me/`, menus, capabilities e permissões pelos mecanismos
   compartilhados existentes.

Os status `400`, `401` e `403` do login não devem revelar se usuário, e-mail,
senha, vínculo ou aplicação existem. `429` pode informar espera por excesso de
tentativas e `5xx`/falha de rede podem informar indisponibilidade genérica.

### Mutação autenticada

O interceptor Axios garante o bootstrap quando necessário e lê o token atual
imediatamente antes da requisição. Código de feature não manipula o cookie nem
repete essa lógica.

### Sessão inválida

Sessão expirada, revogada, usuário inativo e contexto divergente resultam em
`401` nos endpoints autenticados. O interceptor limpa o estado autenticado e
redireciona para o login da aplicação, preservando somente um caminho relativo
interno como retorno. Um `401` de requisição marcada como pública não dispara
esse fluxo.

### Logout seletivo

`POST /api/accounts/logout/{app_slug}/` encerra somente a sessão da aplicação
indicada. A chamada exige CSRF mesmo quando a sessão já estiver inválida; o
interceptor compartilhado atende essa exigência. O frontend só limpa seu estado
e navega após a conclusão da chamada.

### Troca de aplicação

`POST /api/accounts/switch-app/` recebe somente `app_context`. Depois do
sucesso, os hydrators existentes recarregam usuário, navegação, capabilities e
permissões no novo contexto.

## Cookies e redirects

- JavaScript nunca lê cookies `gpp_session_<APP>`; eles são HttpOnly.
- O browser envia credenciais conforme `withCredentials` do cliente
  compartilhado e a política de cookie documentada pelo backend.
- Destinos pós-login devem começar com o prefixo da própria aplicação, ser da
  mesma origem e não apontar novamente para a tela de login.
- URLs absolutas, protocol-relative, com barra invertida ou de outra aplicação
  são rejeitadas e substituídas pelo dashboard padrão.

## Evidência frontend

Os testes relevantes ficam em:

- `src/lib/__tests__/api.auth.test.ts`;
- `src/lib/__tests__/auth.test.ts`;
- `src/lib/__tests__/authRedirect.test.ts`;
- `src/components/auth/__tests__/LoginPage.test.tsx`.
