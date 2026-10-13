"use client";

import { AdminResourceEditPage } from "@/components/admin/AdminResourcePages";
import { eixoResource } from "@/features/acoes-pngi/configuracoes/eixos/resource";

export default function EditarEixoPage() {
  return <AdminResourceEditPage resource={eixoResource} idParam="ideixo" />;
}
