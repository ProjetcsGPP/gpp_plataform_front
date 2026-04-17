// src/app/portal/dashboard/page.tsx
// Migrado para usePortalDashboard (portal_dashboard_retrieve)
// conforme frontend-ai-contract.md — GET /api/portal/dashboard/
// retorna { aplicacoes, roles } em uma única chamada autenticada.
"use client";

import { useRouter } from "next/navigation";
import { logoutApp, switchApp } from "@/lib/auth";
import { usePortalDashboard } from "@/hooks/usePortalDashboard";
import { useAuthStore } from "@/store/authStore";
import type { PortalAplicacao } from "@/hooks/usePortalDashboard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Loader2, LayoutGrid, RefreshCw } from "lucide-react";
import { logError } from "@/lib/logger";
import { useState } from "react";

export default function PortalDashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [switching, setSwitching] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // portal_dashboard_retrieve: retorna aplicacoes + roles em uma chamada
  const { aplicacoes, roles, isLoading, refresh } = usePortalDashboard();

  // Aguarda store hidratar (useMe no AppThemeProvider) e dados do dashboard
  if (!user || isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B3A6B]" />
      </div>
    );
  }

  // Filtra apps visíveis no portal que o usuário tem role
  const roleCodigos = new Set(roles.map((r) => r.aplicacao_codigo));
  const appList = aplicacoes.filter(
    (a) => roleCodigos.has(a.codigointerno) && a.isshowinportal,
  );

  async function handleLogout() {
    try {
      await logoutApp("PORTAL");
    } catch (err) {
      await logError(err, "portal/dashboard/logout");
    }
    clearAuth();
    router.push("/portal/login");
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await refresh();
    } catch (err) {
      await logError(err, "portal/dashboard/refresh");
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleAppClick(app: PortalAplicacao) {
    if (app.codigointerno === '') return;
    setSwitching(app.codigointerno);
    try {
      await switchApp(
        app.codigointerno as "PORTAL" | "ACOES_PNGI" | "CARGA_ORG_LOT",
      );
      if (app.codigointerno === "ACOES_PNGI")
        router.push("/acoes-pngi/dashboard");
      else if (app.codigointerno === "CARGA_ORG_LOT")
        router.push("/carga-org-lot/dashboard");
    } catch (err) {
      await logError(err, "portal/dashboard/switchApp");
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
            <h2 className="text-xl font-bold text-slate-800">
              Suas Aplicações
            </h2>
            <Badge
              variant="secondary"
              className="ml-1 text-xs bg-app-gradient text-slate-600"
            >
              {appList.length}{" "}
              {appList.length === 1
                ? "aplicação disponível"
                : "aplicações disponíveis"}
            </Badge>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
            <span className="font-medium text-slate-700">
              {user.name || user.username}
            </span>
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
            disabled={isRefreshing || isLoading}
            className="gap-2 text-slate-600 hover:text-[#1B3A6B]"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estado vazio */}
      {appList.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <LayoutGrid className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-sm">Nenhuma aplicação disponível para o seu perfil.</p>
        </div>
      )}

      {/* Grid de cards */}
      {appList.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {appList.map((app) => (
            <Card
              key={app.codigointerno}
              className="cursor-pointer hover:shadow-md transition-shadow rounded-xl border border-slate-200"
              onClick={() => handleAppClick(app)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-slate-800">
                  {app.nomeaplicacao}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  {app.codigointerno}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {switching === app.codigointerno ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Acessando...
                  </div>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Acessar
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
