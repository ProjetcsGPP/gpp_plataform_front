"use client";

import { Download, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ImportacaoPlanilha } from "@/features/carga-org-lot/model";
import { formatAdminDate } from "@/lib/adminResource";

export function ImportacaoDetailsDialog({
  importacao,
  organograma,
  onClose,
  onDownload,
}: {
  importacao: ImportacaoPlanilha;
  organograma: ImportacaoPlanilha | null;
  onClose: () => void;
  onDownload: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-details-title"
    >
      <section className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 id="import-details-title" className="text-lg font-bold text-slate-900">
              Detalhes da importação
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {importacao.strreferencia || "Sem referência"} · importação #{importacao.idimportacaoplanilha}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar detalhes">
            <X aria-hidden="true" />
          </Button>
        </header>

        <div className="max-h-[calc(90vh-9rem)] space-y-5 overflow-auto p-6">
          {importacao.idimportacaoorganograma_id && (
            <section className="rounded-lg border border-sky-200 bg-sky-50 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-sky-800">
                Organograma associado
              </h3>
              <p className="mt-1 font-semibold text-slate-900">
                {organograma?.strreferencia || organograma?.strnomearquivo || `Organograma #${importacao.idimportacaoorganograma_id}`}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {organograma
                  ? `${organograma.status_importacao_nome} · importado em ${formatAdminDate(organograma.datimportacao)}`
                  : `Importação #${importacao.idimportacaoorganograma_id}`}
              </p>
            </section>
          )}

          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <Detail label="Arquivo" value={importacao.strnomearquivo} />
            <Detail label="Tamanho" value={formatBytes(importacao.inttamanhoarquivo)} />
            <Detail label="Tipo de carga" value={importacao.tipo_carga.strdescricao} />
            <Detail label="Aba processada" value={importacao.strabaimportada || "Não informada"} />
            <Detail label="Status" value={importacao.status_importacao_nome} />
            <Detail label="Resultado da validação" value={formatValidationResult(importacao)} />
            <Detail label="Data da importação" value={formatAdminDate(importacao.datimportacao)} />
            <Detail label="Responsável" value={importacao.created_by_name || "Não informado"} />
            {importacao.idconjuntolotacao_id && (
              <>
                <Detail label="Conjunto de lotações" value={`#${importacao.idconjuntolotacao_id}`} />
                <Detail label="Operação" value={formatOperation(importacao.strtipooperacaolotacao)} />
              </>
            )}
            <Detail label="Formato" value={importacao.strtipomime || "Não informado"} />
            <Detail label="Hash do arquivo" value={importacao.strhasharquivo || "Não informado"} breakAll />
          </dl>

          {importacao.idconjuntolotacao_id && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700" role="note">
              Esta planilha compõe o histórico auditável do conjunto de lotações. Por isso, o arquivo original é preservado e não pode ser excluído fisicamente.
            </div>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          <Button onClick={onDownload}><Download aria-hidden="true" /> Baixar planilha original</Button>
        </footer>
      </section>
    </div>
  );
}

function Detail({ label, value, breakAll = false }: { label: string; value: string; breakAll?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className={`mt-1 text-sm text-slate-900 ${breakAll ? "break-all font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}

function formatOperation(operation: ImportacaoPlanilha["strtipooperacaolotacao"]) {
  if (operation === "INICIAL") return "Importação inicial";
  if (operation === "ACRESCIMO") return "Acréscimo";
  if (operation === "SUBSTITUICAO") return "Substituição";
  return "Não informada";
}

function formatValidationResult(importacao: ImportacaoPlanilha) {
  const report = importacao.relatorio_validacao;
  if (!report) return "Sem relatório";
  if (report.strresultado === "INVALIDO" && (
    importacao.strstatusimportacao === "PRONTA_PARA_INCORPORAR"
    || importacao.strstatusimportacao === "INCORPORADA"
  )) {
    const current = importacao.strstatusimportacao === "INCORPORADA"
      ? "incorporada após tratamento"
      : "críticas tratadas";
    return `${current}; resultado original: ${report.resultado_nome}`;
  }
  return report.resultado_nome;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
