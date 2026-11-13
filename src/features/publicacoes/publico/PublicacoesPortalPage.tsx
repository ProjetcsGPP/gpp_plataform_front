"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { Archive, LogIn, RefreshCw, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getCurrentPublicPublication,
  getPublicPublication,
  listPublicPublications,
} from "./api";
import type { PublicDistributionError } from "./model";
import { PublicacaoPresentation } from "./PublicacaoPresentation";

export function PublicacoesPortalPage() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const current = useSWR("publicacoes-publicas/vigente", getCurrentPublicPublication, {
    revalidateOnFocus: true,
    shouldRetryOnError: false,
  });
  const history = useSWR(
    historyOpen ? "publicacoes-publicas/historico" : null,
    listPublicPublications,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );
  const detail = useSWR(
    selectedId ? ["publicacoes-publicas/detalhe", selectedId] : null,
    ([, id]) => getPublicPublication(id),
    { revalidateOnFocus: true, shouldRetryOnError: false },
  );
  const active = selectedId ? detail : current;

  return <main className="min-h-screen bg-[radial-gradient(circle_at_top,#164e63_0,#020617_50%)] px-3 py-4 md:px-8 md:py-6">
    <div className="mx-auto max-w-[1920px]">
      <nav className="mb-4 flex flex-wrap items-center justify-between gap-3 text-white" aria-label="Navegação pública">
        <div><p className="text-xs uppercase tracking-[0.25em] text-cyan-300">Governo do Espírito Santo</p><strong className="text-lg">Portal de Publicações Institucionais</strong></div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/10" onClick={() => setHistoryOpen((value) => !value)}><Archive /> Histórico</Button>
          <Button asChild className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"><Link href="/portal/login"><LogIn /> Entrar</Link></Button>
        </div>
      </nav>

      {historyOpen && <section className="mb-4 rounded-2xl bg-white p-4" aria-labelledby="history-title"><div className="flex items-center justify-between"><h2 id="history-title" className="text-lg font-semibold">Histórico público</h2>{selectedId && <Button variant="outline" size="sm" onClick={() => setSelectedId(null)}>Voltar à vigente</Button>}</div>
        {history.isLoading && <p role="status" className="mt-3 text-sm text-slate-500">Carregando histórico...</p>}
        {history.error && <PublicState error={history.error as PublicDistributionError} retry={() => void history.mutate()} compact />}
        {history.data && <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{history.data.resultados.map((item) => <li key={item.id}><button className="w-full rounded-xl border p-3 text-left hover:border-sky-500 focus-visible:outline-2 focus-visible:outline-sky-600" onClick={() => setSelectedId(item.id)}><strong className="block">{item.titulo}</strong><span className="text-sm text-slate-600">{item.competencia} · versão {item.versao}</span></button></li>)}</ul>}
      </section>}

      {active.isLoading && <div role="status" className="flex min-h-[35rem] items-center justify-center rounded-3xl bg-white/95 text-slate-600">Carregando publicação institucional...</div>}
      {active.error && <PublicState error={active.error as PublicDistributionError} retry={() => void active.mutate()} />}
      {!active.error && active.data && <PublicacaoPresentation key={active.data.id} publicacao={active.data} autoPlay />}
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
