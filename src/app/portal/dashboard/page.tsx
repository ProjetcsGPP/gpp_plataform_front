"use client";

import { useRouter } from "next/navigation";
import { logoutApp, switchApp } from "@/lib/auth";
import { useAplicacoes } from "@/hooks/useAplicacoes";
import { useAuthStore } from "@/store/authStore";
import type { Aplicacao } from "@/lib/auth";
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
  const user = useAuthStore((s) => s.user); // ← usa store, não getMe()
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [switching, setSwitching] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { apps, isLoading: appsLoading, refresh } = useAplicacoes();

  // Sem user ainda (store ainda hidratando) — loader mínimo, sem min-h-screen
  if (!user || appsLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B3A6B]" />
      </div>
    );
  }

  const roleCodigos = new Set(user.roles.map((r) => r.aplicacao_codigo));
  const appList = apps.filter(
    (a) => roleCodigos.has(a.codigointerno as any) && a.isshowinportal,
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

  async function handleAppClick(app: Aplicacao) {
    if (app.isappbloqueada) return;
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
            disabled={isRefreshing || appsLoading}
            className="gap-2 text-slate-600 hover:text-[#1B3A6B]"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
        </div>
      </div>

      {/* ... restante do JSX (estado vazio + grid de cards) permanece igual ... */}
    </div>
  );
}
