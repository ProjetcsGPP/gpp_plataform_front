export interface StatusProgresso {
  idstatusprogresso: number;
  strdescricao: string;
}

export interface HistoricoProcessoCargaInicial {
  idhistoricoprocesso: number;
  stracao: string;
  strfaseanterior: string;
  strfasenova: string;
  strstatusorganogramaanterior: string;
  strstatusorganogramanovo: string;
  strstatuslotacaoanterior: string;
  strstatuslotacaonovo: string;
  strmensagem: string;
  jsondetalhes: Record<string, unknown>;
  created_by_name: string | null;
  created_at: string;
}

export interface ProcessoCargaInicial {
  idprocessocargainicial: number;
  idpatriarca_id: number;
  strfaseatual: string;
  fase_nome: string;
  strstatusorganograma: string;
  status_organograma_nome: string;
  strstatuslotacao: string;
  status_lotacao_nome: string;
  flgativo: boolean;
  databertura: string;
  dataconclusao: string | null;
  historico: HistoricoProcessoCargaInicial[];
}

export interface Patriarca {
  idpatriarca: number;
  idexternopatriarca: string;
  strsiglapatriarca: string;
  strnome: string;
  datcriacao: string;
  datalteracao: string | null;
  idstatusprogresso_id: number;
  status: StatusProgresso | null;
  organograma_download_url: string;
  processo_ativo: ProcessoCargaInicial | null;
}

export interface PatriarcaUpdatePayload {
  idexternopatriarca: string;
  strsiglapatriarca: string;
  strnome: string;
}

export interface PatriarcaCreatePayload extends PatriarcaUpdatePayload {
  idstatusprogresso_id: number;
}

export interface TipoCarga {
  idtipocarga: number;
  strdescricao: string;
}

export interface ImportacaoPlanilha {
  idimportacaoplanilha: number;
  idpatriarca_id: number;
  patriarca: Patriarca;
  idtipocarga_id: number;
  tipo_carga: TipoCarga;
  processo: ProcessoCargaInicial | null;
  idimportacaoorganograma_id: number | null;
  idconjuntolotacao_id?: number | null;
  strtipooperacaolotacao?: "INICIAL" | "ACRESCIMO" | "SUBSTITUICAO" | "";
  idstatusprogresso_id: number;
  status: StatusProgresso | null;
  strnomearquivo: string;
  strtipomime: string;
  inttamanhoarquivo: number;
  strhasharquivo: string;
  strabaimportada: string;
  strreferencia: string;
  strstatusimportacao:
    | "RECEBIDA"
    | "PROCESSANDO"
    | "AGUARDANDO_REVISAO"
    | "PRONTA_PARA_INCORPORAR"
    | "INCORPORANDO"
    | "SEM_REGISTROS_VALIDOS"
    | "REJEITADA"
    | "VALIDADA"
    | "INCORPORADA"
    | "ALTERADA"
    | "SUBSTITUIDA"
    | "ERRO_PROCESSAMENTO";
  status_importacao_nome: string;
  flgcriarunidadesespelho: boolean;
  flgpossuialteracoes: boolean;
  datprimeiraalteracao: string | null;
  datultimaalteracao: string | null;
  organograma_atualizado_download_url: string | null;
  datimportacao: string;
  download_url: string;
  total_itens_organograma: number;
  total_itens_lotacao?: number;
  total_itens_lotacao_importados?: number;
  total_casos_pendentes?: number;
  relatorio_validacao: RelatorioValidacaoImportacao | null;
  created_by_id: number | null;
  created_by_name: string | null;
}

export type SituacaoConjuntoLotacao =
  | "RASCUNHO"
  | "EM_VALIDACAO"
  | "COM_PENDENCIAS"
  | "PRONTO_PARA_HOMOLOGACAO"
  | "HOMOLOGADO"
  | "ATIVO"
  | "CANCELADO"
  | "SUBSTITUIDO";

export interface ConjuntoLotacao {
  idconjuntolotacao: number;
  idpatriarca_id: number;
  idimportacaoorganograma_id: number;
  idconjuntoanterior_id: number | null;
  strreferencia: string;
  strsituacao: SituacaoConjuntoLotacao;
  situacao_nome: string;
  strjustificativaultimaacao: string;
  dathomologacao: string | null;
  datativacao: string | null;
  datcancelamento: string | null;
  total_importacoes: number;
  total_registros: number;
  total_casos_pendentes: number;
  total_registros_descartados: number;
  idconjuntosubstituto: number | null;
  download_consolidado_url: string;
  created_by_id: number | null;
  created_by_name: string | null;
  updated_by_id: number | null;
  updated_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResumoConjuntosOrganograma {
  idimportacaoorganograma: number;
  total_conjuntos: number;
  total_importacoes: number;
  conjuntos_em_validacao: number;
  conjuntos_com_pendencias: number;
  conjunto_ativo: ConjuntoLotacao | null;
}

export interface HistoricoConjuntoLotacao {
  idhistoricoconjuntolotacao: number;
  stracao: string;
  strsituacaoanterior: string;
  strsituacaonova: string;
  strmensagem: string;
  jsondetalhes: Record<string, unknown>;
  created_by_id: number | null;
  created_by_name: string | null;
  created_at: string;
}

export interface OcorrenciaValidacaoImportacao {
  idocorrenciavalidacao: number;
  strseveridade: "ERRO" | "AVISO" | "INFORMACAO" | "NORMALIZACAO";
  severidade_nome: string;
  strcodigo: string;
  straba: string;
  intlinha: number | null;
  strcampo: string;
  strvalororiginal: string;
  strvalornormalizado: string;
  strmensagem: string;
  strregraaplicada: string;
  jsonsugestoes: unknown[];
}

export interface RelatorioValidacaoImportacao {
  idrelatoriovalidacao: number;
  strresultado:
    | "VALIDO"
    | "COM_AVISOS"
    | "INVALIDO"
    | "ERRO_PROCESSAMENTO";
  resultado_nome: string;
  flgleituracompleta: boolean;
  inttotalabas: number;
  inttotallinhas: number;
  inttotalvalidas: number;
  inttotalerros: number;
  inttotalavisos: number;
  inttotalnormalizacoes: number;
  strversaoregras: string;
  jsonresumo: Record<string, unknown>;
  datprocessamento: string;
  ocorrencias: OcorrenciaValidacaoImportacao[];
  casos?: CasoValidacaoImportacao[];
}

export type StatusCasoValidacao =
  | "PENDENTE"
  | "ACEITO_COMO_INFORMADO"
  | "CORRIGIDO"
  | "SUGESTAO_APLICADA"
  | "LINHAS_DESCARTADAS";

export type AcaoResolucaoValidacao =
  | "CORRIGIR_MANUALMENTE"
  | "APLICAR_SUGESTAO"
  | "ACEITAR_COMO_INFORMADO"
  | "DESCARTAR_LINHAS";

export interface AlternativaResolucaoValidacao {
  idalternativaresolucao: number;
  stracao: AcaoResolucaoValidacao;
  strdescricao: string;
  jsonpayload: Record<string, unknown>;
  decconfianca: string | number | null;
  flgrecomendada: boolean;
}

export interface ResolucaoValidacao {
  idresolucaovalidacao: number;
  idalternativaresolucao_id: number | null;
  stracao: AcaoResolucaoValidacao;
  strjustificativa: string;
  jsonantes: Record<string, unknown>;
  jsondepois: Record<string, unknown>;
  datresolucao: string;
  created_by_name: string | null;
}

export interface CasoValidacaoImportacao {
  idcasovalidacao: number;
  idrelatoriovalidacao_id: number;
  strchaveagrupamento: string;
  strcodigo: string;
  strseveridade: "ERRO" | "AVISO";
  severidade_nome: string;
  strtitulo: string;
  strmensagem: string;
  strstatus: StatusCasoValidacao;
  status_nome: string;
  datresolucao: string | null;
  item_ids: number[];
  ocorrencia_ids: number[];
  alternativas: AlternativaResolucaoValidacao[];
  resolucoes: ResolucaoValidacao[];
}

export type SituacaoItemLotacaoImportado =
  | "ACEITO"
  | "COM_AVISOS"
  | "COM_ERROS"
  | "CORRIGIDO"
  | "DESCARTADO"
  | "INCORPORADO";

export interface ItemLotacaoImportado {
  iditemlotacaoimportado: number;
  idimportacaoplanilha_id: number;
  idorgaoorganograma_id: number | null;
  idunidadeorganograma_id: number | null;
  strsiglaorgaooriginal: string;
  strsiglaorgao: string;
  strnomeorgao: string;
  strnomeservidor: string;
  strcpforiginal: string;
  strcpf: string;
  strcargooriginal: string;
  strcargonormalizado: string;
  strsiglaunidadeoriginal: string;
  strsiglaunidade: string;
  strnomeunidade: string;
  strabaorigem: string;
  intlinhaorigem: number;
  strsituacao: SituacaoItemLotacaoImportado;
  situacao_nome: string;
}

export type CamposCorrecaoLotacao = Partial<Pick<
  ItemLotacaoImportado,
  | "idorgaoorganograma_id"
  | "idunidadeorganograma_id"
  | "strsiglaorgao"
  | "strnomeorgao"
  | "strnomeservidor"
  | "strcpf"
  | "strcargooriginal"
  | "strcargonormalizado"
  | "strsiglaunidade"
  | "strnomeunidade"
>>;

export interface ResolverCasoValidacaoPayload {
  acao: AcaoResolucaoValidacao;
  alternativa_id?: number;
  justificativa?: string;
  alteracoes?: Array<{
    iditemlotacaoimportado: number;
    campos: CamposCorrecaoLotacao;
  }>;
}

export interface ItemOrganograma {
  iditemorganograma: number;
  idimportacaoplanilha_id: number;
  idpai_id: number | null;
  pai_sigla: string | null;
  strnome: string;
  strsigla: string;
  strnumero: string;
  strresponsavel: string;
  strcargo: string;
  flggeradoautomaticamente: boolean;
  strabaorigem: string;
  intlinhaorigem: number;
  strreferenciapai: string;
  created_by_id?: number | null;
  created_by_name?: string | null;
  updated_by_id?: number | null;
  updated_by_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type ItemOrganogramaFields = Pick<
  ItemOrganograma,
  | "idpai_id"
  | "strnome"
  | "strsigla"
  | "strnumero"
  | "strresponsavel"
  | "strcargo"
>;

export type ItemOrganogramaCreatePayload = ItemOrganogramaFields & {
  idimportacaoplanilha_id: number;
};

export type ItemOrganogramaUpdatePayload = ItemOrganogramaFields;

export interface ItemOrganogramaImpacto {
  unidade_raiz: Pick<
    ItemOrganograma,
    "iditemorganograma" | "strnumero" | "strsigla" | "strnome"
  >;
  total_descendentes: number;
  total_excluidos: number;
  unidades: Array<Pick<
    ItemOrganograma,
    "iditemorganograma" | "strnumero" | "strsigla" | "strnome"
  >>;
}

export interface ItemOrganogramaNode extends ItemOrganograma {
  children: ItemOrganogramaNode[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ValidationIssue {
  codigo: string;
  mensagem: string;
  aba?: string | null;
  linha?: number | null;
  campo?: string | null;
}

export interface ValidationReport {
  idimportacaoplanilha?: number;
  codigo: string;
  mensagem: string;
  leitura_completa: boolean;
  total_abas_lidas: number;
  total_linhas_lidas: number;
  total_erros: number;
  criar_unidades_espelho?: boolean;
  total_unidades_espelho_criadas?: number;
  erros: ValidationIssue[];
}

export interface OrganogramaSheet {
  nome: string;
  ordem: number;
  linhas_preenchidas: number;
}

export interface SheetSelectionReport {
  codigo: "selecao_aba_obrigatoria";
  mensagem: string;
  abas: OrganogramaSheet[];
}

export type EnvioOrganogramaStatus =
  | "SOLICITANDO"
  | "PROCESSANDO"
  | "CONCLUIDO"
  | "CONCLUIDO_DESATUALIZADO"
  | "ERRO";

export type FaseIntegracaoProdest =
  | "PREPARACAO"
  | "AUTENTICACAO"
  | "ENVIO"
  | "PROCESSAMENTO"
  | "RELATORIO"
  | "CONCLUSAO";

export type StatusOperacionalProdest =
  | "AGUARDANDO"
  | "EM_ANDAMENTO"
  | "SUCESSO"
  | "AVISO"
  | "ERRO"
  | "IGNORADO";

export interface EtapaProdest {
  etapa?: number | string | null;
  status?: number | string | null;
  etapa_nome: string;
  status_nome: string;
  tentativas?: number | null;
  mensagemErro?: string | null;
  [key: string]: unknown;
}

export interface EnvioOrganogramaProdest {
  idenvioorganograma: number;
  idimportacaoplanilha_id: number;
  idprocessocargainicial_id: number | null;
  idpatriarca_id: number;
  patriarca_nome: string;
  importacao_referencia: string;
  flgdryrun: boolean;
  modo: "SIMULACAO" | "DEFINITIVO";
  strambiente: string;
  idexternocarga: string | null;
  strstatus: EnvioOrganogramaStatus;
  status_nome: string;
  finalizada_prodest: boolean;
  relatorio_disponivel: boolean;
  etapas_prodest: EtapaProdest[];
  strfaseatual: FaseIntegracaoProdest;
  fase_atual: FaseIntegracaoProdest;
  fase_atual_nome: string;
  status_atual: StatusOperacionalProdest;
  status_atual_nome: string;
  strmensagematual: string;
  mensagem_atual: string;
  datultimaatividade: string;
  datproximaconsulta: string | null;
  acoes_disponiveis: {
    consultar_detalhes: boolean;
    consultar_status: boolean;
    consultar_relatorio: boolean;
    tentar_novamente: boolean;
  };
  ultimo_evento_id: number | null;
  strhashpayload: string;
  jsonstatusprodest: Record<string, unknown>;
  jsonrelatorioprodest: Record<string, unknown>;
  strmensagemerro: string;
  datsolicitacao: string;
  datultimaconsulta: string | null;
  datfinalizacao: string | null;
  created_by_id: number | null;
  created_by_name: string | null;
  updated_by_id: number | null;
  updated_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventoIntegracaoProdest {
  ideventointegracao: number;
  idcorrelacao: string;
  idpatriarca_id: number;
  idprocessocargainicial_id: number | null;
  idenvioorganograma_id: number | null;
  idexternocarga: string | null;
  strvisibilidade: "OPERACIONAL" | "TECNICA";
  strtipocarga: "ORGANOGRAMA" | "LOTACAO";
  strfase: FaseIntegracaoProdest;
  fase_nome: string;
  strcodigo: string;
  strstatusoperacional: StatusOperacionalProdest;
  status_operacional_nome: string;
  strtitulo: string;
  stroperacao: string;
  operacao_nome: string;
  strmetodo: string;
  strendpoint: string;
  inttentativa: number | null;
  strresultado: string;
  resultado_nome: string;
  sucesso: boolean;
  inthttpstatus: number | null;
  intduracaoms: number | null;
  strmensagem: string;
  jsondetalhes: Record<string, unknown>;
  datocorrencia: string;
  created_by_name: string | null;
}

export interface AcompanhamentoEnvioOrganograma {
  patriarca_id: number;
  tentativa_ativa: EnvioOrganogramaProdest | null;
  ultimo_resultado: EnvioOrganogramaProdest | null;
  bloqueio_novo_envio: boolean;
  motivo_bloqueio: string;
  eventos_recentes: EventoIntegracaoProdest[];
}

export interface EventosEnvioOrganogramaPage {
  idenvioorganograma: number;
  ultimo_evento_id: number;
  possui_mais: boolean;
  eventos: EventoIntegracaoProdest[];
}

export interface ProcessoAtualizadoProdest {
  processo_id: number | null;
  patriarca_id: number;
  tipo_carga: "ORGANOGRAMA" | "LOTACAO";
  envio_id: number;
  fase_atual: FaseIntegracaoProdest;
  fase_atual_nome: string;
  status_atual: StatusOperacionalProdest;
  status_atual_nome: string;
  mensagem_atual: string;
  datultimaatividade: string;
  ultimo_evento_id: number;
}

export interface MensagemWebSocketProdest {
  tipo: "processo_atualizado" | string;
  processo?: ProcessoAtualizadoProdest;
  evento?: {
    idevento: number;
    fase: FaseIntegracaoProdest;
    codigo: string;
    status: StatusOperacionalProdest;
    titulo: string;
    mensagem: string;
    datocorrencia: string;
  };
}

export interface DashboardCargaOrgLot {
  gerado_em: string;
  resumo: {
    patriarcas: number;
    processos_em_andamento: number;
    processos_com_erro: number;
    processos_concluidos_hoje: number;
  };
  processos_em_andamento: EnvioOrganogramaProdest[];
}

export interface CargaRemotaProdest {
  guid?: string;
  cargaId?: string;
  finalizada: boolean;
  dryRun?: boolean;
  etapas?: EtapaProdest[];
  idenvioorganograma_local: number | null;
  [key: string]: unknown;
}

export interface CargasRecentesProdest {
  patriarca_id: number;
  patriarca_externo_id: string;
  limite: number;
  cargas: CargaRemotaProdest[];
}

export interface ConfiguracaoProdest {
  configurado: boolean;
  ambiente: string;
  ausentes: string[];
  invalidas: string[];
}

export interface TesteConexaoProdest {
  conectado: boolean;
  ambiente: string;
  token_armazenado: string;
  token_exposto: false;
}
