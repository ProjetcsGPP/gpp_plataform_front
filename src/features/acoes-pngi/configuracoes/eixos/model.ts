export interface Eixo {
  ideixo: number;
  strdescricaoeixo: string;
  stralias: string;
  created_by_id: number | null;
  created_by_name: string;
  updated_by_id: number | null;
  updated_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface EixoPayload {
  strdescricaoeixo: string;
  stralias: string;
}

export interface EixoFormValues {
  description: string;
  alias: string;
}

export type EixoSortKey =
  | "description"
  | "alias"
  | "updatedBy"
  | "updatedAt";
