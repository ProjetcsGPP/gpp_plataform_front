import api from "@/lib/api";
import type {
  AuditoriaQuery,
  AuditoriaMunicipiosEdocsQuery,
  AlteracaoSituacaoMunicipioEdocsPayload,
  ColetaPatriarcasEdocs,
  ColetasQuery,
  CorrecaoMunicipioEdocsPayload,
  CriacaoMunicipioEdocsPayload,
  DecisaoDivergenciaPayload,
  DivergenciaPatriarcaEdocs,
  DivergenciasQuery,
  EventoAuditoriaPatriarcaEdocs,
  EventoAuditoriaMunicipioEdocs,
  IndicadoresMunicipaisPayload,
  IndicadorSemUsoEdocsPayload,
  ImplantacaoPatriarcaEdocs,
  ImplantacoesQuery,
  PaginatedResponse,
  MunicipioEdocs,
  MunicipioIbge,
  MunicipiosEdocsQuery,
  PatriarcaEdocs,
  PatriarcasQuery,
  SelecaoColetaPayload,
} from "@/features/publicacoes/edocs/model";

const EDOCS_API = "/pub-institucional";

export async function listMunicipiosIbge() {
  const response = await api.get<MunicipioIbge[]>(
    `${EDOCS_API}/ibge/municipios/`,
  );
  return response.data;
}

export async function listPatriarcasEdocs(query: PatriarcasQuery) {
  const response = await api.get<PaginatedResponse<PatriarcaEdocs>>(
    `${EDOCS_API}/patriarcas/`,
    { params: query },
  );
  return response.data;
}

export async function listImplantacoesEdocs(query: ImplantacoesQuery) {
  const response = await api.get<PaginatedResponse<ImplantacaoPatriarcaEdocs>>(
    `${EDOCS_API}/implantacoes-edocs/`,
    { params: query },
  );
  return response.data;
}

export async function listMunicipiosEdocs(query: MunicipiosEdocsQuery) {
  const response = await api.get<PaginatedResponse<MunicipioEdocs>>(
    `${EDOCS_API}/municipios-edocs/`,
    { params: query },
  );
  return response.data;
}

export async function cadastrarMunicipioEdocs(
  payload: CriacaoMunicipioEdocsPayload,
) {
  const response = await api.post<MunicipioEdocs>(
    `${EDOCS_API}/municipios-edocs/`,
    payload,
  );
  return response.data;
}

export async function alterarSituacaoMunicipioEdocs(
  id: number,
  payload: AlteracaoSituacaoMunicipioEdocsPayload,
) {
  const response = await api.patch<MunicipioEdocs>(
    `${EDOCS_API}/municipios-edocs/${id}/situacao/`,
    payload,
  );
  return response.data;
}

export async function corrigirCadastroMunicipioEdocs(
  id: number,
  payload: CorrecaoMunicipioEdocsPayload,
) {
  const response = await api.patch<MunicipioEdocs>(
    `${EDOCS_API}/municipios-edocs/${id}/cadastro/`,
    payload,
  );
  return response.data;
}

export async function listAuditoriaMunicipiosEdocs(
  query: AuditoriaMunicipiosEdocsQuery,
) {
  const response = await api.get<
    PaginatedResponse<EventoAuditoriaMunicipioEdocs>
  >(`${EDOCS_API}/auditoria-municipios-edocs/`, { params: query });
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

export async function alterarIndicadoresMunicipaisEdocs(
  id: number,
  payload: IndicadoresMunicipaisPayload,
) {
  const response = await api.patch<PatriarcaEdocs>(
    `${EDOCS_API}/patriarcas/${id}/indicadores-municipais/`,
    payload,
  );
  return response.data;
}

export async function alterarIndicadorSemUsoEdocs(
  id: number,
  payload: IndicadorSemUsoEdocsPayload,
) {
  const response = await api.patch<PatriarcaEdocs>(
    `${EDOCS_API}/patriarcas/${id}/indicador-municipio-sem-edocs/`,
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
