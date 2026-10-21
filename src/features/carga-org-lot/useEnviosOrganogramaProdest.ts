"use client";

import useSWR from "swr";

import {
  acompanhamentoEnvioOrganogramaKey,
  enviosOrganogramaProdestKey,
  getAcompanhamentoEnvioOrganograma,
  listEnviosOrganogramaProdest,
} from "@/features/carga-org-lot/api";
import type { EnvioOrganogramaProdest } from "@/features/carga-org-lot/model";

export function isEnvioOrganogramaAtivo(
  envio: EnvioOrganogramaProdest | null | undefined,
) {
  return envio?.strstatus === "SOLICITANDO"
    || envio?.strstatus === "PROCESSANDO";
}

export function useEnviosOrganogramaProdest(
  patriarcaId: number | null,
  page: number,
  pageSize: number,
) {
  const history = useSWR(
    patriarcaId
      ? enviosOrganogramaProdestKey(patriarcaId, page, pageSize)
      : null,
    () => listEnviosOrganogramaProdest(patriarcaId!, {
      page,
      page_size: pageSize,
    }),
    {
      keepPreviousData: false,
      revalidateOnFocus: true,
      refreshInterval: 0,
      shouldRetryOnError: false,
    },
  );
  const acompanhamento = useSWR(
    patriarcaId ? acompanhamentoEnvioOrganogramaKey(patriarcaId) : null,
    () => getAcompanhamentoEnvioOrganograma(patriarcaId!),
    {
      keepPreviousData: false,
      revalidateOnFocus: true,
      refreshInterval: 0,
      shouldRetryOnError: false,
    },
  );

  return { history, acompanhamento };
}
