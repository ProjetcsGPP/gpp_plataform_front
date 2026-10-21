"use client";

import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Clock3,
  FileSearch,
  RefreshCw,
  SkipForward,
} from "lucide-react";

import { AdminPanel } from "@/components/admin/AdminPage";
import { Button } from "@/components/ui/button";
import type {
  EnvioOrganogramaProdest,
  EtapaProdest,
} from "@/features/carga-org-lot/model";
import { formatAdminDate } from "@/lib/adminResource";
import { cn } from "@/lib/utils";

export function EnvioProdestStatusPanel({
  envio,
  isRefreshing,
  canChange,
  onRefresh,
  onReport,
}: {
  envio: EnvioOrganogramaProdest;
  isRefreshing: boolean;
  canChange: boolean;
  onRefresh: () => void;
  onReport: () => void;
}) {
  const isOutdated = envio.strstatus === "CONCLUIDO_DESATUALIZADO";
  const hasExternalLoad = Boolean(envio.idexternocarga);
  return (
    <div className="space-y-5">
      {isOutdated && (
        <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-950">
          <strong>A versão enviada ficou desatualizada.</strong>
          <p className="mt-1">
            A PRODEST concluiu esta carga, mas o organograma local foi alterado
            depois da solicitação. Esta conclusão não representa mais a versão
            atual. Faça uma nova simulação ou um novo envio quando desejar
            atualizar a PRODEST.
          </p>
        </div>
      )}

      <AdminPanel className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-app-primary">
              Processamento na PRODEST
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              {envio.status_nome}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Tentativa #{envio.idenvioorganograma} · {formatMode(envio.modo)} · ambiente {envio.strambiente || "não informado"}
            </p>
          </div>
          {canChange && hasExternalLoad && (
            <Button variant="outline" onClick={onRefresh} disabled={isRefreshing}>
              <RefreshCw className={cn(isRefreshing && "animate-spin")} aria-hidden="true" />
              {isRefreshing ? "Atualizando..." : "Atualizar status"}
            </Button>
          )}
        </div>

        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <Info label="Solicitação" value={formatAdminDate(envio.datsolicitacao)} />
          <Info label="Última consulta" value={formatOptionalDate(envio.datultimaconsulta)} />
          <Info label="Finalização" value={formatOptionalDate(envio.datfinalizacao)} />
        </dl>

        {envio.strmensagemerro && (
          <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {envio.strmensagemerro}
          </div>
        )}
        {!hasExternalLoad && envio.strstatus === "ERRO" && (
          <p className="mt-3 text-sm text-slate-600">
            A PRODEST não criou uma carga para esta solicitação. Por isso, não há status ou relatório remoto para consultar.
          </p>
        )}

        <div className="mt-5">
          <h3 className="font-semibold text-slate-900">Etapas</h3>
          {envio.etapas_prodest.length ? (
            <ol className="mt-3 grid gap-3 lg:grid-cols-2">
              {envio.etapas_prodest.map((stage, index) => (
                <Stage key={`${stage.etapa ?? index}-${index}`} stage={stage} />
              ))}
            </ol>
          ) : (
            <p className="mt-2 text-sm text-slate-500">
              A PRODEST ainda não informou etapas para esta tentativa.
            </p>
          )}
        </div>
      </AdminPanel>

      <AdminPanel className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-app-primary">Resultado</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">Relatório da carga</h2>
          </div>
          {canChange && hasExternalLoad && envio.finalizada_prodest && (
            <Button variant="outline" onClick={onReport} disabled={isRefreshing}>
              <FileSearch aria-hidden="true" /> Consultar relatório
            </Button>
          )}
        </div>
        {envio.relatorio_disponivel ? (
          <div className="mt-4">
            <ReportValue value={envio.jsonrelatorioprodest} depth={0} />
          </div>
        ) : envio.finalizada_prodest ? (
          <p className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            Processamento concluído. O relatório ainda está sendo consolidado pela PRODEST.
          </p>
        ) : (
          <p className="mt-4 text-sm text-slate-600">
            O relatório ficará disponível após o avanço do processamento na PRODEST.
          </p>
        )}
      </AdminPanel>
    </div>
  );
}

function Stage({ stage }: { stage: EtapaProdest }) {
  const presentation = stagePresentation(stage.status_nome);
  const Icon = presentation.icon;
  const message = typeof stage.mensagemErro === "string"
    ? stage.mensagemErro
    : null;
  return (
    <li className={cn("rounded-lg border px-4 py-3", presentation.className)}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 size-5" aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-semibold">{stage.etapa_nome || "Etapa não identificada"}</p>
          <p className="text-sm">{stage.status_nome || "Status desconhecido"}</p>
          {message && <p role="alert" className="mt-1 text-sm font-medium">{message}</p>}
        </div>
      </div>
    </li>
  );
}

function stagePresentation(status: string) {
  const normalized = status.toLocaleLowerCase("pt-BR");
  if (normalized.includes("process")) {
    return { icon: Clock3, className: "border-blue-200 bg-blue-50 text-blue-900" };
  }
  if (normalized.includes("final")) {
    return { icon: CheckCircle2, className: "border-emerald-200 bg-emerald-50 text-emerald-900" };
  }
  if (normalized.includes("erro")) {
    return { icon: AlertCircle, className: "border-red-200 bg-red-50 text-red-900" };
  }
  if (normalized.includes("ignorada")) {
    return { icon: SkipForward, className: "border-slate-200 bg-slate-50 text-slate-700" };
  }
  return { icon: Circle, className: "border-amber-200 bg-amber-50 text-amber-900" };
}

function ReportValue({ value, depth }: { value: unknown; depth: number }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-slate-500">Não informado</span>;
  }
  if (typeof value === "boolean") return <span>{value ? "Sim" : "Não"}</span>;
  if (typeof value === "string" || typeof value === "number") {
    return <span className="break-words">{String(value)}</span>;
  }
  if (Array.isArray(value)) {
    if (!value.length) return <span className="text-slate-500">Nenhum registro</span>;
    return (
      <ul className="space-y-2">
        {value.map((item, index) => (
          <li key={index} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <ReportValue value={item} depth={depth + 1} />
          </li>
        ))}
      </ul>
    );
  }
  if (typeof value !== "object") return null;
  const entries = Object.entries(value as Record<string, unknown>);
  if (!entries.length) return <span className="text-slate-500">Sem informações adicionais</span>;
  return (
    <dl className={cn("grid gap-3", depth === 0 && "md:grid-cols-2")}>
      {entries.map(([key, item]) => (
        <div key={key} className={cn(depth === 0 && "rounded-lg border border-slate-200 p-3")}>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {humanizeKey(key)}
          </dt>
          <dd className="mt-1 text-sm text-slate-800">
            <ReportValue value={item} depth={depth + 1} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function humanizeKey(value: string) {
  const normalized = value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ");
  return normalized.charAt(0).toLocaleUpperCase("pt-BR") + normalized.slice(1);
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 text-slate-800">{value}</dd></div>;
}

function formatOptionalDate(value: string | null) {
  return value ? formatAdminDate(value) : "Ainda não informada";
}

function formatMode(mode: EnvioOrganogramaProdest["modo"]) {
  return mode === "SIMULACAO" ? "Simulação" : "Envio definitivo";
}
