"use client";

import {
  AlertCircle,
  Check,
  Circle,
  LoaderCircle,
  Radio,
  SkipForward,
  TriangleAlert,
} from "lucide-react";

import { AdminPanel } from "@/components/admin/AdminPage";
import type {
  EnvioOrganogramaProdest,
  EventoIntegracaoProdest,
  FaseIntegracaoProdest,
  StatusOperacionalProdest,
} from "@/features/carga-org-lot/model";
import type { ProdestRealtimeStatus } from "@/features/carga-org-lot/useProdestRealtime";
import { formatAdminDate } from "@/lib/adminResource";
import { cn } from "@/lib/utils";

const PHASES: Array<{ code: FaseIntegracaoProdest; label: string }> = [
  { code: "PREPARACAO", label: "Preparação" },
  { code: "AUTENTICACAO", label: "Autenticação" },
  { code: "ENVIO", label: "Envio" },
  { code: "PROCESSAMENTO", label: "Processamento" },
  { code: "RELATORIO", label: "Relatório" },
  { code: "CONCLUSAO", label: "Conclusão" },
];

export function EnvioProdestActivityPanel({
  envio,
  eventos,
  realtimeStatus,
  isLoading,
}: {
  envio: EnvioOrganogramaProdest | null;
  eventos: EventoIntegracaoProdest[];
  realtimeStatus: ProdestRealtimeStatus;
  isLoading: boolean;
}) {
  return (
    <aside className="xl:sticky xl:top-5 xl:self-start" aria-label="Acompanhamento do envio">
      <AdminPanel className="overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-app-primary">
                Acompanhamento
              </p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">
                {envio ? envio.fase_atual_nome : "Aguardando início"}
              </h2>
            </div>
            <ConnectionIndicator status={realtimeStatus} />
          </div>
          <p className="mt-2 text-sm text-slate-600">
            {envio?.mensagem_atual || "As etapas aparecerão aqui quando o envio for iniciado."}
          </p>
          {envio?.datultimaatividade && (
            <p className="mt-2 text-xs text-slate-500">
              Última atividade: {formatAdminDate(envio.datultimaatividade)}
            </p>
          )}
        </div>

        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-900">Etapas</h3>
          <PhaseStepper envio={envio} />
        </div>

        <div className="px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-900">Atividades</h3>
          {isLoading ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              Atualizando atividades...
            </div>
          ) : eventos.length ? (
            <ol className="mt-4 max-h-[34rem] space-y-0 overflow-y-auto pr-1">
              {eventos.map((evento, index) => (
                <TimelineEvent
                  key={evento.ideventointegracao}
                  evento={evento}
                  last={index === eventos.length - 1}
                />
              ))}
            </ol>
          ) : (
            <p className="mt-3 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Nenhuma atividade registrada para exibir.
            </p>
          )}
        </div>
      </AdminPanel>
    </aside>
  );
}

function PhaseStepper({ envio }: { envio: EnvioOrganogramaProdest | null }) {
  const currentIndex = envio
    ? PHASES.findIndex((phase) => phase.code === envio.fase_atual)
    : -1;
  return (
    <ol className="mt-3 space-y-2">
      {PHASES.map((phase, index) => {
        const status: StatusOperacionalProdest = !envio || index > currentIndex
          ? "AGUARDANDO"
          : index < currentIndex
            ? "SUCESSO"
            : envio.status_atual;
        const presentation = statusPresentation(status);
        const Icon = presentation.icon;
        return (
          <li key={phase.code} className="flex items-center gap-3 text-sm">
            <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", presentation.badge)}>
              <Icon className={cn("size-4", status === "EM_ANDAMENTO" && "animate-spin")} aria-hidden="true" />
            </span>
            <span className={cn("font-medium", index === currentIndex ? "text-slate-950" : "text-slate-600")}>
              {phase.label}
            </span>
            {index === currentIndex && envio && (
              <span className="ml-auto text-xs text-slate-500">{envio.status_atual_nome}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function TimelineEvent({
  evento,
  last,
}: {
  evento: EventoIntegracaoProdest;
  last: boolean;
}) {
  const presentation = statusPresentation(evento.strstatusoperacional);
  const Icon = presentation.icon;
  const details = Object.entries(evento.jsondetalhes ?? {});
  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {!last && <span className="absolute left-3.5 top-7 h-[calc(100%-1rem)] w-px bg-slate-200" aria-hidden="true" />}
      <span className={cn("relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full", presentation.badge)}>
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className={cn("min-w-0 flex-1", last && "rounded-lg bg-slate-50 px-3 py-2 -mt-2")}>
        <div className="flex flex-wrap items-baseline justify-between gap-1">
          <p className="text-sm font-semibold text-slate-900">{evento.strtitulo}</p>
          <time className="text-[0.7rem] text-slate-500" dateTime={evento.datocorrencia}>
            {formatAdminDate(evento.datocorrencia)}
          </time>
        </div>
        <p className="mt-1 text-xs text-slate-600">{evento.strmensagem}</p>
        <p className="mt-1 text-[0.7rem] font-medium text-slate-500">{evento.fase_nome}</p>
        {details.length > 0 && (
          <details className="mt-2 text-xs text-slate-600">
            <summary className="cursor-pointer font-medium text-app-primary">Mais informações</summary>
            <dl className="mt-2 space-y-1 rounded-md bg-white p-2">
              {details.map(([key, value]) => (
                <div key={key} className="grid grid-cols-[minmax(6rem,auto)_1fr] gap-2">
                  <dt className="font-medium">{humanize(key)}</dt>
                  <dd className="break-words">{formatDetail(value)}</dd>
                </div>
              ))}
            </dl>
          </details>
        )}
      </div>
    </li>
  );
}

function ConnectionIndicator({ status }: { status: ProdestRealtimeStatus }) {
  if (status === "connected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
        <Radio className="size-3.5" aria-hidden="true" /> Ao vivo
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900"
      title="O processamento continua no servidor."
    >
      <LoaderCircle className={cn("size-3.5", status !== "unavailable" && "animate-spin")} aria-hidden="true" />
      {status === "unavailable" ? "Sem atualização ao vivo" : "Reconectando"}
    </span>
  );
}

function statusPresentation(status: StatusOperacionalProdest) {
  switch (status) {
    case "EM_ANDAMENTO":
      return { icon: LoaderCircle, badge: "bg-blue-100 text-blue-700" };
    case "SUCESSO":
      return { icon: Check, badge: "bg-emerald-100 text-emerald-700" };
    case "AVISO":
      return { icon: TriangleAlert, badge: "bg-amber-100 text-amber-800" };
    case "ERRO":
      return { icon: AlertCircle, badge: "bg-red-100 text-red-700" };
    case "IGNORADO":
      return { icon: SkipForward, badge: "bg-slate-100 text-slate-500" };
    default:
      return { icon: Circle, badge: "bg-slate-100 text-slate-400" };
  }
}

function humanize(value: string) {
  const text = value.replaceAll("_", " ").toLocaleLowerCase("pt-BR");
  return text.charAt(0).toLocaleUpperCase("pt-BR") + text.slice(1);
}

function formatDetail(value: unknown) {
  if (value === null || value === undefined || value === "") return "Não informado";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
