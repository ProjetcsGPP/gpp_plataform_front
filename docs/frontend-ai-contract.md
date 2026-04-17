# Frontend AI Contract

Primeiro rascunho derivado de `swagger_texto.txt`, pensado para uso em prompts de IA no frontend. Este arquivo não substitui o OpenAPI original; ele traduz a API em ações operacionais orientadas à interface. [file:1]

## Objetivo

Este contrato serve para orientar uma IA a escolher **o que chamar**, em **que ordem**, com **quais pré-condições**, e como interpretar respostas, erros, autenticação e permissões no frontend. A API documentada usa `OpenAPI 3.0.3` e declara autenticação por sessão com cookie + CSRF. [file:1]

## Regras globais

- Modelo de autenticação: `SessionAuthentication` com cookie de sessão e CSRF. [file:1]
- Existem endpoints públicos e endpoints autenticados; não assumir que toda rota `/api` exige login. [file:1]
- O login depende de `username`, `password` e `app_context`. [file:1]
- O backend cria uma sessão por aplicação, com cookie no formato `gpp_session_{APP}`. [file:1]
- Para mutações autenticadas (`POST`, `PUT`, `PATCH`, `DELETE`), enviar CSRF quando aplicável ao fluxo da aplicação. A documentação geral da API explicita o uso de sessão + CSRF. [file:1]
- Alguns endpoints retornam lista plana sem paginação; outros retornam envelope paginado com `count`, `next`, `previous` e `results`. [file:1]
- O endpoint `/api/accounts/me/permissions/` depende da aplicação resolvida pela sessão atual; a documentação informa que a leitura correta é baseada em `request.app_context`. [file:1]

## Fluxo padrão de autenticação

1. Caso a página não determine a aplicaç~so que quer executar, chamar `listar_aplicacoes_publicas_login` para preencher o seletor de `app_context`. [file:1]
2. Opcionalmente chamar `resolver_usuario` quando o usuário informar email ou username livremente. [file:1]
3. Chamar `login` com `username`, `password` e `app_context`. [file:1]
4. Após sucesso, chamar `carregar_usuario_atual`. [file:1]
5. Em seguida, chamar `carregar_permissoes_usuario_atual` para habilitar ou bloquear ações de UI. [file:1]

## Padrões de resposta

| Padrão | Como detectar | Como o frontend deve tratar |
|---|---|---|
| Lista plana | Endpoints com `pagination_class = None` | Consumir resposta como array diretamente, sem `results`. [file:1] |
| Paginação DRF | Schemas `Paginated...List` e parâmetros `page`/`page_size` | Consumir `count`, `next`, `previous` e `results`. [file:1] |
| Resposta de permissão atual | `/api/accounts/me/permissions/` | Ler `role` e `granted` para construir guards de tela e ação. [file:1] |

## Ações

### listar_aplicacoes_publicas_login

- Objetivo: Popular seletor de app_context na tela de login. [file:1]
- Método: `GET`. [file:1]
- Endpoint: `/api/accounts/auth/aplicacoes/`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Observações extraídas do swagger: GET /api/accounts/auth/aplicacoes/ GET /api/accounts/auth/aplicacoes/{codigointerno}/ [file:1]
- Uso de UI: carregar ao abrir a tela de login para montar o seletor de contexto da aplicação. [file:1]
- Saída útil para prompt: array com `idaplicacao`, `codigointerno` e `nomeaplicacao`. [file:1]

### detalhar_aplicacao_publica_por_codigo

- Objetivo: Obter metadados de uma aplicação pública específica. [file:1]
- Método: `GET`. [file:1]
- Endpoint: `/api/accounts/auth/aplicacoes/{codigointerno}/`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Observações extraídas do swagger: GET /api/accounts/auth/aplicacoes/ GET /api/accounts/auth/aplicacoes/{codigointerno}/ [file:1]

### resolver_usuario

- Objetivo: Converter email ou username no username canônico antes do login. [file:1]
- Método: `POST`. [file:1]
- Endpoint: `/api/accounts/auth/resolve-user/`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Resumo do backend: Resolve username a partir de email ou username. [file:1]
- Observações extraídas do swagger: Recebe um identificador (email ou username) e retorna o username [file:1]
- Respostas relevantes: 200: 'Username resolvido: { ''username'': ''...'' }'; 404: Usuário não encontrado. [file:1]
- Uso de UI: normalizar o identificador antes de enviar credenciais. [file:1]
- Saída útil para prompt: obter `username` canônico quando o usuário informar email. [file:1]

### login

- Objetivo: Autenticar usuário e abrir sessão por aplicação. [file:1]
- Método: `POST`. [file:1]
- Endpoint: `/api/accounts/login/`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Resumo do backend: Login via sessão. [file:1]
- Observações extraídas do swagger: Autentica o usuário e cria uma sessão por aplicação (cookie `gpp_session_{APP}`). [file:1]
- Respostas relevantes: 200: Login realizado com sucesso; 400: Credenciais ou app_context não informados; 401: Credenciais inválidas; 403: Usuário sem acesso à aplicação. [file:1]
- Pré-condições: possuir `app_context` escolhido e credenciais preenchidas. [file:1]
- Pós-condições: sessão autenticada na aplicação escolhida; seguir com `carregar_usuario_atual` e `carregar_permissoes_usuario_atual`. [file:1]

### logout_sessao_atual

- Objetivo: Encerrar a sessão ativa do usuário. [file:1]
- Método: `POST`. [file:1]
- Endpoint: `/api/accounts/logout/`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Resumo do backend: Logout da sessão atual. [file:1]
- Observações extraídas do swagger: Encerra a sessão ativa e revoga o registro em AccountsSession. [file:1]
- Respostas relevantes: 200: Logout realizado. [file:1]
- Uso de UI: limpar estado autenticado local e redirecionar para tela pública apropriada após sucesso. [file:1]

### logout_por_aplicacao

- Objetivo: Encerrar sessão vinculada a uma aplicação específica. [file:1]
- Método: `POST`. [file:1]
- Endpoint: `/api/accounts/logout/{app_slug}/`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Respostas relevantes: 200: No response body. [file:1]
- Uso de UI: limpar estado autenticado local e redirecionar para tela pública apropriada após sucesso. [file:1]

### carregar_usuario_atual

- Objetivo: Carregar perfil, roles e apps do usuário autenticado. [file:1]
- Método: `GET`. [file:1]
- Endpoint: `/api/accounts/me/`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Observações extraídas do swagger: GET /api/accounts/me/ Retorna dados do usuário autenticado: profile + roles + apps com acesso. [file:1]
- Respostas relevantes: 200: No response body. [file:1]
- Uso de UI: hidratar header, menu, perfil e aplicações disponíveis após autenticação. [file:1]

### carregar_permissoes_usuario_atual

- Objetivo: Carregar role e permissões concedidas na aplicação da sessão atual. [file:1]
- Método: `GET`. [file:1]
- Endpoint: `/api/accounts/me/permissions/`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Observações extraídas do swagger: GET /api/accounts/me/permissions/ [file:1]
- Uso de UI: controlar renderização de botões, rotas protegidas e ações condicionadas por permissão. [file:1]
- Resposta esperada: objeto com `role` e `granted`. [file:1]

### listar_aplicacoes_visiveis_usuario

- Objetivo: Listar aplicações visíveis ao usuário autenticado. [file:1]
- Método: `GET`. [file:1]
- Endpoint: `/api/accounts/aplicacoes/`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Observações extraídas do swagger: GET /api/accounts/aplicacoes/ GET /api/accounts/aplicacoes/{idaplicacao}/ [file:1]
- Uso de UI: montar dashboard, menu ou tela de escolha de aplicações após login. [file:1]
- Observação funcional: para usuário comum, a lista é filtrada por role e flags da aplicação; para `PORTAL_ADMIN` ou superusuário, o backend informa acesso sem restrição. [file:1]

### detalhar_aplicacao_visivel_usuario

- Objetivo: Obter uma aplicação visível específica para o usuário autenticado. [file:1]
- Método: `GET`. [file:1]
- Endpoint: `/api/accounts/aplicacoes/{id}/`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Observações extraídas do swagger: GET /api/accounts/aplicacoes/ GET /api/accounts/aplicacoes/{idaplicacao}/ [file:1]
- Uso de UI: montar dashboard, menu ou tela de escolha de aplicações após login. [file:1]
- Observação funcional: para usuário comum, a lista é filtrada por role e flags da aplicação; para `PORTAL_ADMIN` ou superusuário, o backend informa acesso sem restrição. [file:1]

### listar_permission_overrides

- Objetivo: Listar overrides de permissão com paginação. [file:1]
- Método: `GET`. [file:1]
- Endpoint: `/api/accounts/permission-overrides/`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Observações extraídas do swagger: CRUD de UserPermissionOverride. Apenas PORTAL_ADMIN. [file:1]
- Regra de acesso: a documentação informa que o CRUD é apenas para `PORTAL_ADMIN`. [file:1]
- Uso de UI: telas administrativas com grade paginada, filtros e navegação por página. [file:1]

### criar_permission_override

- Objetivo: Criar override de permissão de usuário. [file:1]
- Método: `POST`. [file:1]
- Endpoint: `/api/accounts/permission-overrides/`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Regra de acesso: a documentação informa que o CRUD é apenas para `PORTAL_ADMIN`. [file:1]
- Uso de UI: após mutação bem-sucedida, revalidar listagem e atualizar estado de permissões conforme necessário. O swagger informa sincronização imediata de permissões do usuário afetado. [file:1]

### detalhar_permission_override

- Objetivo: Obter override de permissão específico. [file:1]
- Método: `GET`. [file:1]
- Endpoint: `/api/accounts/permission-overrides/{id}/`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Observações extraídas do swagger: CRUD de UserPermissionOverride. Apenas PORTAL_ADMIN. [file:1]
- Regra de acesso: a documentação informa que o CRUD é apenas para `PORTAL_ADMIN`. [file:1]
- Uso de UI: telas administrativas com grade paginada, filtros e navegação por página. [file:1]

### atualizar_permission_override

- Objetivo: Atualizar override de permissão por substituição completa. [file:1]
- Método: `PUT`. [file:1]
- Endpoint: `/api/accounts/permission-overrides/{id}/`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Regra de acesso: a documentação informa que o CRUD é apenas para `PORTAL_ADMIN`. [file:1]
- Uso de UI: após mutação bem-sucedida, revalidar listagem e atualizar estado de permissões conforme necessário. O swagger informa sincronização imediata de permissões do usuário afetado. [file:1]

### editar_permission_override_parcial

- Objetivo: Atualizar override de permissão parcialmente. [file:1]
- Método: `PATCH`. [file:1]
- Endpoint: `/api/accounts/permission-overrides/{id}/`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Regra de acesso: a documentação informa que o CRUD é apenas para `PORTAL_ADMIN`. [file:1]
- Uso de UI: após mutação bem-sucedida, revalidar listagem e atualizar estado de permissões conforme necessário. O swagger informa sincronização imediata de permissões do usuário afetado. [file:1]

### remover_permission_override

- Objetivo: Excluir override de permissão. [file:1]
- Método: `DELETE`. [file:1]
- Endpoint: `/api/accounts/permission-overrides/{id}/`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Regra de acesso: a documentação informa que o CRUD é apenas para `PORTAL_ADMIN`. [file:1]
- Uso de UI: após mutação bem-sucedida, revalidar listagem e atualizar estado de permissões conforme necessário. O swagger informa sincronização imediata de permissões do usuário afetado. [file:1]

## Exemplos de comandos para prompts

- "Ao abrir a tela de login, carregue as aplicações públicas e monte o seletor de `app_context` usando `listar_aplicacoes_publicas_login`." [file:1]
- "Quando o usuário digitar email no login, resolva o username com `resolver_usuario` antes de autenticar." [file:1]
- "Faça login no contexto `PORTAL`, depois carregue dados do usuário atual e suas permissões." [file:1]
- "Antes de mostrar um botão administrativo, verifique `carregar_permissoes_usuario_atual` e confirme se a permissão necessária está em `granted`." [file:1]
- "Para a tela de overrides, liste dados paginados com `listar_permission_overrides`; em criação, edição ou exclusão, revalide a lista após sucesso." [file:1]

## Regras de decisão para a IA

- Preferir ações nomeadas por intenção de negócio, e não por nome bruto de endpoint. [file:1]
- Nunca tentar mutação administrativa sem autenticação válida e sem contexto de permissão apropriado. [file:1]
- Em rotas listadas como públicas, evitar exigir sessão previamente. [file:1]
- Em respostas paginadas, ler `results`; em listas sem paginação, consumir o array diretamente. [file:1]
- Após login, não assumir que apenas a autenticação basta; carregar também usuário atual e permissões antes de liberar navegação protegida. [file:1]

## Limitações deste rascunho

- Este documento cobre primeiro os fluxos mais evidentes no trecho extraído: autenticação, sessão, permissões, aplicações visíveis e CRUD administrativo de `permission-overrides`. [file:1]
- O swagger contém muitos outros recursos e schemas além desses; a próxima iteração ideal é expandir este contrato para todos os domínios de tela do frontend. [file:1]

## Catálogo accounts

Seção expandida com **todos** os métodos encontrados sob `/api/accounts`, no formato operacional para uso por IA em prompts de frontend. A API de accounts mistura endpoints públicos de login, endpoints autenticados de sessão corrente e endpoints administrativos restritos, inclusive recursos paginados e mutações com impacto em permissões. [file:1]

### listar_aplicacoes_visiveis_usuario

- Método: `GET`. [file:1]
- Endpoint: `/api/accounts/aplicacoes/`. [file:1]
- operationId: `accounts_aplicacoes_list`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Descrição operacional: GET /api/accounts/aplicacoes/ GET /api/accounts/aplicacoes/{idaplicacao}/ [file:1]
- Uso de UI: montar dashboard, menu ou escolha de aplicações visíveis conforme o usuário autenticado. [file:1]

### detalhar_aplicacao_visivel_usuario

- Método: `GET`. [file:1]
- Endpoint: `/api/accounts/aplicacoes/{id}/`. [file:1]
- operationId: `accounts_aplicacoes_retrieve`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Descrição operacional: GET /api/accounts/aplicacoes/ GET /api/accounts/aplicacoes/{idaplicacao}/ [file:1]
- Uso de UI: montar dashboard, menu ou escolha de aplicações visíveis conforme o usuário autenticado. [file:1]

### listar_aplicacoes_publicas_login

- Método: `GET`. [file:1]
- Endpoint: `/api/accounts/auth/aplicacoes/`. [file:1]
- operationId: `accounts_auth_aplicacoes_list`. [file:1]
- Autenticação: `publica`. [file:1]
- Descrição operacional: GET /api/accounts/auth/aplicacoes/ GET /api/accounts/auth/aplicacoes/{codigointerno}/ [file:1]
- Uso de UI: popular seletor de aplicação na tela de login. [file:1]

### detalhar_aplicacao_publica_por_codigo

- Método: `GET`. [file:1]
- Endpoint: `/api/accounts/auth/aplicacoes/{codigointerno}/`. [file:1]
- operationId: `accounts_auth_aplicacoes_retrieve`. [file:1]
- Autenticação: `publica`. [file:1]
- Descrição operacional: GET /api/accounts/auth/aplicacoes/ GET /api/accounts/auth/aplicacoes/{codigointerno}/ [file:1]
- Uso de UI: recuperar uma aplicação pública específica pelo código para pré-preenchimento ou validação de `app_context`. [file:1]

### resolver_usuario

- Método: `POST`. [file:1]
- Endpoint: `/api/accounts/auth/resolve-user/`. [file:1]
- operationId: `accounts_auth_resolve_user_create`. [file:1]
- Autenticação: `publica`. [file:1]
- Resumo: Resolve username a partir de email ou username. [file:1]
- Descrição operacional: Recebe um identificador (email ou username) e retorna o username [file:1]
- Campos obrigatórios no corpo: `identifier`. [file:1]
- Respostas:
  - `200`: 'Username resolvido: { ''username'': ''...'' }'. [file:1]
  - `404`: sem descrição detalhada no swagger. [file:1]
- Uso de UI: normalizar email ou username digitado antes do login. [file:1]

### login

- Método: `POST`. [file:1]
- Endpoint: `/api/accounts/login/`. [file:1]
- operationId: `accounts_login_create`. [file:1]
- Autenticação: `publica`. [file:1]
- Resumo: Login via sessão. [file:1]
- Descrição operacional: Autentica o usuário e cria uma sessão por aplicação (cookie `gpp_session_{APP}`). [file:1]
- Campos obrigatórios no corpo: `username`, `password`, `app_context`. [file:1]
- Respostas:
  - `200`: Login realizado com sucesso. [file:1]
  - `400`: Credenciais ou app_context não informados. [file:1]
  - `401`: Credenciais inválidas. [file:1]
  - `403`: sem descrição detalhada no swagger. [file:1]
- Pós-condições esperadas no frontend: persistência da sessão por cookie e carregamento imediato de `me` e `me/permissions`. [file:1]

### logout_sessao_atual

- Método: `POST`. [file:1]
- Endpoint: `/api/accounts/logout/`. [file:1]
- operationId: `accounts_logout_create`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Resumo: Logout da sessão atual. [file:1]
- Descrição operacional: Encerra a sessão ativa e revoga o registro em AccountsSession. [file:1]
- Respostas:
  - `200`: sem descrição detalhada no swagger. [file:1]
- Uso de UI: invalidar estado autenticado local, limpar telas protegidas e redirecionar para área pública após sucesso. [file:1]

### logout_por_aplicacao

- Método: `POST`. [file:1]
- Endpoint: `/api/accounts/logout/{app_slug}/`. [file:1]
- operationId: `accounts_logout_create_2`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Parâmetros:
  - `app_slug`; string; em `path`; obrigatório. [file:1]
- Respostas:
  - `200`: sem descrição detalhada no swagger. [file:1]
- Uso de UI: invalidar estado autenticado local, limpar telas protegidas e redirecionar para área pública após sucesso. [file:1]

### carregar_usuario_atual

- Método: `GET`. [file:1]
- Endpoint: `/api/accounts/me/`. [file:1]
- operationId: `accounts_me_retrieve`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Descrição operacional: GET /api/accounts/me/ Retorna dados do usuário autenticado: profile + roles + apps com acesso. [file:1]
- Respostas:
  - `200`: sem descrição detalhada no swagger. [file:1]
- Uso de UI: hidratar dados do usuário autenticado, apps com acesso e informações de perfil no layout principal. [file:1]

### carregar_permissoes_usuario_atual

- Método: `GET`. [file:1]
- Endpoint: `/api/accounts/me/permissions/`. [file:1]
- operationId: `accounts_me_permissions_retrieve`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Descrição operacional: GET /api/accounts/me/permissions/ [file:1]
- Uso de UI: alimentar guards de rota, visibilidade de botões e autorização de ações. [file:1]

### listar_permission_overrides

- Método: `GET`. [file:1]
- Endpoint: `/api/accounts/permission-overrides/`. [file:1]
- operationId: `accounts_permission_overrides_list`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Descrição operacional: CRUD de UserPermissionOverride. Apenas PORTAL_ADMIN. [file:1]
- Regra de acesso: a documentação informa uso restrito a `PORTAL_ADMIN`; mudanças acionam sincronização imediata de permissões do usuário afetado. [file:1]

### criar_permission_override

- Método: `POST`. [file:1]
- Endpoint: `/api/accounts/permission-overrides/`. [file:1]
- operationId: `accounts_permission_overrides_create`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Descrição operacional: CRUD de UserPermissionOverride. Apenas PORTAL_ADMIN. [file:1]
- Regra de acesso: a documentação informa uso restrito a `PORTAL_ADMIN`; mudanças acionam sincronização imediata de permissões do usuário afetado. [file:1]

### detalhar_permission_override

- Método: `GET`. [file:1]
- Endpoint: `/api/accounts/permission-overrides/{id}/`. [file:1]
- operationId: `accounts_permission_overrides_retrieve`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Descrição operacional: CRUD de UserPermissionOverride. Apenas PORTAL_ADMIN. [file:1]
- Regra de acesso: a documentação informa uso restrito a `PORTAL_ADMIN`; mudanças acionam sincronização imediata de permissões do usuário afetado. [file:1]

### atualizar_permission_override

- Método: `PUT`. [file:1]
- Endpoint: `/api/accounts/permission-overrides/{id}/`. [file:1]
- operationId: `accounts_permission_overrides_update`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Descrição operacional: CRUD de UserPermissionOverride. Apenas PORTAL_ADMIN. [file:1]
- Regra de acesso: a documentação informa uso restrito a `PORTAL_ADMIN`; mudanças acionam sincronização imediata de permissões do usuário afetado. [file:1]

### editar_permission_override_parcial

- Método: `PATCH`. [file:1]
- Endpoint: `/api/accounts/permission-overrides/{id}/`. [file:1]
- operationId: `accounts_permission_overrides_partial_update`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Descrição operacional: CRUD de UserPermissionOverride. Apenas PORTAL_ADMIN. [file:1]
- Regra de acesso: a documentação informa uso restrito a `PORTAL_ADMIN`; mudanças acionam sincronização imediata de permissões do usuário afetado. [file:1]

### remover_permission_override

- Método: `DELETE`. [file:1]
- Endpoint: `/api/accounts/permission-overrides/{id}/`. [file:1]
- operationId: `accounts_permission_overrides_destroy`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Descrição operacional: CRUD de UserPermissionOverride. Apenas PORTAL_ADMIN. [file:1]
- Regra de acesso: a documentação informa uso restrito a `PORTAL_ADMIN`; mudanças acionam sincronização imediata de permissões do usuário afetado. [file:1]

### listar_profiles

- Método: `GET`. [file:1]
- Endpoint: `/api/accounts/profiles/`. [file:1]
- operationId: `accounts_profiles_list`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Descrição operacional: APIs de UserProfile. [file:1]
- Respostas:
  - `200`: sem descrição detalhada no swagger (`PaginatedUserProfileList`). [file:1]
- Uso de UI: listagem, visualização e edição parcial de perfis de usuário em telas administrativas ou de gestão cadastral. [file:1]

### detalhar_profile

- Método: `GET`. [file:1]
- Endpoint: `/api/accounts/profiles/{id}/`. [file:1]
- operationId: `accounts_profiles_retrieve`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Descrição operacional: APIs de UserProfile. [file:1]
- Parâmetros:
  - `id`; string; em `path`; obrigatório. [file:1]
- Respostas:
  - `200`: '' (`UserProfile`). [file:1]
- Uso de UI: listagem, visualização e edição parcial de perfis de usuário em telas administrativas ou de gestão cadastral. [file:1]

### editar_profile_parcial

- Método: `PATCH`. [file:1]
- Endpoint: `/api/accounts/profiles/{id}/`. [file:1]
- operationId: `accounts_profiles_partial_update`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Descrição operacional: APIs de UserProfile. [file:1]
- Parâmetros:
  - `id`; string; em `path`; obrigatório. [file:1]
- Respostas:
  - `200`: sem descrição detalhada no swagger (`UserProfile`). [file:1]
- Uso de UI: listagem, visualização e edição parcial de perfis de usuário em telas administrativas ou de gestão cadastral. [file:1]

### listar_roles

- Método: `GET`. [file:1]
- Endpoint: `/api/accounts/roles/`. [file:1]
- operationId: `accounts_roles_list`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Descrição operacional: GET /api/accounts/roles/ GET /api/accounts/roles/{id}/ Acesso exclusivo a PORTAL_ADMIN. [file:1]
- Respostas:
  - `200`: sem descrição detalhada no swagger (`PaginatedRoleList`). [file:1]
- Regra de acesso: o swagger informa acesso exclusivo a `PORTAL_ADMIN`. [file:1]

### detalhar_role

- Método: `GET`. [file:1]
- Endpoint: `/api/accounts/roles/{id}/`. [file:1]
- operationId: `accounts_roles_retrieve`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Descrição operacional: GET /api/accounts/roles/ GET /api/accounts/roles/{id}/ Acesso exclusivo a PORTAL_ADMIN. [file:1]
- Parâmetros:
  - `id`; integer; em `path`; obrigatório — Um valor inteiro único que identifica este Role.. [file:1]
- Respostas:
  - `200`: sem descrição detalhada no swagger (`Role`). [file:1]
- Regra de acesso: o swagger informa acesso exclusivo a `PORTAL_ADMIN`. [file:1]

### listar_user_roles

- Método: `GET`. [file:1]
- Endpoint: `/api/accounts/user-roles/`. [file:1]
- operationId: `accounts_user_roles_list`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Descrição operacional: Gerencia UserRoles. Apenas PORTAL_ADMIN. [file:1]
- Respostas:
  - `200`: '' (`PaginatedUserRoleList`). [file:1]
- Regra de acesso: o swagger informa gerenciamento de `UserRole` apenas para `PORTAL_ADMIN`. [file:1]

### criar_user_role

- Método: `POST`. [file:1]
- Endpoint: `/api/accounts/user-roles/`. [file:1]
- operationId: `accounts_user_roles_create`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Descrição operacional: Gerencia UserRoles. Apenas PORTAL_ADMIN. [file:1]
- Respostas:
  - `201`: sem descrição detalhada no swagger (`UserRole`). [file:1]
- Regra de acesso: o swagger informa gerenciamento de `UserRole` apenas para `PORTAL_ADMIN`. [file:1]

### detalhar_user_role

- Método: `GET`. [file:1]
- Endpoint: `/api/accounts/user-roles/{id}/`. [file:1]
- operationId: `accounts_user_roles_retrieve`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Descrição operacional: Gerencia UserRoles. Apenas PORTAL_ADMIN. [file:1]
- Parâmetros:
  - `id`; integer; em `path`; obrigatório — Um valor inteiro único que identifica este User Role.. [file:1]
- Respostas:
  - `200`: '' (`UserRole`). [file:1]
- Regra de acesso: o swagger informa gerenciamento de `UserRole` apenas para `PORTAL_ADMIN`. [file:1]

### remover_user_role

- Método: `DELETE`. [file:1]
- Endpoint: `/api/accounts/user-roles/{id}/`. [file:1]
- operationId: `accounts_user_roles_destroy`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Descrição operacional: Gerencia UserRoles. Apenas PORTAL_ADMIN. [file:1]
- Parâmetros:
  - `id`; integer; em `path`; obrigatório — Um valor inteiro único que identifica este User Role.. [file:1]
- Respostas:
  - `204`: sem descrição detalhada no swagger. [file:1]
- Regra de acesso: o swagger informa gerenciamento de `UserRole` apenas para `PORTAL_ADMIN`. [file:1]

### criar_usuario_sem_role

- Método: `POST`. [file:1]
- Endpoint: `/api/accounts/users/`. [file:1]
- operationId: `accounts_users_create`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Resumo: Criar usuário (sem role). [file:1]
- Descrição operacional: Cria atomicamente um auth.User e seu UserProfile. [file:1]
- Respostas:
  - `201`: '' (`UserCreate`). [file:1]
  - `400`: Dados inválidos. [file:1]
  - `403`: sem descrição detalhada no swagger. [file:1]
- Uso de UI: fluxo administrativo para criar usuário sem vincular role na mesma operação. [file:1]

### criar_usuario_com_role

- Método: `POST`. [file:1]
- Endpoint: `/api/accounts/users/create-with-role/`. [file:1]
- operationId: `accounts_users_create_with_role_create`. [file:1]
- Autenticação: `sessao_cookie`. [file:1]
- Resumo: Criar usuário com role (fluxo completo). [file:1]
- Descrição operacional: Cria atomicamente auth.User + UserProfile + UserRole e dispara [file:1]
- Respostas:
  - `201`: Usuário criado com role. [file:1]
  - `403`: sem descrição detalhada no swagger. [file:1]
- Uso de UI: fluxo completo de criação com perfil e role já atribuída em uma única ação. [file:1]

## Core e Portal

| Método | Endpoint | operationId |

| POST | `/api/core/frontendlog/` | `core_frontendlog_create`
| GET | `/api/portal/aplicacoes/` | `portal_aplicacoes_list`
| GET | `/api/portal/aplicacoes/{idaplicacao}/` | `portal_aplicacoes_retrieve`
| GET | `/api/portal/dashboard/` | `portal_dashboard_retrieve`

`core_frontendlog_create`  : Recebe eventos de erro/log gerados pelo frontend e os registra no logger de segurança do servidor. Requer autenticação.
{
"level": "error",
"message": "TypeError: Cannot read properties of null",
"context": {
"page": "/dashboard",
"user_agent": "Mozilla/5.0"
}
}
Responses Code
200 {"status": "ok"}
401 Não autenticado

`portal_aplicacoes_list` : GET /api/portal/aplicacoes/ → lista apps visíveis no portal. Requer autenticação.
Parameters
page - integer -
page_size - integer - Número de resultados a serem retornados por página.

Resposse:
200
{
"count": 123,
"next": "http://api.example.org/accounts/?page=4",
"previous": "http://api.example.org/accounts/?page=2",
"results": [
{
"idaplicacao": 0,
"codigointerno": "string",
"nomeaplicacao": "string",
"base_url": "string",
"isshowinportal": true
}
]
}
403 - Usuário não autenticado ou sem permissão

`portal_aplicacoes_retrieve` - GET /api/portal/aplicacoes/{id}/ → detalhe de uma app Requer autenticação.
Parameters
idaplicacao * - integer - Um valor inteiro único que identifica este Aplicação.
Response:
200:
{
"idaplicacao": 0,
"codigointerno": "string",
"nomeaplicacao": "string",
"base_url": "string",
"isshowinportal": true
}
401 Não autenticado

`portal_dashboard_retrieve`  - Retorna todas as aplicações que o usuário autenticado tem permissão para acessar, retorna também os perfis do usuário para cada aplicação que está cadastrada.
Response:
200
{
"aplicacoes": [
{
"idaplicacao": 0,
"codigointerno": "string",
"nomeaplicacao": "string",
"base_url": "string",
"isshowinportal": true
}
],
"roles": [
{
"id": 0,
"aplicacao_codigo": "string",
"role_codigo": "string",
"role_nome": "string"
}
]
}
403
Usuário não autenticado ou sem permissão

Perfeito — abaixo está no mesmo formato para você colar e atualizar o markdown.

```md
### core_frontendlog_create

- Método: `POST`.
- Endpoint: `/api/core/frontendlog/`.
- operationId: `core_frontendlog_create`.
- Autenticação: `sessao_cookie`.
- Descrição operacional: Recebe eventos de erro/log gerados pelo frontend e os registra no logger de segurança do servidor.
- Campos obrigatórios no corpo:
  - `level`
  - `message`
  - `context`
- Uso de UI:
  - Enviar logs de erro do frontend para observabilidade e auditoria.
  - Registrar falhas inesperadas, exceções de runtime e contexto mínimo da tela.
- Exemplo de payload:
```json
{
  "level": "error",
  "message": "TypeError: Cannot read properties of null",
  "context": {
    "page": "/dashboard",
    "user_agent": "Mozilla/5.0"
  }
}
```

- Respostas:
    - `200`: `{"status":"ok"}`.
    - `401`: Não autenticado.

```

```md
### portal_aplicacoes_list

- Método: `GET`.
- Endpoint: `/api/portal/aplicacoes/`.
- operationId: `portal_aplicacoes_list`.
- Autenticação: `sessao_cookie`.
- Descrição operacional: Lista as aplicações visíveis no portal.
- Parâmetros:
  - `page` — integer — opcional.
  - `page_size` — integer — opcional — número de resultados a serem retornados por página.
- Uso de UI:
  - Popular listagens, cards ou menus de aplicações no portal.
  - Permitir paginação em telas administrativas ou de navegação por apps.
- Resposta de sucesso:
  - `200` com paginação.
- Exemplo de resposta:
```json
{
  "count": 123,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    {
      "idaplicacao": 0,
      "codigointerno": "string",
      "nomeaplicacao": "string",
      "base_url": "string",
      "isshowinportal": true
    }
  ]
}
```

- Respostas:
    - `403`: Usuário não autenticado ou sem permissão.

```

```md
### portal_aplicacoes_retrieve

- Método: `GET`.
- Endpoint: `/api/portal/aplicacoes/{idaplicacao}/`.
- operationId: `portal_aplicacoes_retrieve`.
- Autenticação: `sessao_cookie`.
- Descrição operacional: Retorna o detalhe de uma aplicação.
- Parâmetros:
  - `idaplicacao` — integer — obrigatório — identificador único da aplicação.
- Uso de UI:
  - Abrir detalhe de uma aplicação em tela lateral, modal ou página de detalhes.
  - Reutilizar os dados para edição, inspeção ou navegação contextual.
- Resposta de sucesso:
  - `200` com objeto `Aplicacao`.
- Exemplo de resposta:
```json
{
  "idaplicacao": 0,
  "codigointerno": "string",
  "nomeaplicacao": "string",
  "base_url": "string",
  "isshowinportal": true
}
```

- Respostas:
    - `401`: Não autenticado.

```

```md
### portal_dashboard_retrieve

- Método: `GET`.
- Endpoint: `/api/portal/dashboard/`.
- operationId: `portal_dashboard_retrieve`.
- Autenticação: `sessao_cookie`.
- Descrição operacional: Retorna todas as aplicações que o usuário autenticado tem permissão para acessar e também os perfis do usuário para cada aplicação cadastrada.
- Uso de UI:
  - Montar o dashboard principal do portal após o login.
  - Mostrar as aplicações disponíveis e os perfis vinculados ao usuário.
  - Servir como resposta agregada para inicialização da home autenticada.
- Resposta de sucesso:
  - `200` com objeto contendo `aplicacoes` e `roles`.
- Exemplo de resposta:
```json
{
  "aplicacoes": [
    {
      "idaplicacao": 0,
      "codigointerno": "string",
      "nomeaplicacao": "string",
      "base_url": "string",
      "isshowinportal": true
    }
  ],
  "roles": [
    {
      "id": 0,
      "aplicacao_codigo": "string",
      "role_codigo": "string",
      "role_nome": "string"
    }
  ]
}
```

- Respostas:
    - `403`: Usuário não autenticado ou sem permissão.