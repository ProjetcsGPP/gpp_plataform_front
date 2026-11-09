import api from "@/lib/api";
import type {
  AuditoriaQuery,
  ColetaPatriarcasEdocs,
  ColetasQuery,
  DecisaoDivergenciaPayload,
  DivergenciaPatriarcaEdocs,
  DivergenciasQuery,
  EventoAuditoriaPatriarcaEdocs,
  PaginatedResponse,
  PatriarcaEdocs,
  PatriarcasQuery,
  SelecaoColetaPayload,
} from "@/features/publicacoes/edocs/model";

const EDOCS_API = "/pub-institucional";

export async function listPatriarcasEdocs(query: PatriarcasQuery) {
  const response = await api.get<PaginatedResponse<PatriarcaEdocs>>(
    `${EDOCS_API}/patriarcas/`,
    { params: query },
  );
  return response.data;
}

export async function alterarSelecaoColetaEdocs(
  id: number,
  payload: SelecaoColetaPayload,
) {
  const response = await api.patch<PatriarcaEdocs>(
    `${EDOCS_API}/patriarcas/${id}/selecao-coleta/`,
    payload,
  );
  return response.data;
}

export async function listColetasEdocs(query: ColetasQuery) {
  const response = await api.get<PaginatedResponse<ColetaPatriarcasEdocs>>(
    `${EDOCS_API}/coletas/`,
    { params: query },
  );
  return response.data;
}

export async function solicitarColetaEdocs() {
  const response = await api.post<ColetaPatriarcasEdocs>(
    `${EDOCS_API}/coletas/`,
  );
  return response.data;
}

export async function listDivergenciasEdocs(query: DivergenciasQuery) {
  const response = await api.get<PaginatedResponse<DivergenciaPatriarcaEdocs>>(
    `${EDOCS_API}/divergencias/`,
    { params: query },
  );
  return response.data;
}

export async function decidirDivergenciaEdocs(
  id: number,
  payload: DecisaoDivergenciaPayload,
) {
  const response = await api.post<DivergenciaPatriarcaEdocs>(
    `${EDOCS_API}/divergencias/${id}/decidir/`,
    payload,
  );
  return response.data;
}

export async function listAuditoriaEdocs(query: AuditoriaQuery) {
  const response = await api.get<
    PaginatedResponse<EventoAuditoriaPatriarcaEdocs>
  >(`${EDOCS_API}/auditoria/`, { params: query });
  return response.data;
}
