"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import { AdminAlert, AdminPanel } from "@/components/admin/AdminPage";
import { Button } from "@/components/ui/button";
import {
  cargaOrgLotDashboardKey,
  getCargaOrgLotDashboard,
  getPatriarca,
} from "@/features/carga-org-lot/api";
import type { MensagemWebSocketProdest } from "@/features/carga-org-lot/model";
import { usePatriarcaSelection } from "@/features/carga-org-lot/usePatriarcaSelection";
import { useProdestRealtime } from "@/features/carga-org-lot/useProdestRealtime";
import { formatAdminDate } from "@/lib/adminResource";
import { getApiErrorMessage } from "@/lib/apiErrors";

export function CargaOrgLotProdestDashboard() {
  const router = useRouter();
  const { select } = usePatriarcaSelection();
  const [openingId, setOpeningId] = useState<number | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    cargaOrgLotDashboardKey,
    getCargaOrgLotDashboard,
    {
      refreshInterval: 0,
      revalidateOnFocus: true,
      shouldRetryOnError: false,
    },
  );

  const onMessage = useCallback((message: MensagemWebSocketProdest) => {
    if (message.tipo !== "processo_atualizado" || !message.processo) return;
    const process = message.processo;
    void mutate((current) => {
      if (!current) return current;
      return {
        ...current,
        processos_em_andamento: current.processos_em_andamento.map((item) => (
          item.idenvioorganograma === process.envio_id
            ? {
                ...item,
                fase_atual: process.fase_atual,
                strfaseatual: process.fase_atual,
                fase_atual_nome: process.fase_atual_nome,
                status_atual: process.status_atual,
                status_atual_nome: process.status_atual_nome,
                mensagem_atual: process.mensagem_atual,
                strmensagematual: process.mensagem_atual,
                datultimaatividade: process.datultimaatividade,
                ultimo_evento_id: process.ultimo_evento_id,
              }
            : item
        )),
      };
    }, { revalidate: true });
  }, [mutate]);
  const realtimeStatus = useProdestRealtime({
    channel: "/ws/carga-org-lot/dashboard/",
    onMessage,
    onReconnect: () => void mutate(),
  });

  async function openProcess(patriarcaId: number) {
    setOpeningId(patriarcaId);
    setOpenError(null);
    try {
      const patriarca = await getPatriarca(patriarcaId);
      select({
        idpatriarca: patriarca.idpatriarca,
        strsiglapatriarca: patriarca.strsiglapatriarca,
        strnome: patriarca.strnome,
      });
      router.push("/carga-org-lot/organogramas/envio-prodest");
    } catch (error) {
      setOpenError(getApiErrorMessage(error, "Não foi possível abrir o acompanhamento."));
    } finally {
      setOpeningId(null);
    }
  }

  if (isLoading) {
    return <AdminPanel className="p-6 text-sm text-slate-500">Carregando visão geral...</AdminPanel>;
  }
  if (error) {
    return (
      <AdminAlert>
        <div className="flex items-center justify-between gap-3">
          <span>{getApiErrorMessage(error, "Não foi possível carregar a visão geral.")}</span>
          <Button size="sm" variant="outline" onClick={() => void mutate()}><RefreshCw aria-hidden="true" /> Tentar novamente</Button>
        </div>
      </AdminAlert>
    );
  }

  const summary = data?.resumo;
  return (
    <div className="space-y-5" aria-busy={isValidating}>
      {openError && <AdminAlert onClose={() => setOpenError(null)}>{openError}</AdminAlert>}
      {realtimeStatus !== "connected" && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          Atualizações em tempo real temporariamente indisponíveis. Reconectando…
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={Building2} label="Patriarcas" value={summary?.patriarcas ?? 0} tone="blue" />
        <SummaryCard icon={LoaderCircle} label="Em andamento" value={summary?.processos_em_andamento ?? 0} tone="blue" />
        <SummaryCard icon={AlertCircle} label="Com erro" value={summary?.processos_com_erro ?? 0} tone="red" />
        <SummaryCard icon={CheckCircle2} label="Concluídos hoje" value={summary?.processos_concluidos_hoje ?? 0} tone="green" />
      </div>

      <section aria-labelledby="active-processes-title">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="active-processes-title" className="text-lg font-bold text-slate-900">Processos em andamento</h2>
            <p className="text-sm text-slate-600">Envios ativos de todos os patriarcas que você pode acompanhar.</p>
          </div>
          {data?.gerado_em && <p className="text-xs text-slate-500">Atualizado em {formatAdminDate(data.gerado_em)}</p>}
        </div>
        {data?.processos_em_andamento.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {data.processos_em_andamento.map((process) => (
              <AdminPanel key={process.idenvioorganograma} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-app-primary">{process.modo === "SIMULACAO" ? "Simulação" : "Envio definitivo"}</p>
                    <h3 className="mt-1 font-bold text-slate-900">{process.patriarca_nome}</h3>
                    <p className="mt-1 text-sm text-slate-600">{process.importacao_referencia || `Tentativa #${process.idenvioorganograma}`}</p>
                  </div>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">{process.fase_atual_nome}</span>
                </div>
                <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">{process.mensagem_atual}</p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="flex items-center gap-1.5 text-xs text-slate-500"><Clock3 className="size-4" aria-hidden="true" /> {formatAdminDate(process.datultimaatividade)}</p>
                  <Button size="sm" onClick={() => void openProcess(process.idpatriarca_id)} disabled={openingId === process.idpatriarca_id}>
                    <ExternalLink aria-hidden="true" /> {openingId === process.idpatriarca_id ? "Abrindo..." : "Acompanhar"}
                  </Button>
                </div>
              </AdminPanel>
            ))}
          </div>
        ) : (
          <AdminPanel className="p-8 text-center text-sm text-slate-500">Nenhum envio está em andamento neste momento.</AdminPanel>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, tone }: { icon: typeof Building2; label: string; value: number; tone: "blue" | "red" | "green" }) {
  const classes = tone === "red" ? "bg-red-50 text-red-700" : tone === "green" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700";
  return (
    <AdminPanel className="flex items-center gap-4 p-5">
      <span className={`flex size-11 items-center justify-center rounded-xl ${classes}`}><Icon className="size-5" aria-hidden="true" /></span>
      <div><p className="text-2xl font-bold text-slate-950">{value}</p><p className="text-sm text-slate-600">{label}</p></div>
    </AdminPanel>
  );
}
