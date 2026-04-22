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
  const appContext    = useAuthStore((s) => s.appContext);
  const manifestVersion = useNavigationStore((s) => s.manifestVersion);
  const setNavigation = useNavigationStore((s) => s.setNavigation);
  const setLoading    = useNavigationStore((s) => s.setLoading);

  // ── Lê permissões de permissionsByApp[appContext] ─────────────────────────
  // Motivo: o slice legado (granted/role planos) só é preenchido quando
  // appContext já está no closure do onSuccess de usePermissionsHydrator.
  // permissionsByApp é sempre populado por setPermissionsForApp
  // independentemente do timing do appContext.
  const permissionsByApp = usePermissionsStore((s) => s.permissionsByApp);
  const permLoading      = usePermissionsStore((s) => s.isLoading);

  const currentAppPerms = appContext ? (permissionsByApp[appContext] ?? null) : null;
  const granted = currentAppPerms?.granted ?? [];
  const role    = currentAppPerms?.role    ?? null;

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

    const loading = manifestLoading || permLoading;
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
    permLoading,
    setNavigation,
    setLoading,
  ]);
}
