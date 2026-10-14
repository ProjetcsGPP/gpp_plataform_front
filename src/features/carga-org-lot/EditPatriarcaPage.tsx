"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";

import { AdminLoading } from "@/components/admin/AdminLoading";
import { AdminAlert, AdminPage } from "@/components/admin/AdminPage";
import { RouteGuard } from "@/components/common/RouteGuard";
import { getPatriarca } from "@/features/carga-org-lot/api";
import { PatriarcaForm } from "@/features/carga-org-lot/PatriarcaForm";
import { usePatriarcaSelection } from "@/features/carga-org-lot/usePatriarcaSelection";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { PERMISSIONS } from "@/lib/permissions";

export function EditPatriarcaPage() {
  const params = useParams<{ idpatriarca: string }>();
  const { selected } = usePatriarcaSelection();
  const id = Number(params.idpatriarca);
  const validId =
    Number.isInteger(id) && id > 0 && selected?.idpatriarca === id;
  const { data, error, isLoading } = useSWR(validId ? ["patriarca", id] : null, () => getPatriarca(id));
  return <RouteGuard permission={PERMISSIONS.PATRIARCA_CHANGE} loadingFallback={<AdminLoading />}>
    {isLoading ? <AdminLoading label="Carregando patriarca..." /> : error || !data ?
      <AdminPage title="Editar patriarca" description="Não foi possível abrir o registro."><AdminAlert>{validId ? getApiErrorMessage(error, "Patriarca não encontrado.") : "Somente o patriarca selecionado pode ser editado."}</AdminAlert></AdminPage> :
      <AdminPage title="Editar patriarca" description={`Altere os dados de ${data.strsiglapatriarca}.`}><PatriarcaForm record={data} /></AdminPage>}
  </RouteGuard>;
}
