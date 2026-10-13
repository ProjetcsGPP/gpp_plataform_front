"use client";

import { AdminResourceEditPage } from "@/components/admin/AdminResourcePages";
import { situacaoAcaoResource } from "@/features/acoes-pngi/configuracoes/situacoes/resource";

export default function EditarSituacaoPage() {
  return (
    <AdminResourceEditPage
      resource={situacaoAcaoResource}
      idParam="idsituacaoacao"
    />
  );
}
