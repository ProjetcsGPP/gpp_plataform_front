"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, logout, switchApp } from "@/lib/auth";
import { useAplicacoes } from '@/hooks/useAplicacoes';
import type { MeResponse, UserRole, Aplicacao } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Loader2, LayoutGrid, RefreshCw, PackageOpen } from "lucide-react";
import { logError } from '@/lib/logger';

export default function PortalDashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // SWR: auto-refresh + cache inteligente (não precisa de useEffect para apps)
  // useEffect → roda 1x quando o componente monta
  // SWR      → busca, cacheia e re-valida automaticamente a cada 2 min ou ao focar a aba
  const { apps, isLoading: appsLoading, refresh } = useAplicacoes();

  // Carrega dados do usuário 1x ao montar
  useEffect(() => {
    getMe()
      .then((meData) => {
        setMe(meData);
      })
      .catch(async (err) => {
        await logError(err, 'portal/dashboard/getMe');
        router.push("/portal/login");
      })
      .finally(() => setLoadingMe(false));
  }, [router]);

  // Loading global: aguarda tanto o usuário quanto as aplicações
  if (!me || loadingMe || appsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B3A6B]" />
      </div>
    );
  }

  // Filtra aplicações pelo role do usuário e flag isshowinportal
  const roles = me.roles ?? [];
  const roleCodigos = new Set(roles.map((r: UserRole) => r.aplicacao_codigo));
  const appList = apps.filter(
    (a) => roleCodigos.has(a.codigointerno) && a.isshowinportal
  );

  async function handleLogout() {
    try {
      await logout();
    } catch (err) {
      await logError(err, 'portal/dashboard/logout');
    }
    router.push("/portal/login");
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await refresh();
    } catch (err) {
      await logError(err, 'portal/dashboard/refresh');
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleAppClick(app: Aplicacao) {
    // Validação explícita: não prossegue se a aplicação estiver bloqueada
    if (app.isappbloqueada) {
      await logError(
        new Error(`Tentativa de acesso a aplicação bloqueada: ${app.codigointerno}`),
        'portal/dashboard/click-bloqueado'
      );
      return;
    }

    setSwitching(app.codigointerno);
    try {
      await switchApp(app.codigointerno as "PORTAL" | "ACOES_PNGI" | "CARGA_ORG_LOT");
      if (app.codigointerno === "ACOES_PNGI") router.push("/acoes-pngi/dashboard");
      else if (app.codigointerno === "CARGA_ORG_LOT") router.push("/carga-org-lot/dashboard");
    } catch (err) {
      await logError(err, 'portal/dashboard/switchApp');
      setSwitching(null);
    }
  }
    
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">

      {/* Cabeçalho da seção */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-[#1B3A6B]" />
            <h2 className="text-xl font-bold text-slate-800">Suas Aplicações</h2>
            <Badge variant="secondary" className="ml-1 text-xs bg-slate-200 text-slate-600">
              {appList.length}{' '}
              {appList.length === 1 ? 'aplicação disponível' : 'aplicações disponíveis'}
            </Badge>
          </div>
          {/* Informações do usuário movidas para cá (antes estavam no header duplicado) */}
          <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
            <span className="font-medium text-slate-700">{me?.name || me?.username}</span>
            {me?.is_portal_admin && (
              <Badge className="bg-amber-400 text-amber-900 text-xs">Admin</Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-1 text-slate-500 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" /> Sair
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || appsLoading}
            className="gap-2 text-slate-600 hover:text-[#1B3A6B]"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* ... restante do JSX (estado vazio + grid de cards) permanece igual ... */}
    </div>
  )
}
