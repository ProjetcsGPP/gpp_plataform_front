import api from "@/lib/api";
import type {
  AuditoriaEflowQuery,
  ColetaEflow,
  ColetasEflowQuery,
  DefinicaoFluxoEflow,
  DefinicoesEflowQuery,
  EventoAuditoriaEflow,
  EventoAuditoriaPreferenciaEflow,
  PaginatedResponse,
  PerfilCalculoEflow,
  PreferenciaExibicaoEflow,
  ResultadoCalculoEflow,
  ResultadosEflowQuery,
  AuditoriaPreferenciaEflowQuery,
} from "@/features/publicacoes/eflow/model";

const EFLOW_API = "/pub-institucional";

export async function importarColetaEflow(arquivo: File) {
  const form = new FormData();
  form.append("arquivo", arquivo);

  const response = await api.post<ColetaEflow>(
    `${EFLOW_API}/coletas-eflow/`,
    form,
  );
  return response.data;
}

export async function listColetasEflow(query: ColetasEflowQuery) {
  const response = await api.get<PaginatedResponse<ColetaEflow>>(
    `${EFLOW_API}/coletas-eflow/`,
    { params: query },
  );
  return response.data;
}

export async function listDefinicoesEflow(query: DefinicoesEflowQuery) {
  const response = await api.get<PaginatedResponse<DefinicaoFluxoEflow>>(
    `${EFLOW_API}/definicoes-eflow/`,
    { params: query },
  );
  return response.data;
}

export async function listAuditoriaEflow(query: AuditoriaEflowQuery) {
  const response = await api.get<PaginatedResponse<EventoAuditoriaEflow>>(
    `${EFLOW_API}/auditoria-eflow/`,
    { params: query },
  );
  return response.data;
}

export async function listResultadosEflow(query: ResultadosEflowQuery) {
  const response = await api.get<PaginatedResponse<ResultadoCalculoEflow>>(
    `${EFLOW_API}/resultados-eflow/`,
    { params: query },
  );
  return response.data;
}

export async function getMinhaPreferenciaEflow() {
  const response = await api.get<PreferenciaExibicaoEflow>(
    `${EFLOW_API}/preferencias-eflow/minha/`,
  );
  return response.data;
}

export async function alterarMinhaPreferenciaEflow(
  perfil_preferido: PerfilCalculoEflow,
) {
  const response = await api.patch<PreferenciaExibicaoEflow>(
    `${EFLOW_API}/preferencias-eflow/minha/`,
    { perfil_preferido },
  );
  return response.data;
}

export async function listAuditoriaPreferenciaEflow(
  query: AuditoriaPreferenciaEflowQuery,
) {
  const response = await api.get<
    PaginatedResponse<EventoAuditoriaPreferenciaEflow>
  >(`${EFLOW_API}/auditoria-preferencias-eflow/`, { params: query });
  return response.data;
}
