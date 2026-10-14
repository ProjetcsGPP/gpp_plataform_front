export interface StatusProgresso {
  idstatusprogresso: number;
  strdescricao: string;
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
  idimportacaoorganograma_id: number | null;
  idstatusprogresso_id: number;
  status: StatusProgresso | null;
  strnomearquivo: string;
  strtipomime: string;
  inttamanhoarquivo: number;
  strhasharquivo: string;
  strabaimportada: string;
  datimportacao: string;
  download_url: string;
  total_itens_organograma: number;
}

export interface ItemOrganograma {
  iditemorganograma: number;
  idimportacaoplanilha_id: number;
  idpai_id: number | null;
  pai_sigla: string | null;
  strnome: string;
  strsigla: string;
  strnumero: string;
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

export type ItemOrganogramaPayload = Pick<
  ItemOrganograma,
  | "idimportacaoplanilha_id"
  | "idpai_id"
  | "strnome"
  | "strsigla"
  | "strnumero"
  | "strreferenciapai"
  | "strabaorigem"
  | "intlinhaorigem"
>;

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
  codigo: string;
  mensagem: string;
  leitura_completa: boolean;
  total_abas_lidas: number;
  total_linhas_lidas: number;
  total_erros: number;
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
