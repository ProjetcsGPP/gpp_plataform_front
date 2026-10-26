# Assessment arquitetural do frontend — PUBLICACOES

**Status:** auditoria inicial preservada e gate de segurança `PUB-008` concluído  
**Data da auditoria:** 2026-10-23  
**Último alinhamento transversal:** 2026-10-23  
**Branch auditada:** `feat/publicacoes-informacoes`  
**Commit auditado:** `1b657cb`  
**Escopo:** frontend, integração com os contratos planejados no backend e
transformação do Portal

**Referência transversal:**
[`backend/docs/SHARED/PUBLICACOES_INTEGRATION_MATRIX.md`](../../../backend/docs/SHARED/PUBLICACOES_INTEGRATION_MATRIX.md).
Os IDs `PUB-*` citados abaixo têm o significado e o status definidos nessa
matriz.

## 1. Premissas obrigatórias

- Preservar o Axios compartilhado e seus interceptors.
- Preservar SWR como mecanismo de consulta e invalidação de cache.
- Preservar `AppContext`, Zustand, hidratação de autenticação e sessões por
  aplicação.
- Preservar navegação dinâmica, manifests locais e menus entregues pelo
  backend.
- Manter capability como distribuição funcional e permissões técnicas como
  autorização de ações.
- Não verificar nomes de roles em componentes.
- Não recalcular no frontend indicadores ou regras canônicas.
- Não presumir contratos, layouts, gráficos, eventos ou regras de aplicações
  de origem.

## 2. Resumo executivo

A arquitetura atual aceita `PUBLICACOES` como extensão aditiva. O gate de
autenticação `PUB-008` foi concluído; a implementação funcional ainda deve
respeitar os demais bloqueios e contratos públicos e administrativos.

Os principais bloqueios são:

1. `/portal` ainda é protegido por cookie e não possui página pública;
2. na auditoria inicial, o login usava resolução enumerável e não inicializava
   CSRF; a correção frontend de `PUB-008` está registrada na seção 13;
3. validade de sessão, usuário ativo e throttling foram endurecidos e testados
   no backend; a integração frontend depende das evidências da seção 13;
4. não existe isolamento explícito entre cache público e autenticado;
5. cards, rotas e tipos de aplicação ainda estão fechados às aplicações atuais;
6. workflow, dashboard, gráficos e APIs administrativas ainda não possuem
   contratos implementáveis.

## 3. Conflitos por severidade

### 3.1 Críticos

#### Portal público inexistente e bloqueado

Não existe `src/app/portal/page.tsx`. Além disso, `src/proxy.ts` exige o cookie
`gpp_session_PORTAL` para o prefixo `/portal`. Isso conflita diretamente com a
decisão de apresentar a publicação vigente ao visitante sem autenticação.

#### Enumeração de usuário no fluxo de login — corrigido no frontend

Na auditoria, `src/lib/auth.ts` chamava o endpoint enumerável quando o
identificador continha `@`. A integração agora envia `identifier` diretamente
ao login, sem resolução ou fallback, e a interface apresenta falha genérica.

#### CSRF sem bootstrap garantido — corrigido no frontend

O Axios compartilhado inicializa `csrftoken` por
`GET /api/accounts/auth/csrf/` antes da primeira mutação, deduplica chamadas
concorrentes e relê o cookie antes de cada mutação para respeitar rotação.

#### Gates P0 externos ao frontend — implementados no backend

Expiração e revogação de sessão, validação de usuário ativo e throttling de
login foram implementados e testados no backend. O comportamento de
`PORTAL_ADMIN` está decidido em `PUB-010` e não autoriza bypass de regras de
domínio.

### 3.2 Altos

#### AppContext incompleto

`PUBLICACOES` ainda não existe em:

- `AppContext` e `APP_CONFIG`;
- mapas de login e logout;
- mapa de manifests de navegação;
- proxy e cookie por aplicação;
- tipos das respostas de autenticação, permissões e menus;
- tema e manifest local.

O uso de tipos `Record<AppContext, ...>` é positivo porque força uma extensão
exaustiva e reduz configurações esquecidas.

#### Cache público e autenticado sem fronteira explícita

SWR usa atualmente o cache global. Chaves distintas evitam colisões simples,
mas não definem isolamento, retenção, invalidação ou política de erro entre os
dois domínios. O Portal público precisa continuar em SWR, com chaves
namespaced e uma fronteira de cache explicitamente testada.

#### Interceptor de 401 incompatível com chamada pública

O interceptor compartilhado interpreta qualquer `401` como expiração de
sessão e redireciona para login com base no `appContext` ou pathname. Chamadas
públicas precisam ser identificadas dentro do mesmo mecanismo compartilhado
para que um erro público não seja tratado como expiração de sessão.

#### Requisições públicas enviam credenciais por padrão

O Axios usa `withCredentials: true`. Para conteúdo público, o backend e o
gateway precisam garantir que a representação não varie conforme cookie e que
respostas públicas e autenticadas jamais compartilhem cache indevidamente.

#### Cards de aplicações hardcoded

O dashboard autenticado:

- faz cast para os três `AppContext` atuais;
- conhece explicitamente apenas as rotas de ACOES e CARGA;
- cruza aplicações com presença de roles no browser;
- abre aplicações em nova aba por regra local.

O backend deve devolver as aplicações funcionalmente disponíveis e seu destino
aprovado. O frontend valida/normaliza esse destino, sem condicionais por nome de
role ou catálogo duplicado.

#### Login não está extraído

`LoginPage` mistura branding, formulário, carregamento de aplicações e layout.
O componente recebe `sessionExpiredMessage`, mas não o renderiza; o parâmetro
`redirect` da rota também não é aplicado. A transformação exige um `LoginForm`
reutilizável e um `LoginDialog` acessível, preservando hard navigation após o
login quando necessária para persistência do cookie.

#### Cobertura incompleta do proxy atual

O matcher cobre todo ACOES, mas somente `/carga-org-lot/dashboard/:path*` para
CARGA, apesar de existirem outras rotas autenticadas. A autorização final é do
backend, porém o padrão não deve ser repetido em `PUBLICACOES`.

#### Administração genérica limitada

Os recursos administrativos compartilhados são úteis para CRUD simples, mas
pressupõem:

- IDs numéricos;
- list/detail/create/patch;
- formulário predominantemente textual;
- permissões view/add/change;
- paginação DRF convencional.

Publicação, revogação, substituição, preview, histórico, relatórios,
concorrência e credenciais de exibição única exigem composição ou extensão
controlada desses primitives, não um mecanismo paralelo.

### 3.3 Médios

- `portal/layout.tsx` aplica o cabeçalho sem login também sobre áreas que montam
  `AppShell`; os layouts público e autenticado precisam ser separados por route
  groups ou estrutura equivalente.
- O Axios singleton, relativo a `/api` e acoplado ao Zustand, é adequado ao CSR,
  mas não deve ser importado diretamente em SSR porque estado global pode vazar
  entre requisições.
- Não há tratamento explícito de `ETag`, `Last-Modified`, `304`,
  `stale-if-error` ou invalidação do ponteiro da publicação vigente.
- O dashboard autenticado não apresenta um estado de erro dedicado.
- Não há biblioteca de gráficos instalada; isso não autoriza escolher uma antes
  do contrato público.
- Há tokens de tema por aplicação, mas componentes ainda usam cores blue/slate
  hardcoded.
- Acessibilidade apresenta lacunas em navegação por teclado, nomes acessíveis,
  mensagens dinâmicas e redução de movimento.
- Sidebar fixa e alguns cabeçalhos ainda não formam uma navegação móvel
  completa.
- `next.config.ts` aponta o proxy da API para `localhost:8000`; gateway e origem
  de produção precisam ser definidos.
- As versões principais de `next` e `eslint-config-next` não estão alinhadas.

## 4. Informações ausentes ou ambíguas

### Produto e governança

- nome funcional final;
- publicação por uma ou duas pessoas;
- primeiro conjunto de dados piloto;
- classificação campo a campo;
- retenção, SLA, RPO, RTO e responsáveis.

### Portal e autenticação

- `/portal` muda de conteúdo conforme sessão ou a área autenticada permanece em
  `/portal/dashboard`;
- semântica compatível de `/portal/login` e do parâmetro `redirect`;
- mesma aba ou nova aba para cards;
- comportamento sem publicação, após revogação ou em degradação;
- requisitos de SEO e SSR;
- navegadores e meta de acessibilidade.

### Conteúdo público

- schema do dashboard e política de compatibilidade;
- tipos de indicadores e visualizações admitidos;
- unidades, precisão, locale, fuso e períodos;
- histórico público, filtros, exportações e paginação;
- proveniência exibível;
- alternativa tabular/textual dos gráficos.

### Administração

- arquitetura de informação inicial;
- permissões Django e permissões de ação definitivas;
- transições e `acoes_disponiveis`;
- concorrência e pré-condições de atualização;
- formato de erros e relatórios de validação;
- contrato de preview e de segredo de exibição única.

## 5. Decisões e definições necessárias antes de implementar

1. Comprovar e registrar o fechamento integrado de `PUB-008`.
2. Aprovar a matriz de rotas públicas e autenticadas.
3. Decidir CSR, SSR ou estratégia híbrida para o Portal público.
4. Definir isolamento de cache público/autenticado dentro do SWR existente.
5. Definir cache HTTP, `ETag`, invalidação e fallback de erro.
6. Implementar a decisão de login por `identifier` (`PUB-015`) e detalhar o
   bootstrap CSRF exigido pelo bloqueio `PUB-008`.
7. Definir a compatibilidade de `/portal/login` e redirect seguro.
8. Detalhar o DTO autoritativo dos cards, já decidido em `PUB-016`, incluindo
   destinos, estados, disponibilidade e validação de URL.
9. Aprovar menus, capabilities e permissões de `PUBLICACOES`.
10. Implementar a decisão de ator único de `PUB-009` e aprovar o contrato de
    concorrência ainda pendente em `PUB-018`.
11. Aprovar o contrato público antes de definir gráficos ou layout final.
12. Definir preview, erros e tratamento de credenciais de consumidor.

As direções arquiteturais de login e cards não estão mais pendentes: `PUB-015`
e `PUB-016` estão `DECIDIDO`. Permanecem pendentes seus contratos executáveis e
o atendimento aos critérios de aceite e bloqueios relacionados.

## 6. Mapa de impacto

### Infraestrutura compartilhada

- `src/types/auth.ts`
- `src/types/navigation.ts`
- `src/lib/api.ts`
- `src/lib/auth.ts`
- `src/lib/permissions.ts`
- `src/proxy.ts`
- `src/hooks/useNavigation.ts`
- `src/hooks/useNavigationMenus.ts`
- `src/hooks/useMe.ts`
- `src/hooks/usePermissionsHydrator.ts`
- `src/store/authStore.ts`
- `src/store/permissionsStore.ts`
- `src/store/navigationStore.ts`

### Portal e autenticação

- novo `src/app/portal/page.tsx`
- `src/app/portal/layout.tsx`
- `src/app/portal/login/**`
- `src/app/portal/dashboard/**`
- `src/app/portal/error.tsx`
- `src/app/portal/not-found.tsx`
- `src/components/auth/LoginPage.tsx`
- novos `LoginForm`, `LoginDialog` e componentes públicos
- `src/hooks/usePortalDashboard.ts`, mantendo-o autenticado

### PUBLICACOES

- novo `src/app/publicacoes/**`
- novo `src/features/publicacoes/**`
- novo `public/nav/PUBLICACOES.json`
- `src/app/globals.css`
- `src/components/layout/AppShell.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/TopBar.tsx`

### Administração reutilizável

- `src/lib/adminResource.ts`
- `src/types/adminResource.ts`
- `src/hooks/useAdminResource.ts`
- `src/components/admin/**`

### Testes

- `src/__tests__/middleware.test.ts`
- testes de auth, Axios, stores, hydrators, navegação e permissões
- novos testes de Portal público, modal, cache e `features/publicacoes`
- camada E2E Playwright para autenticação; ampliar futuramente para full-stack,
  `PUBLICACOES` e acessibilidade

## 7. Contratos necessários do backend

### Identidade, sessão e autorização

- login por `identifier`, sem resolução enumerável;
- bootstrap e regras de CSRF;
- nomes, path, `Secure`, `SameSite` e expiração dos cookies;
- código, slug e cookie de `PUBLICACOES`;
- suporte em `/me`, permissions, menus, capabilities, switch e logout;
- códigos estáveis de menus e permissões técnicas definitivas.

### Portal autenticado

- lista autoritativa de aplicações disponíveis ao usuário;
- destino aprovado, estado, manutenção e disponibilidade;
- regra de abertura e compatibilidade do switch de aplicação;
- ausência de necessidade de o browser interpretar nomes de roles.

### Administração PUBLICACOES

- OpenAPI de listas, detalhes, criação e alterações;
- IDs, paginação, filtros e ordenação;
- workflow e `acoes_disponiveis`;
- justificativas e histórico;
- erros estruturados e relatórios de validação;
- controle de concorrência;
- DTO de preview `no-store`;
- contratos de credenciais, rotação e revogação.

### API pública

- `publication_id`, versão, competência e `schema_version`;
- instante de publicação e proveniência permitida;
- valores, unidades, precisão, dimensões e séries já calculados;
- paginação e limites;
- semântica de ausência, revogação, rate limit e indisponibilidade;
- `ETag`, `Last-Modified`, `Cache-Control`, TTL e invalidação;
- correlation ID e erros sem dados sensíveis.

## 8. Riscos de segurança e compatibilidade

- cache público contaminado por sessão ou preview;
- open redirect;
- XSS por conteúdo rico não estruturado;
- segredo persistido em SWR, Zustand, log, telemetria ou histórico;
- seleção do cookie errado em ambiente multiapp;
- autorização derivada de role ou estado local obsoleto;
- URL arbitrária em cards;
- bypass editorial não aprovado;
- gráficos sem alternativa acessível;
- dependência externa de fontes/ícones;
- quebra de favoritos em `/portal/login`;
- uso de singleton client-side em SSR;
- incompatibilidade silenciosa de `schema_version`.

## 9. Fases frontend propostas

### F0 — contratos e segurança

ADRs, matriz de rotas, sessão/CSRF, cache, threat model, OpenAPI e fixtures
sintéticas.

### F1 — fundação da aplicação

`AppContext`, configuração, cookie, proxy, tema, manifest, shell, permissões e
navegação dinâmica.

### F2 — vertical editorial

Rascunho, validação, preview, histórico e ações autorizadas pelo backend, sem
integração de fonte presumida.

### F3 — Portal público

Dashboard vigente, cache isolado, estados de erro, login em modal,
compatibilidade de rota e cards autenticados.

### F4 — fontes internas

Contratos, snapshots, execuções e reconciliação somente após aprovação do
piloto.

### F5 — APIs externas e arquivos

Quarentena, relatórios e acompanhamento, sem exposição de segredos.

### F6 — consumidores

Cadastro, escopos, quotas, rotação, revogação e segredo exibido uma vez.

### F7 — hardening e go-live

Acessibilidade, responsividade, E2E, observabilidade, carga, rollback e rollout
progressivo.

## 10. Estratégia de testes

- testes unitários de adapters, permissões, actions e formatação;
- matriz de proxy para rotas públicas e cookies por aplicação;
- interceptors de CSRF, `401`, logout e modo público;
- isolamento e invalidação de caches SWR;
- testes de contrato por `schema_version`;
- acessibilidade do modal, teclado, foco e mensagens dinâmicas;
- estados vigente, ausente, revogado, `429`, offline e `5xx`;
- integração de `ETag` e cache no gateway;
- negação e concessão para cada permissão técnica;
- E2E de visitante, login, cards, `PUBLICACOES` e logout independente;
- contraste, zoom, redução de movimento e viewports;
- lint, `tsc --noEmit`, Vitest e build em cada gate;
- testes backend de CSRF, IDOR, concorrência e não vazamento.

## 11. Estratégia de rollout

- feature flags independentes para Portal público e card de `PUBLICACOES`;
- homologação com publicação sintética;
- preservação temporária de `/portal/login` e `/portal/dashboard`;
- Portal público somente leitura como primeira ativação;
- administrativo restrito ao piloto e a permissões explícitas;
- observabilidade de erros, latência, cache e incompatibilidade de schema;
- rollback de rotas sem exclusão de publicação ou histórico;
- proibição de go-live enquanto houver P0 aberto.

## 12. Critérios para atualizar este assessment

Atualizar este documento quando houver mudança aprovada em:

- fronteira público/autenticado;
- sessão, CSRF ou cookies;
- contrato de dashboard ou `schema_version`;
- capabilities, menus ou permissões;
- workflow editorial;
- SSR/cache/ETag;
- estratégia de gráficos e acessibilidade;
- fases, gates ou rollout.

Novas conversas devem ser registradas primeiro em
`DECISIONS_AND_INPUTS.md`, com origem, status e ID `PUB-*` correspondente. Uma
mudança transversal deve atualizar também a matriz compartilhada e seu
histórico na mesma entrega.

## 13. Fechamento do gate PUB-008

**Resultado em 2026-10-23:** critérios de aceite comprovados; `PUB-008` foi
promovido de `BLOQUEADO` para `DECIDIDO`, encerrando o bloqueio P0 de F0.

### Implementação frontend

- o Axios compartilhado continua sendo o único cliente e preserva
  `withCredentials`, interceptors e integração com Zustand;
- `GET /api/accounts/auth/csrf/` inicializa `csrftoken` antes da primeira
  mutação e chamadas concorrentes compartilham o mesmo bootstrap;
- o interceptor relê o cookie e envia `X-CSRFToken` em `POST`, `PUT`, `PATCH`
  e `DELETE`, inclusive no logout seletivo;
- o login envia somente `identifier`, `password` e `app_context`, sem chamada,
  dependência ou fallback enumerável;
- `400`, `401` e `403` do login usam a mesma mensagem; `429`, falha de rede e
  `5xx` têm mensagens operacionais sem dados sensíveis;
- respostas `401` autenticadas tratam igualmente sessão expirada, revogada,
  usuário inativo e contexto divergente; respostas públicas não acionam esse
  fluxo;
- o retorno pós-login aceita apenas caminho relativo da mesma aplicação e
  rejeita URL externa, protocol-relative, barra invertida, outra aplicação e
  loop para login;
- `switch-app` envia apenas `app_context`; nenhuma arquitetura paralela de
  autenticação, SWR, navegação, capability ou permissão foi criada.

### Evidências

| Verificação | Resultado |
|---|---|
| Backend focado | 25 testes de segurança aprovados, conforme matriz compartilhada |
| Backend completo | 1.130 aprovados, 1 ignorado, cobertura 87,46%, conforme matriz compartilhada |
| Frontend Vitest | 59 arquivos, 318 testes aprovados |
| Frontend lint | aprovado, sem erros; 9 avisos preexistentes fora do escopo |
| Frontend typecheck | `tsc --noEmit` aprovado |
| Frontend build | `next build --webpack` aprovado; o Turbopack isolado falhou por restrição ambiental de binding de porta |
| Busca de consumidor | nenhum uso de `resolve-user` em `src/` |
| E2E em navegador | Playwright/Chromium: 13 testes aprovados em 2026-10-26; frontend real com fronteira HTTP controlada e dados exclusivamente sintéticos |

Os testes frontend cobrem bootstrap e falha de CSRF, token rotacionado, login
válido, identificadores opacos, identificador inexistente, senha inválida,
usuário inativo, sessão expirada/revogada/contexto divergente, logout seletivo,
ausência de enumeração, indisponibilidade e respostas `401`, `403`, `429` e
`5xx`. O backend comprova as negações efetivas de CSRF, sessão e brute force;
o frontend comprova o consumo e a apresentação seguros do contrato.

Em 2026-10-26, a evidência foi ampliada com Playwright. A suíte em
`e2e/auth-security.spec.ts` executa o frontend real no Chromium e cobre login,
cookies, CSRF, não enumeração, `429`, indisponibilidade, sessões inválidas,
open redirect e logout seletivo. Ela controla a fronteira `/api`; uma execução
full-stack com Django/PostgreSQL reais continua dependendo de ambiente efêmero
e fixtures backend isoladas.

## 14. Alerta de dependências — 2026-10-26

Uma consulta ao banco de advisories do npm, executada após a instalação do
Playwright, reportou 14 vulnerabilidades no grafo atual: 1 crítica, 8 altas e 5
moderadas. O achado mais urgente é o `next@16.3.6`, apontado por advisories de
execução remota, SSRF, indisponibilidade e cache; a versão corrente publicada é
`16.4.3`. Também há correções disponíveis para `vitest@4.1.11`,
`shadcn@4.21.0` e dependências transitivas.

Não foi executado `npm audit fix`, pois upgrades automáticos podem alterar
versões e contratos sem revisão. Recomenda-se uma entrega de segurança
separada, prioritária, começando por Next `16.4.3`, Vitest `4.1.12` ou superior
compatível e shadcn `4.22.1`, seguida pelas suítes Vitest/Playwright, build e
novo `npm audit`. Esse alerta não reabre o contrato específico de autenticação
de `PUB-008`, mas deve bloquear exposição pública até a remediação ou aceitação
formal do risco.
