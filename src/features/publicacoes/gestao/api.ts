import axios from "axios";
import api from "@/lib/api";
import type { HistoricoPublicacao, PaginatedResponse, Publicacao, PublicacoesQuery, VisaoPayload, VisaoPublicacao } from "./model";

const BASE = "/pub-institucional";

export const listPublicacoes = async (params: PublicacoesQuery) =>
  (await api.get<PaginatedResponse<Publicacao>>(`${BASE}/publicacoes/`, { params })).data;
export const getPublicacao = async (id: string) =>
  (await api.get<Publicacao>(`${BASE}/publicacoes/${id}/`)).data;
export const createPublicacao = async (payload: { titulo: string; ano_referencia: number; mes_referencia: number }) =>
  (await api.post<Publicacao>(`${BASE}/publicacoes/`, payload)).data;
export const addSecao = async (id: string, payload: { configuracao_visao_id: string; titulo: string; ordem: number }) =>
  (await api.post<Publicacao>(`${BASE}/publicacoes/${id}/secoes/`, payload)).data;
export const removeSecao = async (id: string, secao_id: string) =>
  (await api.post<Publicacao>(`${BASE}/publicacoes/${id}/remover-secao/`, { secao_id })).data;
export const recalcularPublicacao = async (id: string) =>
  (await api.post<Publicacao>(`${BASE}/publicacoes/${id}/recalcular/`)).data;
export const reabrirPublicacao = async (id: string) =>
  (await api.post<Publicacao>(`${BASE}/publicacoes/${id}/reabrir/`)).data;
export const getPreviaPublicacao = async (id: string) =>
  (await api.get<Publicacao>(`${BASE}/publicacoes/${id}/previa/`, { headers: { "Cache-Control": "no-store" } })).data;
export const publicarPublicacao = async (id: string, justificativa: string, versao_registro: number) =>
  (await api.post<Publicacao>(`${BASE}/publicacoes/${id}/publicar/`, { justificativa, versao_registro })).data;
export const substituirPublicacao = async (id: string) =>
  (await api.post<Publicacao>(`${BASE}/publicacoes/${id}/substituir/`)).data;
export const revogarPublicacao = async (id: string, justificativa: string) =>
  (await api.post<Publicacao>(`${BASE}/publicacoes/${id}/revogar/`, { justificativa })).data;

export const listVisoes = async (params: Record<string, unknown> = {}) =>
  (await api.get<PaginatedResponse<VisaoPublicacao>>(`${BASE}/visoes-publicacao/`, { params })).data;
export const createVisao = async (payload: VisaoPayload) =>
  (await api.post<VisaoPublicacao>(`${BASE}/visoes-publicacao/`, payload)).data;
export const updateVisao = async (id: string, payload: Partial<VisaoPayload>) =>
  (await api.patch<VisaoPublicacao>(`${BASE}/visoes-publicacao/${id}/`, payload)).data;
export const listHistorico = async (publicacaoId: string) =>
  (await api.get<PaginatedResponse<HistoricoPublicacao>>(`${BASE}/historico-publicacoes/`, { params: { publicacao_id: publicacaoId, page_size: 100 } })).data;

export function getConflict(error: unknown): { codigo: string; detalhe: string } | null {
  if (!axios.isAxiosError(error) || error.response?.status !== 409) return null;
  const data = error.response.data as { codigo?: unknown; detalhe?: unknown };
  return typeof data?.codigo === "string" && typeof data?.detalhe === "string"
    ? { codigo: data.codigo, detalhe: data.detalhe } : null;
}
