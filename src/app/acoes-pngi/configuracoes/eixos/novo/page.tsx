"use client";

import { AdminResourceCreatePage } from "@/components/admin/AdminResourcePages";
import { eixoResource } from "@/features/acoes-pngi/configuracoes/eixos/resource";

export default function NovoEixoPage() {
  return <AdminResourceCreatePage resource={eixoResource} />;
}
