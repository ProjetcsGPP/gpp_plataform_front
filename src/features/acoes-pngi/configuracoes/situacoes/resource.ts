import { situacaoAcaoApi } from "@/features/acoes-pngi/configuracoes/situacoes/api";
import type {
  SituacaoAcao,
  SituacaoAcaoFormValues,
  SituacaoAcaoPayload,
  SituacaoAcaoSortKey,
} from "@/features/acoes-pngi/configuracoes/situacoes/model";
import { PERMISSIONS } from "@/lib/permissions";
import type { AdminResourceDefinition } from "@/types/adminResource";

const sortKeys = [
  "description",
  "updatedBy",
  "updatedAt",
] as const satisfies readonly SituacaoAcaoSortKey[];

export const situacaoAcaoResource: AdminResourceDefinition<
  SituacaoAcao,
  SituacaoAcaoPayload,
  SituacaoAcaoFormValues,
  SituacaoAcaoSortKey
> = {
  key: "acoes-pngi.configuracoes.situacoes",
  basePath: "/acoes-pngi/configuracoes/situacoes",
  permissions: {
    view: PERMISSIONS.SITUACAOACAO_VIEW,
    add: PERMISSIONS.SITUACAOACAO_ADD,
    change: PERMISSIONS.SITUACAOACAO_CHANGE,
  },
  api: situacaoAcaoApi,
  getId: (situacao) => situacao.idsituacaoacao,
  sortKeys,
  defaultPreferences: {
    pageSize: 10,
    density: "compact",
    sorting: [{ key: "description", direction: "asc" }],
  },
  columns: [
    {
      key: "description",
      label: "Descrição",
      sortKey: "description",
      className: "font-medium text-slate-900",
      render: (situacao) => situacao.strdescricaosituacao,
    },
  ],
  auditColumns: {
    updatedBy: "updatedBy",
    updatedAt: "updatedAt",
  },
  fields: [
    {
      name: "description",
      label: "Descrição",
      help: "Nome da situação, com até 50 caracteres.",
      maxLength: 50,
      required: true,
      autoFocus: true,
    },
  ],
  getInitialValues: (situacao) => ({
    description: situacao?.strdescricaosituacao ?? "",
  }),
  toPayload: (values) => ({
    strdescricaosituacao: values.description.trim(),
  }),
  validate: (values) =>
    values.description.trim()
      ? null
      : "Preencha a descrição da situação.",
  texts: {
    listTitle: "Situações",
    listDescription:
      "Cadastre e mantenha as situações disponíveis para as Ações PNGI.",
    createAction: "Nova situação",
    empty: "Nenhuma situação cadastrada.",
    listError: "Não foi possível carregar as situações.",
    createTitle: "Nova situação",
    createDescription: "Informe os dados da nova situação de Ação PNGI.",
    createError: "Não foi possível criar a situação.",
    editTitle: "Editar situação",
    editDescription: (situacao) =>
      `Altere os dados de ${situacao.strdescricaosituacao}.`,
    editError: "Não foi possível atualizar a situação.",
    notFound: "Situação não encontrada.",
    loading: "Carregando situação...",
  },
};
