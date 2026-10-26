# Registro de decisões e insumos — PUBLICACOES frontend

Este arquivo mantém a rastreabilidade de definições recebidas em chats,
reuniões, documentos e contratos. Ele não transforma uma conversa em decisão
automaticamente.

A autoridade transversal é a
[`PUBLICACOES_INTEGRATION_MATRIX.md`](../../../backend/docs/SHARED/PUBLICACOES_INTEGRATION_MATRIX.md).
O ID `FE-PUB-*` organiza o detalhamento local; a coluna `ID compartilhado`
mantém o vínculo com a decisão ou pendência válida entre os projetos.

## Status permitidos

- `INSUMO`: informação recebida, ainda não validada como decisão.
- `PROPOSTA`: alternativa formulada para avaliação.
- `PENDENTE`: depende de resposta ou aprovação identificada.
- `BLOQUEADO`: não pode avançar enquanto o bloqueio indicado estiver aberto.
- `DECIDIDO`: aprovado pelos responsáveis adequados.
- `SUBSTITUIDO`: deixou de valer; deve apontar para a decisão sucessora.
- `REJEITADO`: avaliado e não adotado, com justificativa preservada.

## Registro inicial

| ID local | ID compartilhado | Data | Status | Tema | Registro | Origem/validação |
|---|---|---|---|---|---|---|
| FE-PUB-001 | PUB-001 | 2026-10-23 | DECIDIDO | Arquitetura frontend | Preservar Axios compartilhado, SWR, `appContext`, navegação dinâmica, capabilities e permissões técnicas; não criar mecanismos paralelos. | Matriz compartilhada e solicitação do responsável do projeto |
| FE-PUB-002 | PUB-006 | 2026-10-23 | DECIDIDO | Autorização | Capability controla distribuição funcional; permissões técnicas autorizam ações; componentes não verificam nomes de roles. | Matriz compartilhada |
| FE-PUB-003 | PUB-003 | 2026-10-23 | DECIDIDO | Regras de origem | Não presumir contratos, layouts, gráficos, eventos ou regras de aplicações de origem. | Matriz compartilhada |
| FE-PUB-004 | PUB-008 | 2026-10-23 | DECIDIDO | Segurança | Gate F0 concluído: CSRF efetivo, sessões inválidas/inativas, throttling e não enumeração foram implementados e comprovados nos dois repositórios. | Backend: 25 testes focados e suíte de 1.130 aprovados; frontend: 318 testes, lint, typecheck e build Webpack aprovados |
| FE-PUB-005 | PUB-012 | 2026-10-23 | PENDENTE | Rotas | Definir separação entre `/portal` público, `/portal/login` compatível e área autenticada. | Decisão conjunta produto/frontend/backend |
| FE-PUB-006 | PUB-013 | 2026-10-23 | PENDENTE | Renderização | Decidir CSR, SSR ou híbrido para o Portal público. | Arquitetura frontend e infraestrutura |
| FE-PUB-007 | PUB-014 | 2026-10-23 | PENDENTE | Cache | Definir isolamento SWR, cache HTTP, `ETag`, TTL, invalidação e degradação. | Backend, frontend, gateway e segurança |
| FE-PUB-008 | PUB-015 | 2026-10-23 | DECIDIDO | Login | O login usa `identifier` opaco, sem resolução enumerável, e o bootstrap CSRF definido pelo backend. | Matriz compartilhada; implementação validada no fechamento de PUB-008 |
| FE-PUB-009 | PUB-016 | 2026-10-23 | DECIDIDO | Aplicações | O backend fornecerá aplicações disponíveis, destinos aprovados e estados; o frontend não derivará autorização de roles. | Matriz compartilhada |
| FE-PUB-010 | PUB-019 | 2026-10-23 | PENDENTE | PUBLICACOES | Definir menus, capabilities e permissões técnicas definitivas. | Backend, IAM, gestão funcional e frontend |
| FE-PUB-011 | PUB-009, PUB-018 | 2026-10-23 | PENDENTE | Workflow | `PUB-009` decidiu que a mesma pessoa poderá preparar e publicar na primeira versão; permanece pendente somente o contrato de ações, concorrência, preview e erros de `PUB-018`. | ADR-0001 do backend; governança funcional, segurança, backend e frontend |
| FE-PUB-012 | PUB-017 | 2026-10-23 | PENDENTE | Dashboard | Aprovar schema público antes de escolher componentes, gráficos ou layout final. | Produto, dados, backend e frontend |
| FE-PUB-013 | PUB-026 | 2026-10-23 | DECIDIDO | Documentação | Manter assessment e registro evolutivo no frontend e a matriz compartilhada como referência transversal. | Matriz compartilhada e solicitação do responsável do projeto |
| FE-PUB-014 | PUB-010 | 2026-10-23 | DECIDIDO | Administração | `PORTAL_ADMIN` mantém o acesso administrativo global das camadas compartilhadas, sem poder ignorar workflow, imutabilidade, validação, justificativa ou auditoria. | ADR-0002 do backend; matriz compartilhada |
| FE-PUB-015 | PUB-023 | 2026-10-23 | DECIDIDO | Indicadores | O frontend exibirá valores calculados pelo backend e não recalculará indicadores canônicos. | Matriz compartilhada |
| FE-PUB-016 | PUB-024 | 2026-10-23 | PENDENTE | Estados públicos | Definir ausência de publicação, revogação, `429`, offline, `5xx` e histórico público. | Produto, backend, frontend e infraestrutura |
| FE-PUB-017 | PUB-025 | 2026-10-23 | PENDENTE | Qualidade | Definir navegadores suportados e meta de acessibilidade. | Produto, frontend e qualidade |

## Template para novo registro

Copiar a estrutura abaixo, atribuir o próximo ID e manter o texto objetivo.

```markdown
### FE-PUB-NNN — Título curto

- **Data:** AAAA-MM-DD
- **ID compartilhado:** PUB-NNN
- **Status:** INSUMO | PROPOSTA | PENDENTE | BLOQUEADO | DECIDIDO | SUBSTITUIDO | REJEITADO
- **Origem:** chat, reunião, documento, issue ou contrato
- **Responsáveis pela validação:**
- **Resumo fiel:**
- **Impacto no frontend:**
- **Impacto em contratos/backend/infraestrutura:**
- **Riscos:**
- **Arquivos ou áreas afetadas:**
- **Critério de aceite:**
- **Substitui ou é substituído por:**
- **Evidência/link:**
```

## Regras para registrar chats

1. Registrar um resumo verificável, não a transcrição integral.
2. Preservar frases literais apenas quando forem necessárias para evitar
   ambiguidade funcional.
3. Marcar como `INSUMO` até existir aprovação explícita.
4. Separar opinião técnica, requisito funcional e contrato confirmado.
5. Não registrar segredos, tokens, credenciais ou dados pessoais.
6. Quando o chat definir uma alteração de contrato, apontar o documento ou ADR
   que deverá ser atualizado.
7. Se a mudança for transversal, atualizar a linha `PUB-*` e o histórico da
   matriz compartilhada na mesma entrega.

## Histórico de alinhamento

| Data | Alteração | Referência |
|---|---|---|
| 2026-10-23 | Registro inicial do assessment frontend. | FE-PUB-001 a FE-PUB-013 |
| 2026-10-23 | Alinhamento com a matriz compartilhada: inclusão dos vínculos `PUB-*`, promoção de login e cards para `DECIDIDO`, separação do bloqueio de segurança e inclusão das pendências transversais faltantes. | PUB-008, PUB-010, PUB-015, PUB-016, PUB-023 a PUB-026 |
| 2026-10-23 | Sincronização sem mudança das decisões canônicas: `PUB-009` e `PUB-010` já estavam decididos pelos ADRs do backend; o registro local passou a refletir esses estados. | PUB-009, PUB-010; ADR-0001 e ADR-0002 |
| 2026-10-23 | Conclusão da adaptação frontend de autenticação: bootstrap e rotação CSRF, `identifier` opaco, remoção do consumidor enumerável, logout seletivo, tratamento de sessão, redirect seguro e mensagens genéricas. | PUB-008, PUB-015; 318 testes frontend, lint/typecheck e build aprovados |
| 2026-10-26 | Adição da camada E2E Playwright para o gate de autenticação, com Chromium e fixtures HTTP sintéticas; 13 cenários aprovados. | PUB-008, PUB-015; `e2e/auth-security.spec.ts` |
