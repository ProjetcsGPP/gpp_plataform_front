import api from "@/lib/api";
import type {
  ColetaMensalEdocs,
  ColetasMensaisEdocsQuery,
  EventoAuditoriaColetaMensalEdocs,
  FonteBrutaColetaMensalEdocs,
  MonthlyDetailQuery,
  PaginatedResponse,
  ResultadoMensalOrganizacaoEdocs,
  ResultadoMensalPatriarcaEdocs,
  SolicitarColetaMensalEdocsPayload,
  TotaisResultadoMensalEdocs,
  TotaisHistoricosEdocs,
  TotaisHistoricosEdocsQuery,
} from "@/features/publicacoes/edocs/mensal/model";

const EDOCS_API = "/pub-institucional";

export async function listColetasMensaisEdocs(query: ColetasMensaisEdocsQuery) {
  const response = await api.get<PaginatedResponse<ColetaMensalEdocs>>(
    `${EDOCS_API}/coletas-mensais-edocs/`,
    { params: query },
  );
  return response.data;
}

export async function solicitarColetaMensalEdocs(
  payload: SolicitarColetaMensalEdocsPayload,
) {
  const response = await api.post<ColetaMensalEdocs>(
    `${EDOCS_API}/coletas-mensais-edocs/`,
    payload,
  );
  return response.data;
}

export async function reencaminharColetaMensalEdocs(id: string) {
  const response = await api.post<ColetaMensalEdocs>(
    `${EDOCS_API}/coletas-mensais-edocs/${id}/reencaminhar/`,
  );
  return response.data;
}

export async function listResultadosMensaisPatriarcasEdocs(
  query: MonthlyDetailQuery,
) {
  const response = await api.get<PaginatedResponse<ResultadoMensalPatriarcaEdocs>>(
    `${EDOCS_API}/resultados-mensais-patriarcas-edocs/`,
    { params: query },
  );
  return response.data;
}

export async function getTotaisResultadosMensaisPatriarcasEdocs(
  coletaId: string,
) {
  const response = await api.get<TotaisResultadoMensalEdocs>(
    `${EDOCS_API}/resultados-mensais-patriarcas-edocs/totais/`,
    { params: { coleta_id: coletaId } },
  );
  return response.data;
}

export async function getTotaisHistoricosEdocs(
  query: TotaisHistoricosEdocsQuery,
) {
  const response = await api.get<TotaisHistoricosEdocs>(
    `${EDOCS_API}/resultados-mensais-patriarcas-edocs/totais-historicos/`,
    { params: query },
  );
  return response.data;
}

export async function listResultadosMensaisOrganizacoesEdocs(
  query: MonthlyDetailQuery,
) {
  const response = await api.get<PaginatedResponse<ResultadoMensalOrganizacaoEdocs>>(
    `${EDOCS_API}/resultados-mensais-organizacoes-edocs/`,
    { params: query },
  );
  return response.data;
}

export async function listFontesBrutasColetasMensaisEdocs(
  query: MonthlyDetailQuery,
) {
  const response = await api.get<PaginatedResponse<FonteBrutaColetaMensalEdocs>>(
    `${EDOCS_API}/fontes-brutas-coletas-mensais-edocs/`,
    { params: query },
  );
  return response.data;
}

export async function listAuditoriaColetasMensaisEdocs(
  query: MonthlyDetailQuery,
) {
  const response = await api.get<PaginatedResponse<EventoAuditoriaColetaMensalEdocs>>(
    `${EDOCS_API}/auditoria-coletas-mensais-edocs/`,
    { params: query },
  );
  return response.data;
}
