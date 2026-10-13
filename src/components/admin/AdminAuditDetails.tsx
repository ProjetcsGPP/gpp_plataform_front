function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

interface AdminAuditDetailsProps {
  identifier: number;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export function AdminAuditDetails({
  identifier,
  createdBy,
  createdAt,
  updatedBy,
  updatedAt,
}: AdminAuditDetailsProps) {
  return (
    <dl className="grid gap-4 border-t border-slate-200 pt-5 text-sm sm:grid-cols-2">
      <div>
        <dt className="text-slate-500">Identificador</dt>
        <dd className="font-medium text-slate-800">{identifier}</dd>
      </div>
      <div>
        <dt className="text-slate-500">Criado por</dt>
        <dd className="font-medium text-slate-800">{createdBy || "—"}</dd>
      </div>
      <div>
        <dt className="text-slate-500">Criado em</dt>
        <dd className="font-medium text-slate-800">{formatDate(createdAt)}</dd>
      </div>
      <div>
        <dt className="text-slate-500">Última alteração</dt>
        <dd className="font-medium text-slate-800">
          {updatedBy || "—"} · {formatDate(updatedAt)}
        </dd>
      </div>
    </dl>
  );
}
