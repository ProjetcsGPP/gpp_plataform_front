"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileClock,
  FileSearch,
  FlaskConical,
  RefreshCw,
  Send,
  TriangleAlert,
} from "lucide-react";

import { AdminDataTable, type AdminTableColumn } from "@/components/admin/AdminDataTable";
import { AdminAlert, AdminPage, AdminPanel } from "@/components/admin/AdminPage";
import { RouteGuard } from "@/components/common/RouteGuard";
import { Button } from "@/components/ui/button";
import { ConfirmarEnvioProdestDialog } from "@/features/carga-org-lot/ConfirmarEnvioProdestDialog";
import { EnvioProdestActivityPanel } from "@/features/carga-org-lot/EnvioProdestActivityPanel";
import {
  consultarRelatorioEnvioOrganogramaProdest,
  consultarStatusEnvioOrganogramaProdest,
  getEnvioOrganogramaProdest,
  listEventosEnvioOrganograma,
  listImportacoes,
  solicitarEnvioOrganogramaProdest,
} from "@/features/carga-org-lot/api";
import type {
  EnvioOrganogramaProdest,
  EventoIntegracaoProdest,
  ImportacaoPlanilha,
  MensagemWebSocketProdest,
} from "@/features/carga-org-lot/model";
import { OrganogramaTreePanel } from "@/features/carga-org-lot/OrganogramaTreeDialog";
import { mergeOperationalEvents } from "@/features/carga-org-lot/prodestEvents";
import {
  isEnvioOrganogramaAtivo,
  useEnviosOrganogramaProdest,
} from "@/features/carga-org-lot/useEnviosOrganogramaProdest";
import { usePatriarcaSelection } from "@/features/carga-org-lot/usePatriarcaSelection";
import { useProdestRealtime } from "@/features/carga-org-lot/useProdestRealtime";
import { usePermissions } from "@/hooks/usePermissions";
import { formatAdminDate } from "@/lib/adminResource";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type Feedback = {
  kind: "error" | "success";
  message: string;
  attemptId?: number;
};
type WizardStep = "source" | "mode" | "confirm";
type PageView = "send" | "history";

export function EnvioOrganogramaProdestPage() {
  const { selected } = usePatriarcaSelection();
  const { can } = usePermissions();
  const canChange = can(PERMISSIONS.IMPORTACAOPLANILHA_CHANGE);
  const patriarcaId = selected?.idpatriarca ?? null;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [density, setDensity] = useState<"compact" | "comfortable">("compact");
  const [view, setView] = useState<PageView>("send");
  const [step, setStep] = useState<WizardStep>("source");
  const [mode, setMode] = useState<"SIMULACAO" | "DEFINITIVO">("SIMULACAO");
  const [selectedImportId, setSelectedImportId] = useState<number | null>(null);
  const [trackedAttempt, setTrackedAttempt] = useState<EnvioOrganogramaProdest | null>(null);
  const [events, setEvents] = useState<EventoIntegracaoProdest[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [viewingImport, setViewingImport] = useState<ImportacaoPlanilha | null>(null);
  const [confirmingDefinitive, setConfirmingDefinitive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualAction, setManualAction] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const submissionLock = useRef(false);
  const lastEventId = useRef(0);

  const sources = useSWR(
    patriarcaId ? ["carga-org-lot:fontes-envio-prodest", patriarcaId] : null,
    () => listImportacoes(patriarcaId!, 3, { page_size: 100 }),
    {
      keepPreviousData: false,
      revalidateOnFocus: true,
      refreshInterval: 0,
      shouldRetryOnError: false,
    },
  );
  const data = useEnviosOrganogramaProdest(patriarcaId, page, pageSize);
  const acompanhamento = data.acompanhamento.data;
  const activeAttempt = acompanhamento?.tentativa_ativa ?? null;
  const latestAttempt = acompanhamento?.ultimo_resultado ?? null;
  const displayedAttempt = trackedAttempt ?? activeAttempt ?? latestAttempt;
  const selectedImport = sources.data?.results.find(
    (item) => item.idimportacaoplanilha === selectedImportId,
  ) ?? null;

  const mergeEvents = useCallback((incoming: EventoIntegracaoProdest[], reset = false) => {
    setEvents((current) => {
      const ordered = mergeOperationalEvents(reset ? [] : current, incoming);
      lastEventId.current = ordered.at(-1)?.ideventointegracao ?? 0;
      return ordered;
    });
  }, []);

  const recoverEvents = useCallback(async (
    envioId: number,
    afterId: number,
    reset = false,
  ) => {
    setEventsLoading(true);
    try {
      let cursor = afterId;
      let first = true;
      do {
        const result = await listEventosEnvioOrganograma(envioId, cursor, 100);
        mergeEvents(result.eventos, reset && first);
        first = false;
        cursor = result.ultimo_evento_id;
        if (!result.possui_mais) break;
      } while (true);
    } catch (error) {
      setFeedback({
        kind: "error",
        message: getApiErrorMessage(error, "Não foi possível atualizar as atividades do envio."),
      });
    } finally {
      setEventsLoading(false);
    }
  }, [mergeEvents]);

  const refreshCanonicalState = useCallback(async () => {
    const refreshed = await data.acompanhamento.mutate();
    await data.history.mutate();
    const target = refreshed?.tentativa_ativa ?? trackedAttempt ?? refreshed?.ultimo_resultado;
    if (target) await recoverEvents(target.idenvioorganograma, lastEventId.current);
  }, [data.acompanhamento, data.history, recoverEvents, trackedAttempt]);

  const handleRealtimeMessage = useCallback((message: MensagemWebSocketProdest) => {
    const process = message.processo;
    if (!process || process.patriarca_id !== patriarcaId) return;
    setTrackedAttempt((current) => {
      if (!current || current.idenvioorganograma !== process.envio_id) return current;
      return {
        ...current,
        fase_atual: process.fase_atual,
        strfaseatual: process.fase_atual,
        fase_atual_nome: process.fase_atual_nome,
        status_atual: process.status_atual,
        status_atual_nome: process.status_atual_nome,
        mensagem_atual: process.mensagem_atual,
        strmensagematual: process.mensagem_atual,
        datultimaatividade: process.datultimaatividade,
        ultimo_evento_id: process.ultimo_evento_id,
      };
    });
    void data.acompanhamento.mutate();
    void data.history.mutate();
    if (displayedAttempt?.idenvioorganograma === process.envio_id) {
      void recoverEvents(process.envio_id, lastEventId.current);
    }
  }, [data.acompanhamento, data.history, displayedAttempt?.idenvioorganograma, patriarcaId, recoverEvents]);

  const realtimeStatus = useProdestRealtime({
    channel: `/ws/carga-org-lot/patriarcas/${patriarcaId ?? 0}/`,
    enabled: Boolean(patriarcaId),
    onMessage: handleRealtimeMessage,
    onReconnect: () => void refreshCanonicalState(),
  });

  useEffect(() => {
    setPage(1);
    setView("send");
    setStep("source");
    setSelectedImportId(null);
    setTrackedAttempt(null);
    setEvents([]);
    lastEventId.current = 0;
    setViewingImport(null);
    setFeedback(null);
  }, [patriarcaId]);

  useEffect(() => {
    if (view === "history") return;
    if (activeAttempt) {
      setTrackedAttempt(activeAttempt);
      setView("send");
      return;
    }
    if (latestAttempt) setTrackedAttempt(latestAttempt);
  }, [activeAttempt, latestAttempt, view]);

  useEffect(() => {
    if (!displayedAttempt) {
      setEvents([]);
      lastEventId.current = 0;
      return;
    }
    const recentBelongsToAttempt = acompanhamento?.eventos_recentes.some(
      (event) => event.idenvioorganograma_id === displayedAttempt.idenvioorganograma,
    );
    mergeEvents(recentBelongsToAttempt ? acompanhamento?.eventos_recentes ?? [] : [], true);
    void recoverEvents(displayedAttempt.idenvioorganograma, 0, true);
  }, [displayedAttempt?.idenvioorganograma]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refreshCanonicalState();
    };
    const refreshWhenOnline = () => void refreshCanonicalState();
    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("online", refreshWhenOnline);
    return () => {
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("online", refreshWhenOnline);
    };
  }, [refreshCanonicalState]);

  const columns = useMemo<AdminTableColumn<EnvioOrganogramaProdest, string>[]>(
    () => [
      { key: "request", label: "Solicitação", render: (row) => formatAdminDate(row.datsolicitacao) },
      { key: "reference", label: "Organograma", className: "font-medium", render: (row) => row.importacao_referencia || "Sem referência" },
      { key: "mode", label: "Modalidade", render: (row) => row.modo === "SIMULACAO" ? "Simulação" : "Definitivo" },
      { key: "status", label: "Resultado", render: (row) => <StatusBadge envio={row} /> },
      { key: "user", label: "Iniciado por", render: (row) => row.created_by_name || "Sistema" },
      {
        key: "actions",
        label: "Ações",
        render: (row) => (
          <Button variant="ghost" size="sm" className="table-action-button" onClick={() => void openAttempt(row.idenvioorganograma)}>
            <Eye aria-hidden="true" /> Acompanhar
          </Button>
        ),
      },
    ],
    [],
  );

  async function submit(dryRun: boolean) {
    if (!selectedImport || submissionLock.current || acompanhamento?.bloqueio_novo_envio) return;
    submissionLock.current = true;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const created = await solicitarEnvioOrganogramaProdest(
        selectedImport.idimportacaoplanilha,
        dryRun,
      );
      setTrackedAttempt(created);
      setEvents([]);
      lastEventId.current = 0;
      setConfirmingDefinitive(false);
      setFeedback({
        kind: "success",
        message: dryRun
          ? "Simulação iniciada. Você pode acompanhar cada etapa ao lado."
          : "Envio definitivo iniciado. Você pode acompanhar cada etapa ao lado.",
      });
      await Promise.all([data.acompanhamento.mutate(), data.history.mutate()]);
      await recoverEvents(created.idenvioorganograma, 0, true);
    } catch (error) {
      const parsed = parseProdestError(error);
      setFeedback({ kind: "error", ...parsed });
      if (getHttpStatus(error) === 409) await data.acompanhamento.mutate();
    } finally {
      submissionLock.current = false;
      setIsSubmitting(false);
    }
  }

  async function openAttempt(id: number) {
    setFeedback(null);
    try {
      const attempt = await getEnvioOrganogramaProdest(id);
      setTrackedAttempt(attempt);
      setView("history");
    } catch (error) {
      setFeedback({ kind: "error", message: getApiErrorMessage(error, "Não foi possível abrir a tentativa.") });
    }
  }

  async function runManualAction(kind: "status" | "report") {
    if (!displayedAttempt) return;
    setManualAction(true);
    setFeedback(null);
    try {
      const latest = kind === "status"
        ? await consultarStatusEnvioOrganogramaProdest(displayedAttempt.idenvioorganograma)
        : await consultarRelatorioEnvioOrganogramaProdest(displayedAttempt.idenvioorganograma);
      setTrackedAttempt(latest);
      await refreshCanonicalState();
    } catch (error) {
      setFeedback({ kind: "error", ...parseProdestError(error) });
    } finally {
      setManualAction(false);
    }
  }

  function retryAttempt() {
    if (!displayedAttempt?.acoes_disponiveis.tentar_novamente) return;
    setSelectedImportId(displayedAttempt.idimportacaoplanilha_id);
    setMode(displayedAttempt.modo);
    setStep("confirm");
    setTrackedAttempt(null);
    setView("send");
  }

  if (viewingImport) {
    return (
      <RouteGuard permission={PERMISSIONS.IMPORTACAOPLANILHA_VIEW}>
        <OrganogramaTreePanel importacao={viewingImport} onClose={() => setViewingImport(null)} />
      </RouteGuard>
    );
  }

  return (
    <RouteGuard permission={PERMISSIONS.IMPORTACAOPLANILHA_VIEW}>
      <AdminPage
        title="Envio do organograma para a PRODEST"
        description="Escolha o organograma e acompanhe o processamento passo a passo."
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setView((current) => current === "send" ? "history" : "send")}
            >
              <FileClock aria-hidden="true" />
              {view === "history" ? "Voltar ao envio" : "Consultar histórico"}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/carga-org-lot/organogramas"><ArrowLeft aria-hidden="true" /> Organogramas</Link>
            </Button>
          </div>
        )}
      >
        <div className="space-y-4">
          <PatriarchBanner
            name={selected ? `${selected.strsiglapatriarca} - ${selected.strnome}` : "Não selecionado"}
            active={activeAttempt}
          />

          {feedback && (
            <AdminAlert variant={feedback.kind} onClose={() => setFeedback(null)}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>{feedback.message}</span>
                {feedback.attemptId && (
                  <Button variant="outline" size="sm" onClick={() => void openAttempt(feedback.attemptId!)}>
                    Abrir tentativa #{feedback.attemptId}
                  </Button>
                )}
              </div>
            </AdminAlert>
          )}

          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(21rem,0.55fr)]">
            <main className="min-w-0">
              {view === "history" ? (
                <HistoryPanel
                  rows={data.history.data?.results ?? []}
                  columns={columns}
                  page={page}
                  pageSize={pageSize}
                  totalCount={data.history.data?.count ?? 0}
                  hasPrevious={Boolean(data.history.data?.previous)}
                  hasNext={Boolean(data.history.data?.next)}
                  density={density}
                  isLoading={data.history.isLoading}
                  isRefreshing={data.history.isValidating}
                  error={data.history.error ? getApiErrorMessage(data.history.error, "Não foi possível carregar o histórico.") : null}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => { setPage(1); setPageSize(size); }}
                  onDensityChange={setDensity}
                  onRetry={() => void data.history.mutate()}
                />
              ) : data.acompanhamento.isLoading ? (
                <AdminPanel className="p-6 text-sm text-slate-500">Carregando situação do envio...</AdminPanel>
              ) : data.acompanhamento.error ? (
                <AdminAlert>
                  <div className="flex items-center justify-between gap-3">
                    <span>{getApiErrorMessage(data.acompanhamento.error, "Não foi possível carregar o acompanhamento.")}</span>
                    <Button variant="outline" size="sm" onClick={() => void data.acompanhamento.mutate()}>
                      <RefreshCw aria-hidden="true" /> Tentar novamente
                    </Button>
                  </div>
                </AdminAlert>
              ) : activeAttempt ? (
                <AttemptOverview
                  envio={displayedAttempt ?? activeAttempt}
                  blockedReason={acompanhamento?.motivo_bloqueio}
                  canChange={canChange}
                  manualAction={manualAction}
                  onStatus={() => void runManualAction("status")}
                  onReport={() => void runManualAction("report")}
                  onRetry={retryAttempt}
                />
              ) : (
                <Wizard
                  step={step}
                  mode={mode}
                  imports={sources.data?.results ?? []}
                  selectedImport={selectedImport}
                  sourcesLoading={sources.isLoading}
                  sourcesError={sources.error ? getApiErrorMessage(sources.error, "Não foi possível carregar os organogramas.") : null}
                  canChange={canChange}
                  isSubmitting={isSubmitting}
                  blocked={Boolean(acompanhamento?.bloqueio_novo_envio)}
                  blockedReason={acompanhamento?.motivo_bloqueio}
                  onStep={setStep}
                  onMode={setMode}
                  onSelect={setSelectedImportId}
                  onView={setViewingImport}
                  onSubmit={() => mode === "DEFINITIVO" ? setConfirmingDefinitive(true) : void submit(true)}
                />
              )}

              {!activeAttempt && displayedAttempt && view === "send" && step === "source" && (
                <div className="mt-5">
                  <AttemptOverview
                    envio={displayedAttempt}
                    canChange={canChange}
                    manualAction={manualAction}
                    onStatus={() => void runManualAction("status")}
                    onReport={() => void runManualAction("report")}
                    onRetry={retryAttempt}
                    compact
                  />
                </div>
              )}
            </main>

            <EnvioProdestActivityPanel
              envio={displayedAttempt ?? null}
              eventos={events}
              realtimeStatus={realtimeStatus}
              isLoading={eventsLoading}
            />
          </div>
        </div>

        {confirmingDefinitive && selectedImport && (
          <ConfirmarEnvioProdestDialog
            importacao={selectedImport}
            isSubmitting={isSubmitting}
            onCancel={() => setConfirmingDefinitive(false)}
            onConfirm={() => void submit(false)}
          />
        )}
      </AdminPage>
    </RouteGuard>
  );
}

function Wizard({
  step,
  mode,
  imports,
  selectedImport,
  sourcesLoading,
  sourcesError,
  canChange,
  isSubmitting,
  blocked,
  blockedReason,
  onStep,
  onMode,
  onSelect,
  onView,
  onSubmit,
}: {
  step: WizardStep;
  mode: "SIMULACAO" | "DEFINITIVO";
  imports: ImportacaoPlanilha[];
  selectedImport: ImportacaoPlanilha | null;
  sourcesLoading: boolean;
  sourcesError: string | null;
  canChange: boolean;
  isSubmitting: boolean;
  blocked: boolean;
  blockedReason?: string;
  onStep: (step: WizardStep) => void;
  onMode: (mode: "SIMULACAO" | "DEFINITIVO") => void;
  onSelect: (id: number) => void;
  onView: (item: ImportacaoPlanilha) => void;
  onSubmit: () => void;
}) {
  const steps: Array<{ code: WizardStep; label: string }> = [
    { code: "source", label: "Escolher organograma" },
    { code: "mode", label: "Escolher modalidade" },
    { code: "confirm", label: "Conferir e iniciar" },
  ];
  const currentIndex = steps.findIndex((item) => item.code === step);
  return (
    <AdminPanel className="overflow-hidden">
      <div className="border-b border-slate-200 px-5 py-4">
        <ol className="grid gap-2 sm:grid-cols-3" aria-label="Etapas para iniciar o envio">
          {steps.map((item, index) => (
            <li key={item.code} className={cn("flex items-center gap-2 text-sm", index <= currentIndex ? "font-semibold text-app-primary" : "text-slate-400")}>
              <span className={cn("flex size-7 items-center justify-center rounded-full border", index <= currentIndex ? "border-app-primary bg-app-primary text-white" : "border-slate-300")}>
                {index + 1}
              </span>
              {item.label}
            </li>
          ))}
        </ol>
      </div>

      {blocked && (
        <div role="alert" className="mx-5 mt-5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <strong>Novo envio indisponível.</strong> {blockedReason || "Existe outro processo em andamento."}
        </div>
      )}

      {step === "source" && (
        <div className="p-5">
          <h2 className="text-lg font-bold text-slate-900">Qual organograma deseja enviar?</h2>
          <p className="mt-1 text-sm text-slate-600">Escolha uma versão incorporada e confira seu conteúdo antes de continuar.</p>
          {sourcesError ? (
            <div className="mt-4"><AdminAlert>{sourcesError}</AdminAlert></div>
          ) : sourcesLoading ? (
            <p className="mt-5 text-sm text-slate-500">Carregando organogramas...</p>
          ) : (
            <div className="mt-5 space-y-3">
              {imports.map((item) => {
                const enabled = isEligibleImport(item);
                const checked = selectedImport?.idimportacaoplanilha === item.idimportacaoplanilha;
                return (
                  <label key={item.idimportacaoplanilha} className={cn("block cursor-pointer rounded-xl border p-4 transition", checked ? "border-app-primary bg-blue-50/60 ring-1 ring-app-primary" : "border-slate-200 hover:border-slate-300", !enabled && "cursor-not-allowed opacity-60")}>
                    <div className="flex items-start gap-3">
                      <input
                        aria-label={`Selecionar ${sourceTitle(item)}`}
                        type="radio"
                        name="prodest-source"
                        checked={checked}
                        disabled={!enabled}
                        onChange={() => onSelect(item.idimportacaoplanilha)}
                        className="mt-1 size-4 accent-[var(--app-primary)]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900">{sourceTitle(item)}</p>
                        <p className="mt-1 text-xs text-slate-500">Importado em {formatAdminDate(item.datimportacao)} · {item.total_itens_organograma ?? "—"} itens</p>
                        {item.flgpossuialteracoes && <p className="mt-2 text-xs font-medium text-amber-800">Esta versão possui alterações manuais.</p>}
                        {!enabled && <p className="mt-2 text-xs font-medium text-red-700">Esta importação não está disponível para envio.</p>}
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={(event) => { event.preventDefault(); onView(item); }}>
                        <Eye aria-hidden="true" /> Visualizar
                      </Button>
                    </div>
                  </label>
                );
              })}
              {!imports.length && <p className="py-8 text-center text-sm text-slate-500">Nenhum organograma disponível para este patriarca.</p>}
            </div>
          )}
          <WizardFooter nextDisabled={!selectedImport || blocked} onNext={() => onStep("mode")} />
        </div>
      )}

      {step === "mode" && (
        <div className="p-5">
          <h2 className="text-lg font-bold text-slate-900">Como deseja realizar o envio?</h2>
          <p className="mt-1 text-sm text-slate-600">A simulação é recomendada para validar os dados antes do envio definitivo.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <ModeCard
              checked={mode === "SIMULACAO"}
              icon={FlaskConical}
              title="Simulação"
              description="Valida o organograma e gera o resultado sem efetivar a carga."
              onSelect={() => onMode("SIMULACAO")}
            />
            <ModeCard
              checked={mode === "DEFINITIVO"}
              icon={Send}
              title="Envio definitivo"
              description="Envia o organograma para efetivação na PRODEST."
              onSelect={() => onMode("DEFINITIVO")}
            />
          </div>
          <WizardFooter onBack={() => onStep("source")} onNext={() => onStep("confirm")} />
        </div>
      )}

      {step === "confirm" && selectedImport && (
        <div className="p-5">
          <h2 className="text-lg font-bold text-slate-900">Confira antes de iniciar</h2>
          <p className="mt-1 text-sm text-slate-600">Depois de iniciado, o processamento continuará mesmo que você saia desta página.</p>
          <dl className="mt-5 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:grid-cols-2">
            <Info label="Organograma" value={sourceTitle(selectedImport)} />
            <Info label="Modalidade" value={mode === "SIMULACAO" ? "Simulação" : "Envio definitivo"} />
            <Info label="Importado em" value={formatAdminDate(selectedImport.datimportacao)} />
            <Info label="Quantidade de itens" value={String(selectedImport.total_itens_organograma ?? "Não informada")} />
          </dl>
          {mode === "DEFINITIVO" && (
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
              <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <p><strong>Atenção:</strong> esta modalidade solicita a efetivação do organograma na PRODEST.</p>
            </div>
          )}
          {!canChange && <p className="mt-4 text-sm text-slate-500">Você possui acesso para acompanhar os envios, mas não para iniciar uma nova tentativa.</p>}
          <div className="mt-6 flex flex-wrap justify-between gap-3">
            <Button variant="outline" onClick={() => onStep("mode")}><ChevronLeft aria-hidden="true" /> Voltar</Button>
            <Button disabled={!canChange || blocked || isSubmitting} onClick={onSubmit}>
              {mode === "SIMULACAO" ? <FlaskConical aria-hidden="true" /> : <Send aria-hidden="true" />}
              {isSubmitting ? "Iniciando..." : mode === "SIMULACAO" ? "Iniciar simulação" : "Iniciar envio definitivo"}
            </Button>
          </div>
        </div>
      )}
    </AdminPanel>
  );
}

function AttemptOverview({
  envio,
  blockedReason,
  canChange,
  manualAction,
  onStatus,
  onReport,
  onRetry,
  compact = false,
}: {
  envio: EnvioOrganogramaProdest;
  blockedReason?: string;
  canChange: boolean;
  manualAction: boolean;
  onStatus: () => void;
  onReport: () => void;
  onRetry: () => void;
  compact?: boolean;
}) {
  const isActive = isEnvioOrganogramaAtivo(envio);
  return (
    <AdminPanel className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-app-primary">
            {isActive ? "Envio em andamento" : compact ? "Último envio" : "Resultado do envio"}
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">{envio.importacao_referencia || `Tentativa #${envio.idenvioorganograma}`}</h2>
          <p className="mt-1 text-sm text-slate-600">Tentativa #{envio.idenvioorganograma} · {envio.modo === "SIMULACAO" ? "Simulação" : "Envio definitivo"}</p>
        </div>
        <StatusBadge envio={envio} />
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="font-semibold text-slate-900">{envio.fase_atual_nome}</p>
        <p className="mt-1 text-sm text-slate-600">{envio.mensagem_atual || envio.strmensagemerro || envio.status_nome}</p>
        {blockedReason && <p className="mt-2 text-xs font-medium text-amber-800">{blockedReason}</p>}
      </div>

      {envio.strstatus === "CONCLUIDO_DESATUALIZADO" && (
        <div role="alert" className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          A carga foi concluída, mas o organograma local foi alterado depois. A PRODEST não desfez o envio já realizado.
        </div>
      )}

      {envio.strstatus === "ERRO" && envio.strmensagemerro && (
        <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {envio.strmensagemerro}
        </div>
      )}

      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
        <Info label="Iniciado em" value={formatAdminDate(envio.datsolicitacao)} />
        <Info label="Iniciado por" value={envio.created_by_name || "Sistema"} />
        <Info label="Última atividade" value={formatAdminDate(envio.datultimaatividade || envio.updated_at)} />
      </dl>

      {envio.relatorio_disponivel && (
        <details className="mt-5 rounded-lg border border-slate-200">
          <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 font-semibold text-slate-900">
            <FileSearch className="size-4" aria-hidden="true" /> Ver relatório
          </summary>
          <div className="border-t border-slate-200 p-4 text-sm">
            <ReportValue value={envio.jsonrelatorioprodest} />
          </div>
        </details>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {canChange && envio.acoes_disponiveis.tentar_novamente && (
          <Button onClick={onRetry}><RefreshCw aria-hidden="true" /> Tentar novamente</Button>
        )}
      </div>

      {canChange && (envio.acoes_disponiveis.consultar_status || envio.acoes_disponiveis.consultar_relatorio) && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer font-medium text-slate-600">Opções auxiliares</summary>
          <div className="mt-3 flex flex-wrap gap-2">
            {envio.acoes_disponiveis.consultar_status && (
              <Button variant="outline" size="sm" disabled={manualAction} onClick={onStatus}>
                <RefreshCw aria-hidden="true" /> Consultar agora
              </Button>
            )}
            {envio.acoes_disponiveis.consultar_relatorio && (
              <Button variant="outline" size="sm" disabled={manualAction} onClick={onReport}>
                <FileSearch aria-hidden="true" /> Atualizar relatório
              </Button>
            )}
          </div>
        </details>
      )}
    </AdminPanel>
  );
}

function HistoryPanel({
  rows,
  columns,
  page,
  pageSize,
  totalCount,
  hasPrevious,
  hasNext,
  density,
  isLoading,
  isRefreshing,
  error,
  onPageChange,
  onPageSizeChange,
  onDensityChange,
  onRetry,
}: {
  rows: EnvioOrganogramaProdest[];
  columns: AdminTableColumn<EnvioOrganogramaProdest, string>[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
  density: "compact" | "comfortable";
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onDensityChange: (density: "compact" | "comfortable") => void;
  onRetry: () => void;
}) {
  return (
    <AdminPanel className="p-5">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-app-primary">Histórico do patriarca</p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">Tentativas de envio</h2>
        <p className="mt-1 text-sm text-slate-600">Abra uma tentativa para consultar suas fases, atividades e resultado.</p>
      </div>
      <AdminDataTable
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.idenvioorganograma}
        sorting={[]}
        onSort={() => undefined}
        page={page}
        pageSize={pageSize}
        pageSizeOptions={[10, 20, 50]}
        totalCount={totalCount}
        hasPreviousPage={hasPrevious}
        hasNextPage={hasNext}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        density={density}
        onDensityChange={onDensityChange}
        onResetView={() => { onPageChange(1); onPageSizeChange(10); onDensityChange("compact"); }}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        errorMessage={error}
        onRetry={onRetry}
        emptyMessage="Nenhuma tentativa de envio foi registrada para este patriarca."
      />
    </AdminPanel>
  );
}

function PatriarchBanner({ name, active }: { name: string; active: EnvioOrganogramaProdest | null }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Patriarca selecionado</p>
        <p className="mt-1 font-bold text-slate-900">{name}</p>
      </div>
      {active ? (
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 text-sm font-semibold text-blue-800">
          <Activity className="size-4" aria-hidden="true" /> Processo em andamento
        </span>
      ) : (
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800">
          <CheckCircle2 className="size-4" aria-hidden="true" /> Disponível para novo envio
        </span>
      )}
    </div>
  );
}

function ModeCard({ checked, icon: Icon, title, description, onSelect }: { checked: boolean; icon: typeof FlaskConical; title: string; description: string; onSelect: () => void }) {
  return (
    <label className={cn("cursor-pointer rounded-xl border p-5 transition", checked ? "border-app-primary bg-blue-50/60 ring-1 ring-app-primary" : "border-slate-200 hover:border-slate-300")}>
      <div className="flex items-start gap-3">
        <input type="radio" name="send-mode" checked={checked} onChange={onSelect} className="mt-1 size-4 accent-[var(--app-primary)]" />
        <Icon className="size-6 text-app-primary" aria-hidden="true" />
        <div><p className="font-bold text-slate-900">{title}</p><p className="mt-1 text-sm text-slate-600">{description}</p></div>
      </div>
    </label>
  );
}

function WizardFooter({ onBack, onNext, nextDisabled = false }: { onBack?: () => void; onNext: () => void; nextDisabled?: boolean }) {
  return (
    <div className="mt-6 flex justify-between gap-3">
      <div>{onBack && <Button variant="outline" onClick={onBack}><ChevronLeft aria-hidden="true" /> Voltar</Button>}</div>
      <Button disabled={nextDisabled} onClick={onNext}>Continuar <ChevronRight aria-hidden="true" /></Button>
    </div>
  );
}

function StatusBadge({ envio }: { envio: EnvioOrganogramaProdest }) {
  const classes = envio.strstatus === "ERRO"
    ? "bg-red-100 text-red-800"
    : envio.strstatus === "CONCLUIDO"
      ? "bg-emerald-100 text-emerald-800"
      : envio.strstatus === "CONCLUIDO_DESATUALIZADO"
        ? "bg-amber-100 text-amber-900"
        : "bg-blue-100 text-blue-800";
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${classes}`}>{envio.status_nome}</span>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 text-slate-800">{value}</dd></div>;
}

function ReportValue({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === "") return <span className="text-slate-500">Não informado</span>;
  if (typeof value === "boolean") return <span>{value ? "Sim" : "Não"}</span>;
  if (typeof value === "string" || typeof value === "number") return <span className="break-words">{String(value)}</span>;
  if (Array.isArray(value)) return <ul className="list-inside list-disc space-y-1">{value.map((item, index) => <li key={index}><ReportValue value={item} /></li>)}</ul>;
  if (typeof value !== "object") return null;
  return <dl className="grid gap-3 sm:grid-cols-2">{Object.entries(value as Record<string, unknown>).map(([key, item]) => <div key={key} className="rounded-md bg-slate-50 p-3"><dt className="text-xs font-semibold uppercase text-slate-500">{key.replaceAll("_", " ")}</dt><dd className="mt-1"><ReportValue value={item} /></dd></div>)}</dl>;
}

function sourceTitle(item: ImportacaoPlanilha) {
  return item.strreferencia || `Importação #${item.idimportacaoplanilha}`;
}

function isEligibleImport(item: ImportacaoPlanilha) {
  return item.strstatusimportacao !== "REJEITADA"
    && item.strstatusimportacao !== "ERRO_PROCESSAMENTO";
}

function getHttpStatus(error: unknown) {
  if (!error || typeof error !== "object" || !("response" in error)) return undefined;
  return (error as { response?: { status?: number } }).response?.status;
}

function parseProdestError(error: unknown): { message: string; attemptId?: number } {
  const fallback = getApiErrorMessage(error, "Não foi possível concluir a operação com a PRODEST.");
  if (!error || typeof error !== "object" || !("response" in error)) {
    return { message: `${fallback} Verifique sua conexão antes de tentar novamente.` };
  }
  const response = (error as { response?: { status?: number; data?: unknown } }).response;
  const data = response?.data;
  const errors = data && typeof data === "object" && "errors" in data
    ? (data as { errors?: unknown }).errors
    : null;
  const record = errors && typeof errors === "object" && !Array.isArray(errors)
    ? errors as Record<string, unknown>
    : {};
  const message = typeof record.message === "string" ? record.message : fallback;
  const attemptId = typeof record.idenvioorganograma === "number"
    ? record.idenvioorganograma
    : undefined;
  return { message, attemptId };
}
