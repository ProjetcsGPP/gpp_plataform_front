"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { LogIn, RefreshCw, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getCurrentPublicPublication,
  getPublicPublication,
  listPublicPublications,
} from "./api";
import type {
  PublicDistributionError,
  PublicPublicationSummary,
} from "./model";
import { PublicacaoPresentation } from "./PublicacaoPresentation";

export function sortPublicHistory(items: PublicPublicationSummary[]) {
  return [...items].sort((left, right) => {
    const competencyOrder = right.competencia.localeCompare(left.competencia);
    if (competencyOrder) return competencyOrder;
    const versionOrder = right.versao - left.versao;
    if (versionOrder) return versionOrder;
    const publishedOrder = Date.parse(right.publicada_em) - Date.parse(left.publicada_em);
    if (Number.isFinite(publishedOrder) && publishedOrder) return publishedOrder;
    return right.id.localeCompare(left.id);
  });
}

function historyOptionLabel(item: PublicPublicationSummary) {
  return `${item.competencia} · versão ${item.versao} · ${item.titulo}`;
}

export function PublicacoesPortalPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const current = useSWR("publicacoes-publicas/vigente", getCurrentPublicPublication, {
    revalidateOnFocus: true,
    shouldRetryOnError: false,
  });
  const history = useSWR("publicacoes-publicas/historico", listPublicPublications, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });
  const detail = useSWR(
    selectedId ? ["publicacoes-publicas/detalhe", selectedId] : null,
    ([, id]) => getPublicPublication(id),
    { revalidateOnFocus: true, shouldRetryOnError: false },
  );
  const active = selectedId ? detail : current;
  const orderedHistory = useMemo(
    () => sortPublicHistory(history.data?.resultados ?? [])
      .filter((item) => item.id !== current.data?.id),
    [current.data?.id, history.data?.resultados],
  );
  const publicationSelector = (
    <label className="min-w-0">
      <span className="sr-only">Selecionar publicação</span>
      <select
        aria-label="Selecionar publicação"
        className="h-9 max-w-[min(42vw,28rem)] rounded-lg border border-white/30 bg-slate-950 px-3 text-sm text-white outline-none transition focus-visible:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/40"
        value={selectedId ?? ""}
        onChange={(event) => setSelectedId(event.target.value || null)}
      >
        <option value="">
          {current.data ? `Atual · ${current.data.competencia} · versão ${current.data.versao}` : "Publicação atual"}
        </option>
        {orderedHistory.map((item) => <option key={item.id} value={item.id}>{historyOptionLabel(item)}</option>)}
        {history.isLoading && <option disabled value="__loading__">Carregando histórico...</option>}
        {history.error && <option disabled value="__error__">Histórico temporariamente indisponível</option>}
      </select>
    </label>
  );

  return <main className="min-h-screen bg-[radial-gradient(circle_at_top,#164e63_0,#020617_50%)] px-3 py-4 md:px-8 md:py-6">
    <div className="mx-auto max-w-[1920px]">
      <nav className="mb-4 flex flex-wrap items-center justify-between gap-3 text-white" aria-label="Navegação pública">
        <div><p className="text-xs uppercase tracking-[0.25em] text-cyan-300">Governo do Espírito Santo</p><strong className="text-lg">Portal de Publicações Institucionais</strong></div>
        <div className="flex items-center gap-2">
          <Button asChild className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"><Link href="/portal/login"><LogIn /> Entrar</Link></Button>
        </div>
      </nav>

      {active.isLoading && <div role="status" className="flex min-h-[35rem] items-center justify-center rounded-3xl bg-white/95 text-slate-600">Carregando publicação institucional...</div>}
      {active.error && <PublicState error={active.error as PublicDistributionError} retry={() => void active.mutate()} />}
      {!active.error && active.data && <PublicacaoPresentation key={active.data.id} publicacao={active.data} autoPlay toolbarContent={publicationSelector} />}
    </div>
  </main>;
}

function PublicState({ error, retry, compact = false }: { error: PublicDistributionError; retry: () => void; compact?: boolean }) {
  const content: Record<string, { title: string; text: string }> = {
    PUBLICACAO_NAO_DISPONIVEL: { title: "Ainda não há publicação disponível", text: "Uma nova publicação institucional será apresentada aqui assim que estiver disponível." },
    PUBLICACAO_NAO_ENCONTRADA: { title: "Publicação não encontrada", text: "O conteúdo solicitado não está disponível no histórico público." },
    PUBLICACAO_REVOGADA: { title: "Publicação revogada", text: "Esta publicação foi retirada e não pode mais ser exibida." },
    LIMITE_PUBLICO_EXCEDIDO: { title: "Muitas consultas em pouco tempo", text: error.retryAfter ? `Aguarde aproximadamente ${error.retryAfter} segundos antes de tentar novamente.` : "Aguarde um momento antes de tentar novamente." },
    PUBLICACAO_TEMPORARIAMENTE_INDISPONIVEL: { title: "Publicação temporariamente indisponível", text: "O serviço público está indisponível no momento. Tente novamente mais tarde." },
    OFFLINE: { title: "Você está offline", text: "Verifique sua conexão para consultar as publicações institucionais." },
    FALHA_CONEXAO: { title: "Não foi possível carregar a publicação", text: "Verifique sua conexão e tente novamente." },
  };
  const state = content[error.code] ?? content.FALHA_CONEXAO;
  return <div role="alert" className={`${compact ? "mt-3" : "flex min-h-[35rem] flex-col items-center justify-center"} rounded-3xl bg-white p-8 text-center`}>
    {error.code === "OFFLINE" && <WifiOff className="mb-3 h-10 w-10 text-slate-400" aria-hidden="true" />}
    <h2 className="text-xl font-bold text-slate-900">{state.title}</h2><p className="mt-2 max-w-xl text-slate-600">{state.text}</p>
    {!(["PUBLICACAO_NAO_DISPONIVEL", "PUBLICACAO_REVOGADA", "PUBLICACAO_NAO_ENCONTRADA"] as string[]).includes(error.code) && <Button className="mt-5" onClick={retry}><RefreshCw /> Tentar novamente</Button>}
  </div>;
}
