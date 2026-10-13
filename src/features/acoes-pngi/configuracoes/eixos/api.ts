import { createAdminResourceApi } from "@/lib/adminResource";
import type {
  Eixo,
  EixoPayload,
  EixoSortKey,
} from "@/features/acoes-pngi/configuracoes/eixos/model";

export const EIXOS_ENDPOINT = "/acoes-pngi/eixos/";

export const eixoApi = createAdminResourceApi<
  Eixo,
  EixoPayload,
  EixoSortKey
>({
  endpoint: EIXOS_ENDPOINT,
  orderingFields: {
    description: "strdescricaoeixo",
    alias: "stralias",
    updatedBy: "updated_by_name",
    updatedAt: "updated_at",
  },
});
