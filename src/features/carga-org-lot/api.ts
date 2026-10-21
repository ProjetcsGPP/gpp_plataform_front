import axios, { type AxiosProgressEvent } from "axios";

import api from "@/lib/api";
import type {
  CargasRecentesProdest,
  AcompanhamentoEnvioOrganograma,
  ConfiguracaoProdest,
  ConjuntoLotacao,
  DashboardCargaOrgLot,
  EnvioOrganogramaProdest,
  EventosEnvioOrganogramaPage,
  HistoricoConjuntoLotacao,
  ImportacaoPlanilha,
  ItemLotacaoImportado,
  ItemOrganograma,
  ItemOrganogramaCreatePayload,
  ItemOrganogramaImpacto,
  ItemOrganogramaUpdatePayload,
  PaginatedResponse,
  Patriarca,
  PatriarcaCreatePayload,
  PatriarcaUpdatePayload,
  ProcessoCargaInicial,
  CasoValidacaoImportacao,
  ResolverCasoValidacaoPayload,
  ResumoConjuntosOrganograma,
  RelatorioValidacaoImportacao,
  StatusProgresso,
  SheetSelectionReport,
  TesteConexaoProdest,
  ValidationReport,
} from "@/features/carga-org-lot/model";

export const PATRIARCAS_ENDPOINT = "/carga-org-lot/patriarcas/";
export const IMPORTACOES_ENDPOINT = "/carga-org-lot/importacoes/";
export const UPLOAD_ENDPOINT = "/carga-org-lot/importacoes/upload/";
export const CREATE_INITIAL_ORGANOGRAM_ENDPOINT =
  "/carga-org-lot/importacoes/criar-organograma-inicial/";
export const STATUS_ENDPOINT = "/carga-org-lot/status-progresso/";
export const ITENS_ORGANOGRAMA_ENDPOINT = "/carga-org-lot/itens-organograma/";
export const PROCESSOS_ENDPOINT = "/carga-org-lot/processos-carga-inicial/";
export const ENVIOS_ORGANOGRAMA_PRODEST_ENDPOINT =
  "/carga-org-lot/envios-organograma-prodest/";
export const CARGA_ORG_LOT_DASHBOARD_ENDPOINT = "/carga-org-lot/dashboard/";
export const CONJUNTOS_LOTACAO_ENDPOINT = "/carga-org-lot/conjuntos-lotacao/";
export const ITENS_LOTACAO_IMPORTADOS_ENDPOINT =
  "/carga-org-lot/itens-lotacao-importados/";
export const CASOS_VALIDACAO_ENDPOINT =
  "/carga-org-lot/casos-validacao-importacao/";

export function processoAtivoKey(patriarcaId: number) {
  return ["carga-org-lot:processo-ativo", patriarcaId] as const;
}

export function enviosOrganogramaProdestKey(
  patriarcaId: number,
  page = 1,
  pageSize = 10,
) {
  return [
    "carga-org-lot:envios-organograma-prodest",
    patriarcaId,
    page,
    pageSize,
  ] as const;
}

export function envioOrganogramaProdestAtivoKey(patriarcaId: number) {
  return ["carga-org-lot:envio-organograma-prodest-ativo", patriarcaId] as const;
}

export function acompanhamentoEnvioOrganogramaKey(patriarcaId: number) {
  return ["carga-org-lot:acompanhamento-envio-organograma", patriarcaId] as const;
}

export const cargaOrgLotDashboardKey = ["carga-org-lot:dashboard"] as const;

export async function listPatriarcas(params?: Record<string, string | number>) {
  const response = await api.get<PaginatedResponse<Patriarca>>(
    PATRIARCAS_ENDPOINT,
    { params: { ordering: "strsiglapatriarca,idpatriarca", ...params } },
  );
  return response.data;
}

export async function getPatriarca(id: number) {
  const response = await api.get<Patriarca>(`${PATRIARCAS_ENDPOINT}${id}/`);
  return response.data;
}

export async function createPatriarca(payload: PatriarcaCreatePayload) {
  const response = await api.post<Patriarca>(PATRIARCAS_ENDPOINT, payload);
  return response.data;
}

export async function updatePatriarca(
  id: number,
  payload: PatriarcaUpdatePayload,
) {
  const response = await api.patch<Patriarca>(
    `${PATRIARCAS_ENDPOINT}${id}/`,
    payload,
  );
  return response.data;
}

export async function listStatusProgresso() {
  const response = await api.get<StatusProgresso[]>(STATUS_ENDPOINT);
  return response.data;
}

export async function listProcessosCargaInicial(
  patriarca: number,
  params?: Record<string, string | number | boolean>,
) {
  const response = await api.get<PaginatedResponse<ProcessoCargaInicial>>(
    PROCESSOS_ENDPOINT,
    {
      params: {
        patriarca,
        ativo: true,
        ordering: "-databertura,-idprocessocargainicial",
        ...params,
      },
    },
  );
  return response.data;
}

export async function listImportacoes(
  patriarca: number,
  tipoCarga: 3 | 4 | 5,
  params?: Record<string, string | number>,
) {
  const response = await api.get<PaginatedResponse<ImportacaoPlanilha>>(
    IMPORTACOES_ENDPOINT,
    {
      params: {
        patriarca,
        tipo_carga: tipoCarga,
        ordering: "-datimportacao,-idimportacaoplanilha",
        ...params,
      },
    },
  );
  return response.data;
}

export async function listConjuntosLotacao(
  params?: Record<string, string | number>,
) {
  const response = await api.get<PaginatedResponse<ConjuntoLotacao>>(
    CONJUNTOS_LOTACAO_ENDPOINT,
    { params: { ordering: "-created_at,-idconjuntolotacao", ...params } },
  );
  return response.data;
}

export async function getResumoConjuntosOrganograma(organogramaId: number) {
  const response = await api.get<ResumoConjuntosOrganograma>(
    `${CONJUNTOS_LOTACAO_ENDPOINT}resumo-organograma/`,
    { params: { organograma: organogramaId } },
  );
  return response.data;
}

export async function addImportacaoConjuntoLotacao(
  conjuntoId: number,
  arquivo: File,
  referencia?: string,
) {
  const form = new FormData();
  form.append("arquivo", arquivo);
  form.append("idtipocarga_id", "4");
  if (referencia?.trim()) form.append("strreferencia", referencia.trim());
  const response = await api.post<ImportacaoPlanilha>(
    `${CONJUNTOS_LOTACAO_ENDPOINT}${conjuntoId}/importacoes/`,
    form,
  );
  return response.data;
}

export async function createConjuntoLotacao(payload: {
  idpatriarca_id: number;
  idimportacaoorganograma_id: number;
  strreferencia?: string;
}) {
  const response = await api.post<ConjuntoLotacao>(
    CONJUNTOS_LOTACAO_ENDPOINT,
    payload,
  );
  return response.data;
}

export async function getConjuntoLotacao(id: number) {
  const response = await api.get<ConjuntoLotacao>(
    `${CONJUNTOS_LOTACAO_ENDPOINT}${id}/`,
  );
  return response.data;
}

async function transitionConjuntoLotacao(
  id: number,
  action: "homologar" | "ativar" | "cancelar",
  justificativa: string,
) {
  const response = await api.post<ConjuntoLotacao>(
    `${CONJUNTOS_LOTACAO_ENDPOINT}${id}/${action}/`,
    { justificativa },
  );
  return response.data;
}

export function homologarConjuntoLotacao(id: number, justificativa: string) {
  return transitionConjuntoLotacao(id, "homologar", justificativa);
}

export function ativarConjuntoLotacao(id: number, justificativa: string) {
  return transitionConjuntoLotacao(id, "ativar", justificativa);
}

export function cancelarConjuntoLotacao(id: number, justificativa: string) {
  return transitionConjuntoLotacao(id, "cancelar", justificativa);
}

export async function listHistoricoConjuntoLotacao(
  id: number,
  params?: Record<string, string | number>,
) {
  const response = await api.get<PaginatedResponse<HistoricoConjuntoLotacao>>(
    `${CONJUNTOS_LOTACAO_ENDPOINT}${id}/historico/`,
    { params },
  );
  return response.data;
}

export async function listEnviosOrganogramaProdest(
  patriarca: number,
  params?: Record<string, string | number | boolean>,
) {
  const response = await api.get<PaginatedResponse<EnvioOrganogramaProdest>>(
    ENVIOS_ORGANOGRAMA_PRODEST_ENDPOINT,
    {
      params: {
        patriarca,
        ordering: "-datsolicitacao,-idenvioorganograma",
        ...params,
      },
    },
  );
  return response.data;
}

export async function getEnvioOrganogramaProdest(id: number) {
  const response = await api.get<EnvioOrganogramaProdest>(
    `${ENVIOS_ORGANOGRAMA_PRODEST_ENDPOINT}${id}/`,
  );
  return response.data;
}

export async function getEnvioOrganogramaProdestAtivo(
  patriarca: number,
): Promise<EnvioOrganogramaProdest | null> {
  const [solicitando, processando] = await Promise.all([
    listEnviosOrganogramaProdest(patriarca, {
      status: "SOLICITANDO",
      page_size: 1,
    }),
    listEnviosOrganogramaProdest(patriarca, {
      status: "PROCESSANDO",
      page_size: 1,
    }),
  ]);
  return [...solicitando.results, ...processando.results]
    .sort((left, right) => right.idenvioorganograma - left.idenvioorganograma)[0]
    ?? null;
}

export async function getAcompanhamentoEnvioOrganograma(patriarca: number) {
  const response = await api.get<AcompanhamentoEnvioOrganograma>(
    `${ENVIOS_ORGANOGRAMA_PRODEST_ENDPOINT}acompanhamento/`,
    { params: { patriarca } },
  );
  return response.data;
}

export async function listEventosEnvioOrganograma(
  envioId: number,
  afterId = 0,
  limit = 100,
) {
  const response = await api.get<EventosEnvioOrganogramaPage>(
    `${ENVIOS_ORGANOGRAMA_PRODEST_ENDPOINT}${envioId}/eventos/`,
    {
      params: {
        after_id: afterId,
        limit: Math.min(100, Math.max(1, limit)),
        visibilidade: "OPERACIONAL",
      },
    },
  );
  return response.data;
}

export async function getCargaOrgLotDashboard() {
  const response = await api.get<DashboardCargaOrgLot>(
    CARGA_ORG_LOT_DASHBOARD_ENDPOINT,
  );
  return response.data;
}

export async function solicitarEnvioOrganogramaProdest(
  importacaoId: number,
  dryRun: boolean,
) {
  const response = await api.post<EnvioOrganogramaProdest>(
    ENVIOS_ORGANOGRAMA_PRODEST_ENDPOINT,
    { idimportacaoplanilha_id: importacaoId, dry_run: dryRun },
  );
  return response.data;
}

export async function consultarStatusEnvioOrganogramaProdest(id: number) {
  const response = await api.post<EnvioOrganogramaProdest>(
    `${ENVIOS_ORGANOGRAMA_PRODEST_ENDPOINT}${id}/consultar-status/`,
  );
  return response.data;
}

export async function consultarRelatorioEnvioOrganogramaProdest(id: number) {
  const response = await api.post<EnvioOrganogramaProdest>(
    `${ENVIOS_ORGANOGRAMA_PRODEST_ENDPOINT}${id}/consultar-relatorio/`,
  );
  return response.data;
}

export async function listCargasRecentesProdest(
  patriarca: number,
  limit = 10,
) {
  const response = await api.get<CargasRecentesProdest>(
    `${ENVIOS_ORGANOGRAMA_PRODEST_ENDPOINT}ultimas-prodest/`,
    { params: { patriarca, limit: Math.min(10, Math.max(1, limit)) } },
  );
  return response.data;
}

export async function getConfiguracaoProdest() {
  const response = await api.get<ConfiguracaoProdest>(
    `${ENVIOS_ORGANOGRAMA_PRODEST_ENDPOINT}configuracao/`,
  );
  return response.data;
}

export async function testarConexaoProdest() {
  const response = await api.post<TesteConexaoProdest>(
    `${ENVIOS_ORGANOGRAMA_PRODEST_ENDPOINT}testar-conexao/`,
  );
  return response.data;
}

export async function listItensOrganograma(importacaoId: number) {
  const params = {
    importacao: importacaoId,
    ordering: "strnumero,intlinhaorigem,iditemorganograma",
    page_size: 100,
  };
  const first = await api.get<PaginatedResponse<ItemOrganograma>>(
    ITENS_ORGANOGRAMA_ENDPOINT,
    { params },
  );
  const items = [...first.data.results];

  for (let page = 2; items.length < first.data.count; page += 1) {
    const response = await api.get<PaginatedResponse<ItemOrganograma>>(
      ITENS_ORGANOGRAMA_ENDPOINT,
      { params: { ...params, page } },
    );
    items.push(...response.data.results);
    if (!response.data.next) break;
  }

  return items;
}

export async function uploadImportacao(
  patriarca: number,
  tipoCarga: 3 | 4 | 5,
  arquivo: File,
  options?: {
    statusId?: number;
    aba?: string;
    organogramaId?: number;
    referencia?: string;
    criarUnidadesEspelho?: boolean;
    onUploadProgress?: (event: AxiosProgressEvent) => void;
  },
) {
  const form = new FormData();
  form.append("idpatriarca_id", String(patriarca));
  form.append("idtipocarga_id", String(tipoCarga));
  form.append("arquivo", arquivo);
  if (options?.referencia?.trim()) {
    form.append("strreferencia", options.referencia.trim());
  }
  if (options?.statusId) {
    form.append("idstatusprogresso_id", String(options.statusId));
  }
  if (tipoCarga === 3 && options?.aba) {
    form.append("aba", options.aba);
  }
  if (tipoCarga === 3) {
    form.append(
      "criar_unidades_espelho",
      options?.criarUnidadesEspelho ? "true" : "false",
    );
  }
  if ((tipoCarga === 4 || tipoCarga === 5) && options?.organogramaId) {
    form.append("idimportacaoorganograma_id", String(options.organogramaId));
  }

  const response = await api.post<ImportacaoPlanilha>(UPLOAD_ENDPOINT, form, {
    onUploadProgress: options?.onUploadProgress,
  });
  return response.data;
}

export async function createInitialOrganograma(
  patriarca: number,
  referencia?: string,
) {
  const trimmedReference = referencia?.trim();
  const response = await api.post<ImportacaoPlanilha>(
    CREATE_INITIAL_ORGANOGRAM_ENDPOINT,
    {
      idpatriarca_id: patriarca,
      ...(trimmedReference ? { strreferencia: trimmedReference } : {}),
    },
  );
  return response.data;
}

export async function deleteImportacao(id: number) {
  await api.delete(`${IMPORTACOES_ENDPOINT}${id}/`);
}

export async function getRelatorioImportacao(id: number) {
  const response = await api.get<RelatorioValidacaoImportacao>(
    `${IMPORTACOES_ENDPOINT}${id}/relatorio/`,
  );
  return response.data;
}

export async function getImportacao(id: number) {
  const response = await api.get<ImportacaoPlanilha>(`${IMPORTACOES_ENDPOINT}${id}/`);
  return response.data;
}

export async function listItensLotacaoImportados(importacaoId: number) {
  const params = {
    importacao: importacaoId,
    page_size: 100,
    ordering: "strabaorigem,intlinhaorigem,iditemlotacaoimportado",
  };
  const first = await api.get<PaginatedResponse<ItemLotacaoImportado>>(
    ITENS_LOTACAO_IMPORTADOS_ENDPOINT,
    { params },
  );
  const items = [...first.data.results];

  for (let page = 2; items.length < first.data.count; page += 1) {
    const response = await api.get<PaginatedResponse<ItemLotacaoImportado>>(
      ITENS_LOTACAO_IMPORTADOS_ENDPOINT,
      { params: { ...params, page } },
    );
    items.push(...response.data.results);
    if (!response.data.next) break;
  }
  return items;
}

export async function resolveCasoValidacao(
  id: number,
  payload: ResolverCasoValidacaoPayload,
) {
  const response = await api.post<CasoValidacaoImportacao>(
    `${CASOS_VALIDACAO_ENDPOINT}${id}/resolver/`,
    payload,
  );
  return response.data;
}

export async function incorporarLotacao(id: number) {
  const response = await api.post<ImportacaoPlanilha>(
    `${IMPORTACOES_ENDPOINT}${id}/incorporar-lotacao/`,
    {},
  );
  return response.data;
}

export function importacaoKey(id: number) {
  return ["carga-org-lot:importacao", id] as const;
}

export async function createItemOrganograma(payload: ItemOrganogramaCreatePayload) {
  const response = await api.post<ItemOrganograma>(
    ITENS_ORGANOGRAMA_ENDPOINT,
    payload,
  );
  return response.data;
}

export async function updateItemOrganograma(
  id: number,
  payload: Partial<ItemOrganogramaUpdatePayload>,
) {
  const response = await api.patch<ItemOrganograma>(
    `${ITENS_ORGANOGRAMA_ENDPOINT}${id}/`,
    payload,
  );
  return response.data;
}

export async function getImpactoExclusaoItem(id: number) {
  const response = await api.get<ItemOrganogramaImpacto>(
    `${ITENS_ORGANOGRAMA_ENDPOINT}${id}/impacto-exclusao/`,
  );
  return response.data;
}

export async function deleteItemOrganograma(id: number, confirmarSubarvore = false) {
  const url = `${ITENS_ORGANOGRAMA_ENDPOINT}${id}/`;
  if (confirmarSubarvore) {
    await api.delete(url, { params: { confirmar_subarvore: true } });
  } else {
    await api.delete(url);
  }
}

export function getSubtreeConfirmationImpact(error: unknown) {
  if (!axios.isAxiosError(error) || error.response?.status !== 409) return null;
  const errors = error.response.data?.errors;
  if (errors?.code !== "confirmacao_exclusao_subarvore_obrigatoria") return null;
  return errors.impacto as ItemOrganogramaImpacto;
}

function filenameFromDisposition(disposition?: string): string | null {
  if (!disposition) return null;
  const utf8 = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (utf8) return decodeURIComponent(utf8.replace(/["']/g, ""));
  return disposition.match(/filename="?([^";]+)"?/i)?.[1] ?? null;
}

export async function downloadArquivo(url: string, fallbackName: string) {
  const response = await api.get<Blob>(url, { responseType: "blob" });
  const filename =
    filenameFromDisposition(response.headers["content-disposition"]) ??
    fallbackName;
  const objectUrl = URL.createObjectURL(response.data);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
  return filename;
}

export function latestOrganogramaUrl(patriarcaId: number) {
  return `${PATRIARCAS_ENDPOINT}${patriarcaId}/organograma/download/`;
}

export function getValidationReport(error: unknown): ValidationReport | null {
  if (!axios.isAxiosError(error)) return null;
  const report = error.response?.data?.errors?.arquivo;
  if (!report || typeof report !== "object") return null;
  if (!Array.isArray(report.erros)) {
    return null;
  }
  return {
    ...report,
    codigo: typeof report.codigo === "string" ? report.codigo : "planilha_invalida",
    mensagem:
      typeof report.mensagem === "string"
        ? report.mensagem
        : "A importação foi rejeitada porque a planilha contém erros.",
  } as ValidationReport;
}

export function getSheetSelectionReport(
  error: unknown,
): SheetSelectionReport | null {
  if (!axios.isAxiosError(error) || error.response?.status !== 409) return null;
  const report = error.response.data?.errors?.arquivo;
  if (
    !report ||
    typeof report !== "object" ||
    report.codigo !== "selecao_aba_obrigatoria" ||
    typeof report.mensagem !== "string" ||
    !Array.isArray(report.abas)
  ) {
    return null;
  }
  return report as SheetSelectionReport;
}
