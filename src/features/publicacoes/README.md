# Publicações Institucionais — integrações administrativas

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

## Coleta E-Flow

A rota `/publicacoes/coleta-dados/eflow` consome o contrato
`backend/docs/PUBLICACOES/EFLOW_ADMIN_API.md`. O upload usa o Axios compartilhado
com `FormData`, sem definir manualmente `Content-Type`; histórico, definições e
auditoria usam SWR e paginação do backend. A resposta HTTP `201` continua sendo
avaliada pela `situacao`, pois snapshots preservados podem retornar `FALHOU`.

Cada snapshot concluído apresenta os resultados imutáveis
`COMPLETO_TECNICO` e `CONSOLIDADO_PUBLICACAO`. A preferência individual é
consultada e persistida exclusivamente pelos endpoints administrativos; a troca
visual entre perfis não recalcula indicadores nem altera o snapshot. A ação de
persistência depende simultaneamente da permissão técnica e de
`acoes_disponiveis`. A auditoria dessa preferência permanece separada da
auditoria das coletas.

O agrupador `COLETA_DADOS` e o item `COLETA_EFLOW` só são materializados a
partir do menu dinâmico do backend. A rota e as ações são protegidas pelas
permissões técnicas específicas, sem inspeção de nomes de roles.

Os gráficos E-Flow usam Apache ECharts com imports seletivos, renderer SVG,
redimensionamento responsivo e descrição ARIA. A tabela acessível continua
disponível como representação textual equivalente. O frontend somente formata
os percentuais canônicos recebidos do backend; não os recalcula a partir das
quantidades. A configuração visual segue os exemplos oficiais de rosca e
rótulos externos em `https://echarts.apache.org/examples/en/index.html`.

A rota `/publicacoes/coleta-dados/edocs` implementa a coleta mensal E-Docs.
O menu `COLETA_EDOCS_MENSAL` continua materializado somente quando retornado
pela navegação dinâmica do backend; o manifesto local relaciona a rota à
permissão `view_coletamensaledocs`. Coletas, resultados por patriarca e
organização, metadados das fontes e auditoria usam Axios/SWR e preservam o
backend como estado canônico. O WebSocket E-Docs apenas provoca revalidação
das chaves HTTP.

Os indicadores municipais são alterados no catálogo de patriarcas somente
quando a permissão técnica e a ação `alterar_indicadores_municipais` estão
presentes. O `PATCH` envia apenas campos efetivamente modificados e a
justificativa obrigatória, sem impor exclusividade local entre os indicadores.
