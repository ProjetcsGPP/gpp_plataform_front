# Publicações Institucionais — integração E-Docs

A fundação usa o contexto `PUB_INSTITUCIONAL`, o Axios compartilhado, a
hidratação de autenticação/permissões existente e os menus dinâmicos de
`GET /api/accounts/menus/`.

As quatro áreas administrativas consomem o contrato versionado em
`backend/docs/PUBLICACOES/EDOCS_ADMIN_API.md` pelo prefixo
`/api/pub-institucional/`. As consultas usam SWR e o cliente Axios compartilhado.
Mutações revalidam todo o namespace de cache E-Docs.

O WebSocket `/ws/pub-institucional/edocs/` funciona somente como sinal de
revalidação. Seu payload não é aplicado ao estado das telas: o estado canônico
sempre volta a ser obtido pela API HTTP/SWR.

As ações por registro dependem simultaneamente das permissões técnicas
hidratadas e de `acoes_disponiveis`. As opções de decisão de divergência vêm
exclusivamente de `decisoes_permitidas`. Nenhum nome de role participa dessas
decisões.
