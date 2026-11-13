import axios from "axios";

import api from "@/lib/api";
import type {
  PublicErrorCode,
  PublicHistory,
  PublicPublication,
  PublicSeriesPublication,
} from "./model";
import { PublicDistributionError } from "./model";

const PUBLIC_BASE = "/public/v1/publicacoes-institucionais";

interface ConditionalCacheEntry<T> {
  data: T;
  etag?: string;
  lastModified?: string;
}

const conditionalCache = new Map<string, ConditionalCacheEntry<unknown>>();

function publicError(error: unknown) {
  if (error instanceof PublicDistributionError) return error;
  if (!axios.isAxiosError(error)) {
    return new PublicDistributionError("FALHA_CONEXAO", null, null, "Não foi possível consultar a publicação.");
  }
  const online = typeof navigator === "undefined" || navigator.onLine;
  if (!error.response) {
    return new PublicDistributionError(
      online ? "FALHA_CONEXAO" : "OFFLINE",
      null,
      null,
      online ? "Não foi possível conectar ao serviço público." : "Você está offline.",
    );
  }
  const payload = error.response.data as { codigo?: PublicErrorCode; detalhe?: string } | undefined;
  const retryHeader = error.response.headers?.["retry-after"];
  const retryAfter = retryHeader && Number.isFinite(Number(retryHeader)) ? Number(retryHeader) : null;
  return new PublicDistributionError(
    payload?.codigo ?? "FALHA_CONEXAO",
    error.response.status,
    retryAfter,
    payload?.detalhe ?? "A publicação pública não pôde ser carregada.",
  );
}

async function conditionalPublicGet<T>(url: string): Promise<T> {
  const cached = conditionalCache.get(url) as ConditionalCacheEntry<T> | undefined;
  try {
    const response = await api.get<T>(url, {
      adapter: "fetch",
      withCredentials: false,
      gppAuthMode: "public",
      gppBlockUi: false,
      headers: {
        ...(cached?.etag ? { "If-None-Match": cached.etag } : {}),
        ...(cached?.lastModified ? { "If-Modified-Since": cached.lastModified } : {}),
      },
      validateStatus: (status) => (status >= 200 && status < 300) || status === 304,
    });
    if (response.status === 304) {
      if (cached) return cached.data;
      throw new PublicDistributionError("FALHA_CONEXAO", 304, null, "O cache público local não está disponível.");
    }
    conditionalCache.set(url, {
      data: response.data,
      etag: response.headers.etag,
      lastModified: response.headers["last-modified"],
    });
    return response.data;
  } catch (error) {
    throw publicError(error);
  }
}

export function getCurrentPublicPublication() {
  return conditionalPublicGet<PublicPublication>(`${PUBLIC_BASE}/vigente/`);
}

export function listPublicPublications() {
  return conditionalPublicGet<PublicHistory>(`${PUBLIC_BASE}/`);
}

export function getPublicPublication(id: string) {
  return conditionalPublicGet<PublicPublication>(`${PUBLIC_BASE}/${id}/`);
}

export function getPublicPublicationSeries(id: string) {
  return conditionalPublicGet<PublicSeriesPublication>(`${PUBLIC_BASE}/${id}/series/`);
}

export function clearPublicConditionalCache() {
  conditionalCache.clear();
}
