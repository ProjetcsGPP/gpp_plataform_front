# Publicações Institucionais — dependências de integração

A fundação usa o contexto `PUB_INSTITUCIONAL`, o Axios compartilhado, a
hidratação de autenticação/permissões existente e os menus dinâmicos de
`GET /api/accounts/menus/`.

Os contratos HTTP administrativos de patriarcas, coletas, divergências e
auditoria ainda não estão disponíveis. Por isso, as rotas permanecem em estado
neutro e não criam hooks SWR, endpoints, payloads ou dados simulados. Quando os
contratos forem formalizados, os hooks devem usar o cliente Axios compartilhado
como fetcher do SWR.

O WebSocket reservado em `/ws/pub-institucional/edocs/` não é conectado nesta
fundação. Quando implementado, ele servirá apenas para notificar e provocar a
revalidação dos dados HTTP/SWR; nunca será a fonte canônica de estado.

Antes de expor endpoints sob `/api/pub-institucional/`, o backend deve associar
esse prefixo ao contexto `PUB_INSTITUCIONAL` no middleware de contexto. A
publicação da aplicação e de seu destino no Portal também permanece autoritativa
no backend; nenhum cartão ou destino decisório foi adicionado ao navegador.
