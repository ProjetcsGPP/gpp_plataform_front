// src/hooks/useNavigation.ts
"use client";

import { useEffect } from "react";
import useSWR from "swr";

import { useNavigationStore } from "@/store/navigationStore";
import { usePermissionsStore } from "@/store/permissionsStore";
import { adaptNavigationMenus } from "@/lib/adaptNavigationMenus";
import {
  getNavigationFallback,
  resolveNavigation,
} from "@/lib/resolveNavigation";
import { useNavigationMenus } from "@/hooks/useNavigationMenus";
import type { AppContext } from "@/types/auth";
import type { NavManifestFile } from "@/types/navigation";
import { useAuthStore } from "@/store/authStore";

const APP_NAV_MAP: Record<AppContext, string> = {
  ACOES_PNGI: "/nav/ACOES_PNGI.json",
  PORTAL: "/nav/PORTAL.json",
  CARGA_ORG_LOT: "/nav/CARGA_ORG_LOT.json",
};

const EMPTY_GRANTED: string[] = [];

const fetcher = (url: string): Promise<NavManifestFile> =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`Manifest não encontrado: ${url}`);
    return r.json();
  });

export function useNavigation() {
  const appContext      = useAuthStore((s) => s.appContext);
  const manifestVersion = useNavigationStore((s) => s.manifestVersion);
  const setNavigation   = useNavigationStore((s) => s.setNavigation);
  const beginLoading    = useNavigationStore((s) => s.beginLoading);
  const clearNavigation = useNavigationStore((s) => s.clearNavigation);

  // ── Lê permissões de permissionsByApp[appContext] ─────────────────────────
  // permissionsByApp é populado por setPermissionsForApp independentemente
  // do timing do appContext no closure do onSuccess.
  // FIX: não depende mais de permLoading para resolver os itens — se
  // permissionsByApp[appContext] já está populado, resolve imediatamente.
  // permLoading só bloqueia quando os dados ainda não chegaram de fato.
  const permissionsByApp = usePermissionsStore((s) => s.permissionsByApp);
  const permLoading      = usePermissionsStore((s) => s.isLoading);

  const currentAppPerms = appContext ? (permissionsByApp[appContext] ?? null) : null;
  const granted = currentAppPerms?.granted ?? EMPTY_GRANTED;
  const role    = currentAppPerms?.role    ?? null;

  // Os dados de permissão estão prontos quando:
  //   (a) o slice do appContext atual já foi populado em permissionsByApp, OU
  //   (b) permLoading é false (hidratação concluída pelo caminho legado)
  const permsReady = currentAppPerms !== null || !permLoading;

  const manifestUrl = appContext ? APP_NAV_MAP[appContext] : null;

  const {
    data: apiMenus,
    error: apiError,
    isLoading: apiLoading,
  } = useNavigationMenus(appContext, manifestVersion);

  const {
    data: manifest,
    error: manifestError,
    isLoading: manifestLoading,
  } =
    useSWR<NavManifestFile>(
      manifestUrl ? [manifestUrl, manifestVersion] : null,
      ([url]) => fetcher(url as string),
      { revalidateOnFocus: false },
    );

  useEffect(() => {
    if (!appContext) {
      clearNavigation();
      return;
    }

    // Limpa o conteúdo lógico da aplicação anterior assim que o contexto/chave
    // muda. A Sidebar também valida o contexto do store durante a renderização.
    beginLoading(appContext);
  }, [appContext, manifestVersion, beginLoading, clearNavigation]);

  useEffect(() => {
    if (!appContext) return;

    const apiPending = apiLoading && !apiMenus && !apiError;
    if (!permsReady || manifestLoading || apiPending) return;

    // Sem manifest não há como preservar a autorização técnica nem oferecer
    // o fallback de migração. Falha fechada: nenhum item é publicado.
    if (!manifest || manifestError) {
      setNavigation(appContext, role ?? "", []);
      return;
    }

    const responseMatchesContext = apiMenus?.app_context === appContext;
    const sourceItems =
      apiMenus && responseMatchesContext
        ? adaptNavigationMenus(apiMenus, manifest.items)
        : getNavigationFallback(manifest.items);

    const resolved = resolveNavigation(sourceItems, granted, appContext);
    setNavigation(appContext, role ?? "", resolved);
  }, [
    appContext,
    apiMenus,
    apiError,
    apiLoading,
    manifest,
    manifestError,
    manifestLoading,
    granted,
    role,
    permsReady,
    setNavigation,
  ]);
}
