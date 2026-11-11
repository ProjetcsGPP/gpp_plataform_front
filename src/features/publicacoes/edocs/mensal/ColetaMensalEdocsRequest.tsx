"use client";

import axios from "axios";
import { useState } from "react";
import { useSWRConfig } from "swr";
import { CalendarPlus } from "lucide-react";

import { AdminAlert, AdminPanel } from "@/components/admin/AdminPage";
import { Button } from "@/components/ui/button";
import { EdocsSelectFilter } from "@/features/publicacoes/edocs/EdocsUi";
import { solicitarColetaMensalEdocs } from "@/features/publicacoes/edocs/mensal/api";
import { revalidateColetaMensalEdocsCaches } from "@/features/publicacoes/edocs/mensal/cache";
import { formatCompetence } from "@/features/publicacoes/edocs/mensal/ui";
import { usePermissions } from "@/hooks/usePermissions";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { PERMISSIONS } from "@/lib/permissions";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
] as const;

export function ColetaMensalEdocsRequest() {
  const now = new Date();
  const { can } = usePermissions();
  const { mutate } = useSWRConfig();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [requesting, setRequesting] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: "error" | "success";
    message: string;
  } | null>(null);

  if (!can(PERMISSIONS.EDOCS_MENSAL_COLETA_SOLICITAR)) return null;

  async function requestCollection() {
    const ano = Number(year);
    const mes = Number(month);
    if (!Number.isInteger(ano) || !Number.isInteger(mes)) return;

    setRequesting(true);
    setFeedback(null);
    try {
      const created = await solicitarColetaMensalEdocs({ ano, mes });
      setFeedback({
        kind: "success",
        message: `Coleta de ${formatCompetence(created.ano, created.mes)} solicitada como revisão ${created.revisao}.`,
      });
      await revalidateColetaMensalEdocsCaches(mutate);
    } catch (caught) {
      const conflict = axios.isAxiosError(caught) && caught.response?.status === 409;
      setFeedback({
        kind: "error",
        message: getApiErrorMessage(
          caught,
          conflict
            ? "Já existe uma coleta ativa para esta competência. Aguarde sua conclusão antes de solicitar outra revisão."
            : "Não foi possível solicitar a coleta mensal E-Docs.",
        ),
      });
    } finally {
      setRequesting(false);
    }
  }

  return (
    <div className="space-y-3" data-testid="monthly-request-alerts">
      <AdminPanel className="p-5" aria-labelledby="monthly-request-title">
        <div className="flex items-start gap-3">
          <span className="rounded-lg bg-sky-100 p-2 text-sky-700">
            <CalendarPlus aria-hidden="true" />
          </span>
          <div className="flex-1">
            <h2 id="monthly-request-title" className="font-semibold text-slate-900">
              Nova coleta mensal
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Cada solicitação cria uma nova revisão da competência. Ela não aprova nem publica dados.
            </p>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label className="text-xs font-medium text-slate-600">
                Ano da nova coleta
                <input
                  type="number"
                  className="mt-1 block w-32 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                />
              </label>
              <EdocsSelectFilter label="Mês da nova coleta" value={month} onChange={setMonth}>
                {MONTHS.map((label, index) => (
                  <option key={label} value={index + 1}>{label}</option>
                ))}
              </EdocsSelectFilter>
              <Button
                onClick={requestCollection}
                disabled={
                  requesting ||
                  !Number.isInteger(Number(year)) ||
                  !Number.isInteger(Number(month))
                }
              >
                <CalendarPlus aria-hidden="true" />
                {requesting ? "Solicitando..." : "Solicitar nova revisão"}
              </Button>
            </div>
          </div>
        </div>
      </AdminPanel>

      {feedback && (
        <AdminAlert variant={feedback.kind} onClose={() => setFeedback(null)}>
          {feedback.message}
        </AdminAlert>
      )}
    </div>
  );
}
