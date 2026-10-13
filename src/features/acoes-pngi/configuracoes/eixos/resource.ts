import { eixoApi } from "@/features/acoes-pngi/configuracoes/eixos/api";
import type {
  Eixo,
  EixoFormValues,
  EixoPayload,
  EixoSortKey,
} from "@/features/acoes-pngi/configuracoes/eixos/model";
import { PERMISSIONS } from "@/lib/permissions";
import type { AdminResourceDefinition } from "@/types/adminResource";

const sortKeys = [
  "description",
  "alias",
  "updatedBy",
  "updatedAt",
] as const satisfies readonly EixoSortKey[];

export const eixoResource: AdminResourceDefinition<
  Eixo,
  EixoPayload,
  EixoFormValues,
  EixoSortKey
> = {
  key: "acoes-pngi.configuracoes.eixos",
  basePath: "/acoes-pngi/configuracoes/eixos",
  permissions: {
    view: PERMISSIONS.EIXO_VIEW,
    add: PERMISSIONS.EIXO_ADD,
    change: PERMISSIONS.EIXO_CHANGE,
  },
  api: eixoApi,
  getId: (eixo) => eixo.ideixo,
  sortKeys,
  defaultPreferences: {
    pageSize: 10,
    density: "compact",
    sorting: [{ key: "alias", direction: "asc" }],
  },
  columns: [
    {
      key: "description",
      label: "Descrição",
      sortKey: "description",
      className: "font-medium text-slate-900",
      render: (eixo) => eixo.strdescricaoeixo,
    },
    {
      key: "alias",
      label: "Sigla",
      sortKey: "alias",
      className: "text-slate-700",
      render: (eixo) => eixo.stralias,
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
      help: "Nome completo do eixo, com até 100 caracteres.",
      maxLength: 100,
      required: true,
      autoFocus: true,
      className: "space-y-2",
    },
    {
      name: "alias",
      label: "Sigla",
      help: "Identificação curta, com até 5 caracteres.",
      maxLength: 5,
      required: true,
      className: "max-w-xs space-y-2",
    },
  ],
  getInitialValues: (eixo) => ({
    description: eixo?.strdescricaoeixo ?? "",
    alias: eixo?.stralias ?? "",
  }),
  toPayload: (values) => ({
    strdescricaoeixo: values.description.trim(),
    stralias: values.alias.trim(),
  }),
  validate: (values) =>
    values.description.trim() && values.alias.trim()
      ? null
      : "Preencha a descrição e a sigla do eixo.",
  texts: {
    listTitle: "Eixos",
    listDescription: "Cadastre e mantenha os eixos temáticos do programa PNGI.",
    createAction: "Novo eixo",
    empty: "Nenhum eixo cadastrado.",
    listError: "Não foi possível carregar os eixos.",
    createTitle: "Novo eixo",
    createDescription: "Informe os dados do novo eixo temático.",
    createError: "Não foi possível criar o eixo.",
    editTitle: "Editar eixo",
    editDescription: (eixo) => `Altere os dados do eixo ${eixo.stralias}.`,
    editError: "Não foi possível atualizar o eixo.",
    notFound: "Eixo não encontrado.",
    loading: "Carregando eixo...",
  },
};
