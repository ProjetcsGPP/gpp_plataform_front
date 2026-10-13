"use client";

import { AdminResourceListPage } from "@/components/admin/AdminResourcePages";
import { situacaoAcaoResource } from "@/features/acoes-pngi/configuracoes/situacoes/resource";

export default function SituacoesPage() {
  return <AdminResourceListPage resource={situacaoAcaoResource} />;
}
