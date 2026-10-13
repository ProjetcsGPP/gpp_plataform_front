"use client";

import { AdminResourceCreatePage } from "@/components/admin/AdminResourcePages";
import { situacaoAcaoResource } from "@/features/acoes-pngi/configuracoes/situacoes/resource";

export default function NovaSituacaoPage() {
  return <AdminResourceCreatePage resource={situacaoAcaoResource} />;
}
