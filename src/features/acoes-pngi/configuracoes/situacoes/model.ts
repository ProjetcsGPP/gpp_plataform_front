export interface SituacaoAcao {
  idsituacaoacao: number;
  strdescricaosituacao: string;
  created_by_id: number | null;
  created_by_name: string;
  updated_by_id: number | null;
  updated_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface SituacaoAcaoPayload {
  strdescricaosituacao: string;
}

export interface SituacaoAcaoFormValues {
  description: string;
}

export type SituacaoAcaoSortKey =
  | "description"
  | "updatedBy"
  | "updatedAt";
