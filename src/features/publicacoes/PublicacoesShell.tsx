"use client";

import { useCallback } from "react";
import { useSWRConfig } from "swr";

import AppShell from "@/components/layout/AppShell";
import { revalidateEdocsCaches } from "@/features/publicacoes/edocs/cache";
import { useEdocsRealtime } from "@/features/publicacoes/edocs/useEdocsRealtime";

export function PublicacoesShell({ children }: { children: React.ReactNode }) {
  const { mutate } = useSWRConfig();
  const revalidate = useCallback(() => {
    void revalidateEdocsCaches(mutate);
  }, [mutate]);

  useEdocsRealtime(revalidate);

  return (
    <AppShell
      appContext="PUB_INSTITUCIONAL"
      title="Publicações Institucionais"
      titleMinor="SEGER/SUBGES/GPP"
    >
      {children}
    </AppShell>
  );
}
