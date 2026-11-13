"use client";

import { useMemo, useState } from "react";
import { Clock3, Film, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { VideoExportFormat } from "./videoExport";

const DEFAULT_STEP_DURATION_SECONDS = 12;

export interface VideoExportStep {
  key: string;
  title: string;
}

export function PublicacaoVideoExportDialog({
  steps,
  format,
  available,
  error,
  onClose,
  onStart,
}: {
  steps: VideoExportStep[];
  format: VideoExportFormat | null;
  available: boolean;
  error?: string;
  onClose: () => void;
  onStart: (durations: number[]) => void;
}) {
  const [mode, setMode] = useState<"uniform" | "custom">("uniform");
  const [uniformDuration, setUniformDuration] = useState(String(DEFAULT_STEP_DURATION_SECONDS));
  const [customDurations, setCustomDurations] = useState<Record<string, string>>(
    () => Object.fromEntries(steps.map((step) => [step.key, String(DEFAULT_STEP_DURATION_SECONDS)])),
  );
  const durations = useMemo(
    () => steps.map((step) => Number(mode === "uniform" ? uniformDuration : customDurations[step.key])),
    [customDurations, mode, steps, uniformDuration],
  );
  const valid = durations.length > 0 && durations.every((duration) => Number.isInteger(duration) && duration > 0);
  const totalDuration = valid ? durations.reduce((total, duration) => total + duration, 0) : 0;

  return <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 p-4" role="dialog" aria-modal="true" aria-labelledby="video-export-title">
    <section className="max-h-[92dvh] w-full max-w-3xl overflow-auto rounded-2xl bg-white p-6 text-slate-950 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Exportação local</p>
          <h2 id="video-export-title" className="mt-1 flex items-center gap-2 text-2xl font-bold"><Film aria-hidden="true" /> Gravar apresentação em vídeo</h2>
          <p className="mt-2 text-sm text-slate-600">Defina quanto tempo cada parte do carrossel permanecerá na gravação.</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar configuração do vídeo"><X /></Button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className={`cursor-pointer rounded-xl border p-4 ${mode === "uniform" ? "border-sky-600 bg-sky-50" : "border-slate-300"}`}>
          <span className="flex items-center gap-2 font-semibold"><input type="radio" name="video-duration-mode" value="uniform" checked={mode === "uniform"} onChange={() => setMode("uniform")} /> Mesmo tempo para todas</span>
          <span className="mt-1 block text-sm text-slate-600">Aplica uma única duração a todas as etapas.</span>
        </label>
        <label className={`cursor-pointer rounded-xl border p-4 ${mode === "custom" ? "border-sky-600 bg-sky-50" : "border-slate-300"}`}>
          <span className="flex items-center gap-2 font-semibold"><input type="radio" name="video-duration-mode" value="custom" checked={mode === "custom"} onChange={() => setMode("custom")} /> Personalizar por etapa</span>
          <span className="mt-1 block text-sm text-slate-600">Permite informar um tempo diferente para cada quadro.</span>
        </label>
      </div>

      {mode === "uniform" ? <label className="mt-5 block max-w-xs text-sm font-medium">Tempo por etapa (segundos)
        <Input aria-label="Tempo por etapa em segundos" className="mt-1" type="number" min={1} step={1} value={uniformDuration} onChange={(event) => setUniformDuration(event.target.value)} />
      </label> : <div className="mt-5 space-y-2" aria-label="Tempos personalizados por etapa">
        {steps.map((step, index) => <label key={step.key} className="grid items-center gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-[2rem_1fr_8rem]">
          <span className="text-center text-sm font-bold text-sky-700">{index + 1}</span>
          <span className="text-sm font-medium">{step.title}</span>
          <span className="flex items-center gap-2 text-xs text-slate-500"><Input aria-label={`Tempo da etapa ${index + 1}: ${step.title}`} type="number" min={1} step={1} value={customDurations[step.key] ?? ""} onChange={(event) => setCustomDurations((current) => ({ ...current, [step.key]: event.target.value }))} />s</span>
        </label>)}
      </div>}

      <div className="mt-5 grid gap-3 rounded-xl bg-slate-100 p-4 text-sm sm:grid-cols-2">
        <p className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-sky-700" aria-hidden="true" /><span><strong>Duração total:</strong> {valid ? `${totalDuration} segundos` : "revise os tempos"}</span></p>
        <p><strong>Formato disponível:</strong> {format?.label ?? "indisponível"}{format?.extension === "webm" ? " (fallback do navegador)" : ""}</p>
      </div>

      {!available && <p role="alert" className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Este navegador ou contexto não oferece captura de tela e gravação em um formato compatível. Em produção, acesse a página por HTTPS.</p>}
      {error && <p role="alert" className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-950">
        Ao continuar, escolha <strong>esta guia</strong> no seletor do navegador. A apresentação ocupará a tela e ocultará controles e rodapé. Para interromper antes do final, encerre o compartilhamento pelo navegador ou pressione Esc.
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button disabled={!available || !format || !valid} onClick={() => onStart(durations)}><Film /> Escolher guia e gravar</Button>
      </div>
    </section>
  </div>;
}
