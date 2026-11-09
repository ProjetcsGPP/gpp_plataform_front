# Plano de correção e implementação do frontend — `PUBLICACOES`

**Data da revisão:** 2026-11-03  
**Branch/commit verificados:** `feat/publicacoes-informacoes` em `623f58b`  
**Estado:** planejamento proposto; implementação funcional não
autorizada enquanto os gates de F0 permanecerem abertos  
**Referências canônicas:** `PUB-001` a `PUB-027`, ADR-0001 a ADR-0006 e
`PUBLICACOES_CURRENT_STATE_ASSESSMENT.md`

## 1. Objetivo e limites

Este plano converte as decisões transversais já aprovadas e o estado atual do
frontend em unidades executáveis de trabalho. Ele não define schemas de API,
nomes finais de permissões, gráficos, layout visual final, regras de fonte ou
estados funcionais que ainda dependem de contrato.

Até a liberação de F1, o trabalho permitido no frontend é documental e de
preparação de critérios de aceite. Não devem ser criados `AppContext`, rotas,
fixtures, telas, adapters ou testes sintéticos de `PUBLICACOES` para contornar o
gate de pré-implementação.

## 2. Correções documentais e técnicas identificadas

### 2.1 Correções documentais imediatas

1. Sincronizar o assessment local com a reconfirmação de 2026-11-03.
2. Marcar como decididos, e não pendentes:
   - mesmo gestor prepara e publica (`PUB-009`);
   - matriz de rotas e redirects (`PUB-012`);
   - SSR público e CSR autenticado (`PUB-013`);
   - fronteiras de cache público, autenticado e preview (`PUB-014`).
3. Remover como achado atual a ausência da mensagem de sessão expirada; o
   componente já a renderiza e o comportamento possui teste de regressão.
4. Substituir o alerta histórico de Next `16.3.6` e 14 vulnerabilidades pelo
   retrato atual: Next e `eslint-config-next` `16.4.3`, Vitest `4.1.12`, zero
   vulnerabilidades de runtime e 22 achados no grafo completo de desenvolvimento
   conforme a auditoria canônica de 2026-11-03.
5. Registrar a inconsistência de escopo em
   `PRE_IMPLEMENTATION_CHECKLIST.md`: o preflight de um gate limitado a DEV
   menciona “deploy em HML”. O backend deve esclarecer se a evidência pretendida
   é deploy/rollback local de DEV ou se esse item pertence ao gate futuro de HML.
6. Tratar `ARCHITECTURE.md` como proposta controlada nos trechos de modelo,
   workflow e endpoints. Os exemplos ali não substituem `PUB-017`, `PUB-018` nem
   OpenAPI aprovado.

### 2.2 Correções funcionais confirmadas para fases futuras

| Ponto atual | Correção necessária | Decisão/gate |
|---|---|---|
| `/` redireciona para `/portal/login` | Redirecionar de forma controlada para `/portal` | `PUB-012`, F3 |
| `/portal` não possui `page.tsx` e todo o prefixo é protegido | Tornar somente `/portal` público por igualdade exata e manter os demais prefixos explicitamente autenticados | `PUB-012`, F3 |
| Bypasses do proxy usam `startsWith` ou `includes` | Substituir por classificação central de rotas, sem liberação acidental por substring | `PUB-012`, F1/F3 |
| Manutenção pública usa `NEXT_PUBLIC_PORTAL_MAINTENANCE` | Migrar o controle de exposição para configuração/flag server-side | `PUB-012`, rollback |
| `PUBLICACOES` não existe em `AppContext` | Estender tipos, configuração, auth, navegação, tema, cookie e testes de forma exaustiva | `PUB-001`, `PUB-019`, F1 |
| Axios browser envia credenciais por padrão | Preservar o singleton, mas usar modo público com credenciais desabilitadas; SSR usa adapter server-only | `PUB-013`, F3 |
| `401` público pode ser confundido com sessão | Manter `gppAuthMode: "public"` em toda consulta pública e testar que não limpa auth nem abre login | `PUB-013`, F3 |
| Não há página/adapter SSR público | Criar fetch server-only com origem interna não pública, timeout e sem encaminhar cookies/Authorization | `PUB-013`, `INF-009`, F3 |
| SWR usa cache global | Criar providers separados para público, administrativo e preview efêmero | `PUB-014`, F3 |
| Não há contrato `ETag`/`304` no frontend | Preservar e revalidar o DTO público conforme headers aprovados, sem `stale-if-error` no ponteiro vigente | `PUB-014`, F3 |
| Dashboard cruza `roles` e aplicações | Consumir DTO autoritativo de aplicações sem decidir acesso no navegador | `PUB-016`, F3 |
| Destinos são condicionais hardcoded | Validar destino entregue pelo backend contra allowlist central e navegar segundo o contrato aprovado | `PUB-016`, F3 |
| `LoginPage` concentra formulário, branding e página | Extrair `LoginForm` e compor `LoginDialog` acessível no Portal público | `PUB-012`, `PUB-015`, F3 |
| Layout raiz de Portal monta provider client-side também no público | Separar árvores pública e autenticada por route groups, sem mudar URLs | `PUB-012`, `PUB-013`, F3 |
| Recursos admin assumem ID numérico e CRUD simples | Generalizar apenas o necessário para recursos simples; implementar workflow editorial por composição própria | `PUB-018`, F1/F2 |
| Permissões de `PUBLICACOES` não existem no registry | Adicionar somente após catálogo IAM definitivo, sem strings literais em componentes | `PUB-019`, F1 |
| Estados público/erro ainda não têm contrato | Implementar somente após matriz de ausência, revogação, `429`, offline e `5xx` | `PUB-024`, F3 |
| Acessibilidade e navegadores não têm meta aprovada | Fixar baseline antes do aceite visual e E2E | `PUB-025`, F3/F7 |

## 3. Dependências que bloqueiam implementação

### Gate global para iniciar F1

F1 somente pode começar quando houver evidência e atualização da matriz para:

- responsáveis, piloto e classificação campo a campo (`PRE-001` a `PRE-003`,
  `PUB-011`);
- PostgreSQL on-premises real, egress, observabilidade e tratamento formal dos
  achados de cadeia de fornecimento (`PUB-020`);
- responsáveis operacionais, métricas, traces, correlação e alertas (`PUB-022`);
- checklist `PRE-001` a `PRE-016` aplicável concluído;
- autorização explícita para criar a fundação backend e frontend.

### Contratos necessários por capacidade

| Contrato | Necessário antes de | Conteúdo mínimo para o frontend |
|---|---|---|
| IAM (`PUB-019`) | F1 | código de app, slug/cookie, capabilities, menus e permissões técnicas |
| Administrativo (`PUB-018`) | F1/F2 | recursos, IDs, paginação, filtros, ações, transições, erros, preview e concorrência |
| Cards (`PUB-016`) | F3 | código estável, destino permitido, estado, disponibilidade e regra de abertura |
| Público (`PUB-017`) | F3 | `schema_version`, campos, valores calculados, unidades, precisão, locale, fuso, períodos e proveniência |
| Estados públicos (`PUB-024`) | F3 | ausência, revogação, histórico, `429`, offline, timeout e `5xx` |
| Qualidade (`PUB-025`) | F3/F7 | navegadores, viewports e meta verificável de acessibilidade |
| M2M (`PUB-021`) | F6 | emissão, exibição única, escopos, quota, rotação e revogação |

## 4. Arquitetura frontend planejada

### 4.1 Fronteiras de módulos

- `src/app/publicacoes/**`: rotas e composição da área administrativa.
- `src/features/publicacoes/**`: tipos derivados de contrato, adapters, chaves
  SWR, hooks e componentes de apresentação.
- `src/app/portal/**`: composição pública e autenticada do Portal.
- `src/lib/api.ts`: único cliente HTTP browser-side; não será duplicado.
- adapter server-only novo: exclusivamente `fetch` no servidor, sem importar
  Axios browser, Zustand ou cookies da requisição.
- infraestrutura compartilhada de auth, navegação, permissões e admin será
  estendida, não copiada.

### 4.2 Rotas aprovadas

| Rota | Renderização | Acesso | Resultado planejado |
|---|---|---|---|
| `/` | server redirect | público | encaminha para `/portal` |
| `/portal` | SSR + hidratação limitada | público | publicação vigente e entrada do modal |
| `/portal?login=1` | SSR + client island | público | abre modal de login |
| `/portal/login` | redirect compatível | público | normaliza para `/portal?login=1` |
| `/portal/dashboard` | CSR | autenticado | aplicações autoritativas do backend |
| `/portal/aplicacoes` | CSR | autenticado | mantém contrato próprio do Portal |
| `/portal/usuarios` | CSR | autenticado | mantém guards e permissões técnicas |
| `/publicacoes/**` | CSR | autenticado | administração da nova aplicação |

Route groups devem separar os layouts público e autenticado sem alterar essas
URLs. O proxy continuará apenas como verificação otimista por cookie; autorização
e validade real da sessão permanecem no backend.

### 4.3 Dados e cache

- Chaves públicas: prefixo `publicacoes:public:v1`.
- Chaves administrativas: prefixo `publicacoes:admin:v1`.
- Preview: provider efêmero, sem persistência e sem compartilhamento.
- Fallback SSR: somente DTO público permitido e serializável.
- Login/logout não promovem nem copiam cache público para o autenticado.
- Publicação/substituição/revogação revalidam o ponteiro vigente pelo mecanismo
  definido no contrato, além da revalidação HTTP por `ETag`.
- Nenhum segredo, preview, justificativa restrita ou resposta administrativa pode
  entrar em Zustand, cache público, logs do browser ou telemetria.

## 5. Plano faseado do frontend

### F0 — documentação, contratos e prontidão

Entregas:

1. manter assessment, plano e decisões sincronizados com a matriz;
2. obter fixtures versionadas somente depois de os contratos serem aprovados;
3. fechar IAM, contratos público/administrativo e estados de erro;
4. registrar estratégia de flags, origem SSR server-only e purge;
5. tratar ou aceitar formalmente os achados de desenvolvimento.

Gate: `PUB-020` desbloqueado, checklist F0 aceito e autorização explícita para
F1. Nenhum código funcional de `PUBLICACOES` entra antes disso.

### F1 — fundação autenticada

Pacote F1.1 — contexto e autenticação:

- adicionar `PUBLICACOES` a `AppContext`, `APP_CONFIG`, mapas de login/logout,
  tipos de `/me`, permissions e menus;
- definir slug, cookie e fallback autenticado exclusivamente pelo contrato IAM;
- ampliar testes exaustivos de tipos, auth store, logout seletivo e redirect.

Pacote F1.2 — proxy e navegação:

- centralizar a classificação de rotas públicas/autenticadas;
- adicionar matcher completo da nova aplicação;
- criar `public/nav/PUBLICACOES.json` como fallback não decisório;
- integrar menus/capabilities do backend e falhar fechado quando inconsistentes.

Pacote F1.3 — shell e permissões:

- criar shell administrativo e tema com os componentes compartilhados;
- adicionar permissões ao registry central após aprovação de `PUB-019`;
- aplicar guards por permissão técnica, sem consulta a nome de role;
- limitar abstração admin aos CRUDs compatíveis com seu contrato.

Gate F1: tipos exaustivos, IAM/seed e menus integrados, negações comprovadas,
regressão das aplicações existentes e rollback da fundação exercitado.

### F2 — vertical editorial manual

Pacote F2.1 — adapters e leitura:

- tipos derivados do OpenAPI/fixtures aprovados;
- lista, detalhe, filtros, paginação, histórico e relatório de validação;
- IDs opacos/UUID sem coerção numérica.

Pacote F2.2 — comandos de workflow:

- renderizar somente `acoes_disponiveis` retornadas pelo backend;
- enviar justificativa e precondição de concorrência conforme contrato;
- tratar conflito sem sobrescrever estado confirmado;
- após mutação, buscar detalhe canônico e revalidar listas relacionadas.

Pacote F2.3 — preview e imutabilidade:

- preview em provider efêmero e `private, no-store`;
- nenhuma edição de versão publicada;
- substituição/revogação com confirmação, justificativa e histórico preservado;
- ordem de segurança apresentada como entidade auditável, nunca `force=true`.

Gate F2: concorrência, IDOR, ações, auditoria, preview e imutabilidade aprovados
em integração com backend real isolado.

### F3 — Portal público e integração autenticada

Pacote F3.1 — árvore pública:

- criar `/portal` como Server Component;
- usar adapter `server-only` com origem interna, timeout e sem credenciais do
  visitante;
- entregar metadados e conteúdo textual essencial sem JavaScript;
- hidratar apenas filtros, modal e interações aprovadas.

Pacote F3.2 — cache e estados:

- providers/chaves separados;
- integração condicional com `ETag`/`Last-Modified` e `304`;
- estados acessíveis para vigente, ausência, revogação, `429`, offline e `5xx`;
- proibir fallback de conteúdo revogado e `stale-if-error` do ponteiro vigente.

Pacote F3.3 — login e compatibilidade:

- extrair `LoginForm` sem regressão dos demais logins;
- criar `LoginDialog` com foco inicial, trap, retorno de foco, Escape, título e
  descrição acessíveis;
- normalizar `/portal/login` e preservar redirect apenas da allowlist central;
- manter hard navigation pós-login quando necessária ao cookie.

Pacote F3.4 — dashboard autenticado:

- substituir `{ aplicacoes, roles }` pelo DTO autoritativo aprovado;
- remover cruzamento de roles, casts fechados e destinos condicionais locais;
- validar/normalizar destino e exibir estado/indisponibilidade do backend;
- oferecer erro, vazio, loading e retry explícitos.

Gate F3: isolamento SSR/cache, ausência de vazamento, rotas e redirects,
acessibilidade, carga e rollback do Portal comprovados.

### F4 — fontes internas

Frontend limitado a acompanhamento, proveniência, execuções e reconciliação do
piloto aprovado. WebSocket pode notificar, mas a recuperação e o estado canônico
virão por HTTP/SWR. Nenhuma regra da aplicação de origem será reproduzida.

### F5 — APIs externas e arquivos

Implementar upload para quarentena, progresso, relatórios e estados do workflow
aprovado. Usar multipart no Axios compartilhado sem definir manualmente
`Content-Type`. Nunca exibir ou armazenar credenciais; mensagens usam códigos
estáveis e detalhes redigidos.

### F6 — consumidores

Implementar cadastro, escopos, quotas, rotação e revogação após `PUB-021`. O
segredo será mostrado uma única vez em estado local efêmero, não será colocado em
SWR/Zustand e desaparecerá ao fechar a etapa.

### F7 — hardening e entrada em operação

Executar E2E full-stack, acessibilidade, viewports, desempenho, headers, carga,
telemetria, desligamento de flags, rollback e treinamento. Go-live exige aceite
funcional, técnico, segurança e operação, sem P0/P1 aberto.

## 6. Matriz de arquivos frontend

| Área | Arquivos atuais/novos previstos | Fase |
|---|---|---|
| Contexto/tipos | `src/types/auth.ts`, `src/types/navigation.ts`, tipos em `src/features/publicacoes` | F1–F3 |
| HTTP browser | `src/lib/api.ts`, `src/lib/auth.ts`, `src/lib/authRedirect.ts`, `src/types/axios.d.ts` | F1/F3 |
| HTTP SSR | novo módulo `server-only` em `src/features/publicacoes` ou `src/lib` | F3 |
| Proxy/rotas | `src/proxy.ts`, `src/app/page.tsx`, `src/app/portal/**` | F1/F3 |
| Auth/modal | `src/components/auth/LoginPage.tsx`, novos `LoginForm` e `LoginDialog` | F3 |
| Portal autenticado | `src/hooks/usePortalDashboard.ts`, `src/app/portal/dashboard/page.tsx` | F3 |
| Navegação | `src/hooks/useNavigation*.ts`, stores e novo `public/nav/PUBLICACOES.json` | F1 |
| Permissões | `src/lib/permissions.ts`, `usePermissions*`, guards e stores | F1/F2 |
| Administração | `src/components/admin/**`, `src/lib/adminResource.ts`, tipos/hooks | F1/F2 |
| Domínio | novos `src/app/publicacoes/**` e `src/features/publicacoes/**` | F1–F6 |
| Tema/layout | `src/app/globals.css`, `AppShell`, `Sidebar`, `TopBar` | F1/F3 |
| Configuração | `next.config.ts` e variáveis server-side documentadas | F3/F7 |
| Testes | `src/**/__tests__`, `src/__tests__/middleware.test.ts`, `e2e/**` | Todas |

As localizações novas são propostas organizacionais. O contrato aprovado pode
exigir ajuste antes da implementação.

## 7. Estratégia de testes e evidências

### Por entrega

- lint com configuração nativa do Next 16;
- typecheck separado;
- Vitest focado e regressão;
- `next build --webpack` no executor restrito;
- Playwright para jornadas alteradas;
- fixtures versionadas alinhadas ao OpenAPI aprovado.

### Casos obrigatórios

- matriz completa de rotas: visitante, cookies de cada app, sessão ausente,
  inválida e expirada;
- redirect: externo, `//`, backslash, controles, encoding ambíguo, loop e destino
  fora da allowlist;
- SSR concorrente com cookies distintos produz a mesma resposta pública e não
  encaminha credenciais;
- `401` público não limpa stores nem redireciona; `401` autenticado preserva o
  fluxo já validado;
- caches público, administrativo e preview não se contaminam em login, logout,
  troca de sessão, publicação ou revogação;
- cards não dependem de roles e rejeitam destino não autorizado;
- ações administrativas seguem permissão e `acoes_disponiveis` do backend;
- conflitos de concorrência não sobrescrevem dados canônicos;
- modal e dashboard passam por teclado, foco, nomes, contraste, zoom, movimento
  reduzido e alternativas textuais/tabulares;
- segredo de consumidor não aparece em cache, store, log, DOM persistente ou
  histórico do navegador.

## 8. Rollout e rollback frontend

1. manter flags server-side independentes para a aplicação administrativa e o
   Portal público;
2. liberar F1 somente para usuários autorizados e dados sintéticos aprovados;
3. homologar F2 antes de expor qualquer endpoint público;
4. ativar `/portal` público sem remover a compatibilidade de `/portal/login` e
   `/portal/dashboard`;
5. liberar cards autoritativos somente depois dos testes de destino;
6. observar erros, latência, cache, incompatibilidade de schema e falhas de
   hidratação;
7. em rollback, desabilitar flags, restaurar a entrada anterior, purgar caches e
   preservar publicações, histórico e auditoria;
8. não usar variável `NEXT_PUBLIC_*` como única barreira de segurança ou
   exposição.

## 9. Ordem de execução recomendada

1. concluir apenas as correções documentais deste plano;
2. obter responsáveis, piloto, classificação e contratos iniciais;
3. fechar `PUB-020`/`PUB-022` e atualizar `F0_READINESS.md` e a matriz;
4. aprovar IAM e OpenAPI administrativo;
5. autorizar F1 e executar F1.1 → F1.2 → F1.3;
6. implementar a vertical manual F2;
7. aprovar schema/estados públicos e baseline de acessibilidade;
8. executar F3.1 → F3.2 → F3.3 → F3.4;
9. avançar para uma fonte piloto em F4;
10. habilitar F5/F6 somente quando os respectivos controles e contratos forem
    aprovados;
11. concluir F7 e o go-live pelos gates formais.
