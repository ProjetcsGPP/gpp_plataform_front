"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ValidationReport } from "@/features/carga-org-lot/model";
import { formatOrganogramaValidationMessage } from "@/features/carga-org-lot/validationMessages";

export function ValidationReportDialog({
  report,
  onClose,
}: {
  report: ValidationReport;
  onClose: () => void;
}) {
  const [groupBySheet, setGroupBySheet] = useState(true);
  const issues = useMemo(
    () =>
      groupBySheet
        ? [...report.erros].sort((a, b) =>
            `${a.aba ?? ""}:${a.linha ?? 0}`.localeCompare(
              `${b.aba ?? ""}:${b.linha ?? 0}`,
              "pt-BR",
              { numeric: true },
            ),
          )
        : report.erros,
    [groupBySheet, report.erros],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="validation-report-title"
    >
      <section className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 id="validation-report-title" className="text-lg font-bold text-slate-900">
              Importação rejeitada
            </h2>
            {report.idimportacaoplanilha && <p className="mt-1 text-sm font-medium text-slate-700">A tentativa foi registrada como importação #{report.idimportacaoplanilha}.</p>}
            <p className="mt-1 text-sm text-red-700">{report.mensagem}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar relatório">
            <X aria-hidden="true" />
          </Button>
        </header>

        <div className="max-h-[calc(90vh-9rem)] overflow-auto p-6">
          {!report.leitura_completa && (
            <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              O arquivo não pôde ser aberto ou interpretado. A leitura não foi concluída.
            </div>
          )}
          <dl className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Summary label="Leitura completa" value={report.leitura_completa ? "Sim" : "Não"} />
            <Summary label="Abas lidas" value={report.total_abas_lidas} />
            <Summary label="Linhas lidas" value={report.total_linhas_lidas} />
            <Summary label="Erros" value={report.total_erros} />
            {report.total_unidades_espelho_criadas !== undefined && (
              <Summary
                label="Unidades criadas automaticamente"
                value={report.total_unidades_espelho_criadas}
              />
            )}
          </dl>

          <div className="mb-3 flex justify-end">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={groupBySheet}
                onChange={(event) => setGroupBySheet(event.target.checked)}
              />
              Agrupar por aba
            </label>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                <tr>
                  {['Aba', 'Linha', 'Campo', 'Código', 'Mensagem'].map((label) => (
                    <th key={label} className="px-4 py-2 font-semibold">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {issues.map((issue, index) => (
                  <tr key={`${issue.codigo}-${issue.aba}-${issue.linha}-${index}`}>
                    <td className="px-4 py-2">{issue.aba || "—"}</td>
                    <td className="px-4 py-2">{issue.linha ?? "—"}</td>
                    <td className="px-4 py-2">{issue.campo || "—"}</td>
                    <td className="px-4 py-2 font-mono text-xs">{issue.codigo}</td>
                    <td className="min-w-72 px-4 py-2">
                      {formatOrganogramaValidationMessage(
                        issue.codigo,
                        issue.mensagem,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <footer className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button onClick={onClose}>Fechar e corrigir o arquivo</Button>
        </footer>
      </section>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-slate-900">{value}</dd>
    </div>
  );
}
