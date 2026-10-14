import axios, { type AxiosProgressEvent } from "axios";

import api from "@/lib/api";
import type {
  ImportacaoPlanilha,
  ItemOrganograma,
  ItemOrganogramaPayload,
  PaginatedResponse,
  Patriarca,
  PatriarcaCreatePayload,
  PatriarcaUpdatePayload,
  StatusProgresso,
  SheetSelectionReport,
  ValidationReport,
} from "@/features/carga-org-lot/model";

export const PATRIARCAS_ENDPOINT = "/carga-org-lot/patriarcas/";
export const IMPORTACOES_ENDPOINT = "/carga-org-lot/importacoes/";
export const UPLOAD_ENDPOINT = "/carga-org-lot/importacoes/upload/";
export const STATUS_ENDPOINT = "/carga-org-lot/status-progresso/";
export const ITENS_ORGANOGRAMA_ENDPOINT = "/carga-org-lot/itens-organograma/";

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
    onUploadProgress?: (event: AxiosProgressEvent) => void;
  },
) {
  const form = new FormData();
  form.append("idpatriarca_id", String(patriarca));
  form.append("idtipocarga_id", String(tipoCarga));
  form.append("arquivo", arquivo);
  if (options?.statusId) {
    form.append("idstatusprogresso_id", String(options.statusId));
  }
  if (tipoCarga === 3 && options?.aba) {
    form.append("aba", options.aba);
  }
  if ((tipoCarga === 4 || tipoCarga === 5) && options?.organogramaId) {
    form.append("idimportacaoorganograma_id", String(options.organogramaId));
  }

  const response = await api.post<ImportacaoPlanilha>(UPLOAD_ENDPOINT, form, {
    onUploadProgress: options?.onUploadProgress,
  });
  return response.data;
}

export async function deleteImportacao(id: number) {
  await api.delete(`${IMPORTACOES_ENDPOINT}${id}/`);
}

export async function createItemOrganograma(payload: ItemOrganogramaPayload) {
  const response = await api.post<ItemOrganograma>(
    ITENS_ORGANOGRAMA_ENDPOINT,
    payload,
  );
  return response.data;
}

export async function updateItemOrganograma(
  id: number,
  payload: Partial<ItemOrganogramaPayload>,
) {
  const response = await api.patch<ItemOrganograma>(
    `${ITENS_ORGANOGRAMA_ENDPOINT}${id}/`,
    payload,
  );
  return response.data;
}

export async function deleteItemOrganograma(id: number) {
  await api.delete(`${ITENS_ORGANOGRAMA_ENDPOINT}${id}/`);
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
  if (!Array.isArray(report.erros) || typeof report.mensagem !== "string") {
    return null;
  }
  return report as ValidationReport;
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
