import type {
  SituacaoAcao,
  SituacaoAcaoPayload,
  SituacaoAcaoSortKey,
} from "@/features/acoes-pngi/configuracoes/situacoes/model";
import { createAdminResourceApi } from "@/lib/adminResource";

export const SITUACOES_ACAO_ENDPOINT = "/acoes-pngi/situacoes/";

export const situacaoAcaoApi = createAdminResourceApi<
  SituacaoAcao,
  SituacaoAcaoPayload,
  SituacaoAcaoSortKey
>({
  endpoint: SITUACOES_ACAO_ENDPOINT,
  orderingFields: {
    description: "strdescricaosituacao",
    updatedBy: "updated_by_name",
    updatedAt: "updated_at",
  },
});
