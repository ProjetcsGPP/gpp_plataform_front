// src/hooks/useNavigation.ts
"use client";

import { useEffect } from "react";
import useSWR from "swr";

import { useNavigationStore } from "@/store/navigationStore";
import { usePermissionsStore } from "@/store/permissionsStore";
import { resolveNavigation } from "@/lib/resolveNavigation";
import type { AppContext } from "@/types/auth";
import type { NavManifestFile } from "@/types/navigation";
import { useAuthStore } from "@/store/authStore";

const APP_NAV_MAP: Record<AppContext, string> = {
  ACOES_PNGI: "/nav/ACOES_PNGI.json",
  PORTAL: "/nav/PORTAL.json",
  CARGA_ORG_LOT: "/nav/CARGA_ORG_LOT.json",
};

const fetcher = (url: string): Promise<NavManifestFile> =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`Manifest não encontrado: ${url}`);
    return r.json();
  });

export function useNavigation() {
  const appContext      = useAuthStore((s) => s.appContext);
  const manifestVersion = useNavigationStore((s) => s.manifestVersion);
  const setNavigation   = useNavigationStore((s) => s.setNavigation);
  const setLoading      = useNavigationStore((s) => s.setLoading);

  // ── Lê permissões de permissionsByApp[appContext] ─────────────────────────
  // permissionsByApp é populado por setPermissionsForApp independentemente
  // do timing do appContext no closure do onSuccess.
  // FIX: não depende mais de permLoading para resolver os itens — se
  // permissionsByApp[appContext] já está populado, resolve imediatamente.
  // permLoading só bloqueia quando os dados ainda não chegaram de fato.
  const permissionsByApp = usePermissionsStore((s) => s.permissionsByApp);
  const permLoading      = usePermissionsStore((s) => s.isLoading);

  const currentAppPerms = appContext ? (permissionsByApp[appContext] ?? null) : null;
  const granted = currentAppPerms?.granted ?? [];
  const role    = currentAppPerms?.role    ?? null;

  // Os dados de permissão estão prontos quando:
  //   (a) o slice do appContext atual já foi populado em permissionsByApp, OU
  //   (b) permLoading é false (hidratação concluída pelo caminho legado)
  const permsReady = currentAppPerms !== null || !permLoading;

  const manifestUrl = appContext ? APP_NAV_MAP[appContext] : null;

  const { data: manifest, isLoading: manifestLoading } =
    useSWR<NavManifestFile>(
      manifestUrl ? [manifestUrl, manifestVersion] : null,
      ([url]) => fetcher(url as string),
      { revalidateOnFocus: false },
    );

  useEffect(() => {
    if (!appContext) {
      setLoading(false);
      setNavigation("", []);
      return;
    }

    // FIX: loading da navegação depende do manifest E de permsReady,
    // não mais de permLoading diretamente.
    // Isso evita que um isLoading=true travado no store bloqueie o menu
    // quando permissionsByApp[appContext] já está disponível.
    const loading = manifestLoading || !permsReady;
    setLoading(loading);

    if (loading || !manifest) return;

    const resolved = resolveNavigation(manifest.items, granted, appContext);
    setNavigation(role ?? "", resolved);
  }, [
    appContext,
    manifest,
    manifestLoading,
    granted,
    role,
    permsReady,
    setNavigation,
    setLoading,
  ]);
}
