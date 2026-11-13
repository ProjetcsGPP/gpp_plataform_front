# Exportação da apresentação de Publicações em vídeo

## 1. Objetivo e escopo

A prévia administrativa de Publicações Institucionais permite gravar o
carrossel completo como vídeo. A exportação é local ao navegador e usa o mesmo
snapshot imutável já carregado para a prévia; ela não recalcula indicadores,
não cria estado canônico e não envia o arquivo ao backend.

O recurso é deliberadamente limitado à prévia administrativa. O Portal público
reutiliza o componente de apresentação, mas não recebe a propriedade que
habilita a gravação.

## 2. Autorização

O botão somente é materializado no fluxo que já depende simultaneamente de:

- permissão técnica `visualizar_previa_publicacao`;
- ação autoritativa `visualizar_previa` em `acoes_disponiveis`;
- resposta bem-sucedida do endpoint administrativo de prévia.

Não há verificação de nome de role. A primeira versão entende que quem pode
visualizar a prévia pode exportar localmente a representação que já recebeu.
Caso a governança determine que download é uma ação distinta, deverá ser criada
uma permissão técnica específica antes de ampliar a distribuição do botão.

## 3. Fluxo do usuário

1. O usuário abre uma publicação e solicita a prévia.
2. No board, aciona **Gravar apresentação em vídeo**.
3. Uma tela anterior à captura oferece dois modos:
   - um mesmo número inteiro de segundos para todas as etapas;
   - duração individual para cada etapa do carrossel.
4. A tela apresenta a duração total e o formato detectado (`MP4` ou `WebM`).
5. Ao continuar, o navegador solicita a superfície que será compartilhada.
6. O usuário deve selecionar **esta guia**.
7. A apresentação passa para modo de exportação, começa na primeira etapa e:
   - ocupa a viewport inteira;
   - interrompe o autoplay normal;
   - oculta dropdown, controles e rodapé;
   - avança conforme os tempos configurados.
8. Depois da última etapa, a gravação é encerrada e o arquivo é baixado.
9. Índice e estado de reprodução anteriores são restaurados.

Um temporizador independente encerra a sessão ao atingir a soma configurada
mais cinco segundos de tolerância. O avanço visual também possui fallback de
tempo quando `requestAnimationFrame` é suspenso por perda de foco da guia. Ao
encerrar, as tracks são paradas imediatamente; o frontend aguarda no máximo
cinco segundos pelo último evento do `MediaRecorder` antes de montar o arquivo
com os chunks já recebidos.

O usuário pode interromper antecipadamente pelo indicador de compartilhamento
do navegador ou pela tecla `Esc`. Nesse caso, o conteúdo produzido até o
encerramento é preservado quando o navegador entregar dados válidos.

## 4. Captura e consentimento

A captura usa `navigator.mediaDevices.getDisplayMedia()`. Pelas regras da Screen
Capture API:

- precisa ser iniciada por interação direta do usuário;
- exige contexto seguro (`HTTPS`) em produção;
- solicita consentimento em toda execução;
- a permissão não pode ser persistida;
- o navegador deve permitir que o usuário escolha a superfície;
- opções da aplicação podem orientar, mas não restringir essa escolha.

A solicitação envia as preferências `preferCurrentTab: true`,
`selfBrowserSurface: "include"`, `displaySurface: "browser"` e
`monitorTypeSurfaces: "exclude"`. Elas pedem que a própria guia seja incluída e
destacada, desestimulando captura do monitor. O navegador pode ignorar esses
hints e continua responsável pela lista final apresentada ao usuário.

Quando `MediaStreamTrack.getSettings().displaySurface` estiver disponível, a
implementação recusa superfícies identificadas como janela ou monitor. Essa
validação reduz capturas acidentais, mas não substitui a orientação para que o
usuário escolha a guia correta.

## 5. Formato e negociação de codec

`MediaRecorder` não possui um formato único obrigatório em todas as
implementações. Reprodução de MP4 não implica capacidade de codificar MP4.
Por isso, a aplicação consulta `MediaRecorder.isTypeSupported()` antes da
captura, na seguinte ordem:

1. `video/mp4;codecs=avc1.42E01E`;
2. `video/mp4`;
3. `video/webm;codecs=vp9`;
4. `video/webm;codecs=vp8`;
5. `video/webm`.

O primeiro formato suportado é mostrado antes da autorização. O nome e a
extensão do download são derivados do formato escolhido. Um arquivo WebM nunca
é renomeado artificialmente para `.mp4`.

Mesmo um retorno positivo de `isTypeSupported()` não é garantia absoluta: a
especificação permite falhas posteriores por indisponibilidade de recursos de
codificação. Esses erros são tratados e a apresentação volta ao estado normal.

## 6. Por que não instalar um codec por npm

Uma dependência JavaScript não acrescenta um codec ao `MediaRecorder` do
navegador. A capacidade exposta por essa API depende do navegador, da sua
distribuição e, em alguns ambientes, dos codecs fornecidos pelo sistema
operacional.

Bibliotecas como FFmpeg compilado para WebAssembly implementariam outro fluxo:

```text
captura WebM -> transcodificação no cliente -> MP4
```

Isso não amplia o `MediaRecorder`; é uma conversão posterior que aumenta o
bundle e consome CPU e memória da estação. Vídeos longos podem pressionar ou
encerrar a guia. Por esse motivo, a primeira versão não inclui transcodificação
no cliente.

Se MP4 universal se tornar requisito, as alternativas devem ser avaliadas como
um trabalho separado:

- homologar e restringir navegadores/estações que codifiquem MP4;
- usar transcodificação cliente com limites explícitos;
- enviar o arquivo a um serviço backend de conversão, com autorização,
  armazenamento temporário, descarte, quotas e auditoria.

## 7. Estado, memória e arquivos

- Não há Axios, SWR, Zustand ou endpoint adicional.
- Os chunks emitidos pelo `MediaRecorder` permanecem na memória até a montagem
  do `Blob` final.
- O `MediaStream` e todas as tracks são encerrados no sucesso, erro,
  cancelamento ou desmontagem do componente.
- A URL temporária do `Blob` é revogada depois de iniciar o download.
- O arquivo segue o padrão `publicacao-{competencia}-v{versao}.{extensao}`.
- O vídeo não é armazenado pelo frontend nem registrado como estado canônico.

Gravações muito extensas continuam sujeitas à memória disponível no navegador.
Caso esse uso se torne frequente, deverão ser definidos limites funcionais de
duração e resolução.

## 8. Testes e aceite

Os testes automatizados cobrem:

- prioridade de MP4 e fallback WebM;
- correspondência entre contêiner e extensão;
- duração uniforme;
- duração individual por etapa;
- cálculo da duração total;
- distribuição exclusiva para a prévia administrativa;
- mensagens neutras para cancelamento de permissão.

O seletor de captura é interface privilegiada do navegador e não deve ser
automatizado como se fosse DOM da aplicação. O aceite manual deve ser realizado
em cada navegador homologado, verificando:

1. formato anunciado antes da gravação;
2. seleção da guia atual;
3. ausência de controles e rodapé no vídeo;
4. duração de cada etapa;
5. restauração da prévia;
6. abertura do arquivo em um reprodutor institucional.

## 9. Referências oficiais

Consultadas em 13/11/2026:

- W3C, **Screen Capture**:
  <https://www.w3.org/TR/screen-capture/>
- W3C, **MediaStream Recording**:
  <https://www.w3.org/TR/mediastream-recording/>
- MDN, **MediaDevices.getDisplayMedia()**:
  <https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia>
- MDN, **MediaRecorder**:
  <https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder>
- MDN, **MediaRecorder.isTypeSupported()**:
  <https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static>
- MDN, **MediaRecorder.mimeType**:
  <https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/mimeType>
- MDN, **MediaStreamTrack: ended event**:
  <https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/ended_event>

As especificações W3C citadas são Working Drafts. O frontend usa detecção de
capacidade em tempo de execução justamente para não transformar exemplos ou
comportamentos de um navegador em garantia contratual universal.
