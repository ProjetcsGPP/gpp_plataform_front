"use client";

import { useState } from "react";
import { ShieldAlert, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { EncerrarMonitoramentoProdestPayload } from "@/features/carga-org-lot/model";

type BooleanChoice = boolean | null;

export function EncerrarMonitoramentoProdestDialog({
  isSubmitting,
  fieldErrors,
  onCancel,
  onConfirm,
}: {
  isSubmitting: boolean;
  fieldErrors: Record<string, string[]>;
  onCancel: () => void;
  onConfirm: (payload: EncerrarMonitoramentoProdestPayload) => void;
}) {
  const [justification, setJustification] = useState("");
  const [analystNotified, setAnalystNotified] = useState<BooleanChoice>(null);
  const [analystReplied, setAnalystReplied] = useState<BooleanChoice>(null);
  const [analystResponse, setAnalystResponse] = useState("");
  const [riskConfirmed, setRiskConfirmed] = useState(false);

  const trimmedJustification = justification.trim();
  const trimmedResponse = analystResponse.trim();
  const analystDecisionValid = analystNotified === false
    || (analystNotified === true && analystReplied !== null);
  const analystResponseValid = analystReplied !== true
    || (trimmedResponse.length > 0 && trimmedResponse.length <= 4000);
  const valid = trimmedJustification.length >= 10
    && trimmedJustification.length <= 2000
    && analystNotified !== null
    && analystDecisionValid
    && analystResponseValid
    && riskConfirmed;

  function chooseNotified(value: boolean) {
    setAnalystNotified(value);
    if (!value) {
      setAnalystReplied(false);
      setAnalystResponse("");
    } else if (analystReplied === false) {
      setAnalystReplied(null);
    }
  }

  function chooseReplied(value: boolean) {
    if (!analystNotified) return;
    setAnalystReplied(value);
    if (!value) setAnalystResponse("");
  }

  return (
    <div className="fixed inset-0 z-[70] flex cursor-default items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="release-send-title">
      <section className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <h2 id="release-send-title" className="text-lg font-bold text-slate-900">Liberar novo envio</h2>
            <p className="mt-1 text-sm text-slate-600">
              Antes de liberar um novo envio, o backend fará uma última consulta à PRODEST.
            </p>
          </div>
          <Button variant="ghost" size="icon" disabled={isSubmitting} onClick={onCancel} aria-label="Fechar">
            <X aria-hidden="true" />
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-auto p-5">
          <div className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <p>
              Se a carga tiver sido concluída, o resultado será registrado normalmente. Caso continue indefinida,
              somente o acompanhamento local será encerrado. A carga remota não será cancelada e ainda poderá ser
              processada posteriormente.
            </p>
          </div>

          <label className="mt-5 block text-sm font-semibold text-slate-800">
            Justificativa
            <textarea
              autoFocus
              rows={4}
              maxLength={2000}
              value={justification}
              onChange={(event) => setJustification(event.target.value)}
              aria-invalid={Boolean(fieldErrors.justificativa?.length) || (justification.length > 0 && trimmedJustification.length < 10)}
              className="mt-1 block w-full rounded-md border border-slate-300 p-3 text-sm font-normal"
            />
          </label>
          <div className="mt-1 flex justify-between gap-3 text-xs text-slate-500">
            <FieldError errors={fieldErrors.justificativa} fallback={justification.length > 0 && trimmedJustification.length < 10 ? "Informe pelo menos 10 caracteres." : undefined} />
            <span className="ml-auto">{justification.length}/2.000</span>
          </div>

          <BooleanField
            legend="O analista da PRODEST foi avisado?"
            name="analyst-notified"
            value={analystNotified}
            onChange={chooseNotified}
            errors={fieldErrors.analista_prodest_avisado}
          />

          <BooleanField
            legend="O analista respondeu?"
            name="analyst-replied"
            value={analystReplied}
            disabled={analystNotified !== true}
            help={analystNotified === false ? "Como o analista não foi avisado, a resposta foi registrada como não." : undefined}
            onChange={chooseReplied}
            errors={fieldErrors.analista_prodest_respondeu}
          />

          {analystReplied === true && (
            <label className="mt-5 block text-sm font-semibold text-slate-800">
              Orientação fornecida pelo analista
              <textarea
                rows={4}
                maxLength={4000}
                aria-label="Orientação fornecida pelo analista"
                value={analystResponse}
                onChange={(event) => setAnalystResponse(event.target.value)}
                aria-invalid={Boolean(fieldErrors.retorno_analista_prodest?.length) || trimmedResponse.length === 0}
                className="mt-1 block w-full rounded-md border border-slate-300 p-3 text-sm font-normal"
              />
              <span className="mt-1 flex justify-between gap-3 text-xs font-normal text-slate-500">
                <FieldError errors={fieldErrors.retorno_analista_prodest} fallback={!trimmedResponse ? "Registre a orientação recebida." : undefined} />
                <span className="ml-auto">{analystResponse.length}/4.000</span>
              </span>
            </label>
          )}

          <label className="mt-5 flex items-start gap-3 rounded-lg border border-slate-200 p-4 text-sm text-slate-800">
            <input
              type="checkbox"
              checked={riskConfirmed}
              onChange={(event) => setRiskConfirmed(event.target.checked)}
              className="mt-0.5 size-4 accent-[var(--app-primary)]"
            />
            <span>
              Estou ciente de que esta ação não cancela a carga na PRODEST e que ela ainda poderá ser processada posteriormente.
              <FieldError errors={fieldErrors.confirmar_risco_processamento_remoto} />
            </span>
          </label>
        </div>

        <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-200 p-5">
          <Button variant="outline" disabled={isSubmitting} onClick={onCancel}>Continuar aguardando</Button>
          <Button
            disabled={!valid || isSubmitting}
            onClick={() => onConfirm({
              justificativa: trimmedJustification,
              confirmar_risco_processamento_remoto: riskConfirmed,
              analista_prodest_avisado: analystNotified === true,
              analista_prodest_respondeu: analystReplied === true,
              retorno_analista_prodest: analystReplied === true ? trimmedResponse : "",
            })}
          >
            <ShieldAlert aria-hidden="true" />
            {isSubmitting ? "Consultando a PRODEST..." : "Confirmar e liberar novo envio"}
          </Button>
        </footer>
      </section>
    </div>
  );
}

function BooleanField({
  legend,
  name,
  value,
  disabled = false,
  help,
  errors,
  onChange,
}: {
  legend: string;
  name: string;
  value: BooleanChoice;
  disabled?: boolean;
  help?: string;
  errors?: string[];
  onChange: (value: boolean) => void;
}) {
  return (
    <fieldset className="mt-5" disabled={disabled}>
      <legend className="text-sm font-semibold text-slate-800">{legend}</legend>
      <div className="mt-2 flex gap-4">
        {([true, false] as const).map((option) => (
          <label key={String(option)} className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name={name}
              checked={value === option}
              onChange={() => onChange(option)}
              className="size-4 accent-[var(--app-primary)]"
            />
            {option ? "Sim" : "Não"}
          </label>
        ))}
      </div>
      {(help || errors?.length) && <div className="mt-1 text-xs text-slate-500"><FieldError errors={errors} fallback={help} /></div>}
    </fieldset>
  );
}

function FieldError({ errors, fallback }: { errors?: string[]; fallback?: string }) {
  const message = errors?.[0] ?? fallback;
  if (!message) return null;
  return <span className={errors?.length ? "text-red-700" : undefined}>{message}</span>;
}
