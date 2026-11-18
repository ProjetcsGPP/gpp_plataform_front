# PUBLICACOES — documentação frontend

Este diretório concentra a análise, as decisões e os insumos de planejamento
do frontend da aplicação `PUBLICACOES` e da transformação do Portal.

## Documentos

- [FRONTEND_ASSESSMENT.md](./FRONTEND_ASSESSMENT.md): auditoria arquitetural
  inicial do frontend, reconciliada com o estado canônico de 2026-11-03.
- [FRONTEND_IMPLEMENTATION_PLAN.md](./FRONTEND_IMPLEMENTATION_PLAN.md): pontos
  a corrigir, dependências, fases, pacotes de trabalho, arquivos, testes e
  rollout do frontend.
- [DECISIONS_AND_INPUTS.md](./DECISIONS_AND_INPUTS.md): registro evolutivo de
  decisões aprovadas, pendências e novos insumos recebidos em reuniões ou
  conversas.
- [VIDEO_EXPORT.md](./VIDEO_EXPORT.md): arquitetura, fluxo, autorização,
  negociação MP4/WebM, limitações e aceite da exportação local do carrossel.

Os documentos arquiteturais de origem estão no repositório backend, em
[`docs/PUBLICACOES`](../../../backend/docs/PUBLICACOES/README.md).

A referência de coordenação transversal é a
[`PUBLICACOES_INTEGRATION_MATRIX.md`](../../../backend/docs/SHARED/PUBLICACOES_INTEGRATION_MATRIX.md),
mantida em `backend/docs/SHARED`. Os IDs `PUB-*` dessa matriz prevalecem como
identificadores compartilhados; os registros `FE-PUB-*` deste diretório são o
detalhamento local do frontend e devem apontar para eles.

A reconfirmação arquitetural canônica está em
[`PUBLICACOES_CURRENT_STATE_ASSESSMENT.md`](../../../backend/docs/SHARED/PUBLICACOES_CURRENT_STATE_ASSESSMENT.md).

## Regras de manutenção

1. Separar claramente **decisão aprovada**, **proposta**, **pendência** e
   **exemplo não normativo**.
2. Consultar e citar o ID `PUB-*` aplicável antes de alterar Portal,
   autenticação, IAM, `PUBLICACOES`, fontes ou distribuição.
3. Não converter exemplos de aplicações de origem em contratos sem aprovação
   dos responsáveis funcionais e técnicos.
4. Registrar a data, a origem e o responsável por cada nova definição.
5. Preservar Axios compartilhado, SWR, `appContext`, navegação dinâmica,
   capabilities e permissões técnicas.
6. Capability controla distribuição funcional; permissão técnica autoriza a
   ação. Componentes não verificam nomes de roles.
7. Não incluir credenciais, segredos, dados pessoais ou payloads sensíveis em
   notas de conversa.
8. Quando uma decisão substituir outra, manter o histórico e marcar a anterior
   como substituída em vez de apagá-la.
9. Se o documento local divergir da matriz, interromper a implementação do
   ponto, registrar o conflito e obter a validação dos responsáveis indicados.

## Fluxo sugerido para novos insumos

1. Localizar ou criar o ID `PUB-*` na matriz compartilhada conforme seu
   protocolo.
2. Registrar o detalhamento em `DECISIONS_AND_INPUTS.md` como `INSUMO`, citando
   o ID compartilhado.
3. Identificar dúvidas, contratos e impactos no frontend.
4. Obter a validação dos responsáveis adequados.
5. Promover o item para `DECIDIDO` ou mantê-lo como `PENDENTE`/`BLOQUEADO`.
6. Atualizar a matriz e o assessment, ADR ou contrato afetado na mesma entrega,
   preservando a rastreabilidade.
