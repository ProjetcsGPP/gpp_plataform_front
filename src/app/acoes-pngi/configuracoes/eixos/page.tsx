"use client";

import { AdminResourceListPage } from "@/components/admin/AdminResourcePages";
import { eixoResource } from "@/features/acoes-pngi/configuracoes/eixos/resource";

export default function EixosPage() {
  return <AdminResourceListPage resource={eixoResource} />;
}
