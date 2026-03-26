"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, getAplicacoes, logout, switchApp } from "@/lib/auth";
import { useAplicacoes } from '@/hooks/useAplicacoes';
import type { MeResponse, UserRole, Aplicacao } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Loader2, LayoutGrid } from "lucide-react";
import { logError } from '@/lib/logger';

export default function PortalDashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);  
  const [appList, setAppList] = useState<Aplicacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);
  const { apps, isLoading, refresh } = useAplicacoes();

  // Auto-refresh button
  const handleRefresh = () => refresh();
  
  useEffect(() => {
    // Ambas as chamadas exigem sessão autenticada.
    // getAplicacoes() retorna apenas as aplicações às quais o usuário tem acesso via roles (filtrado no backend).
    // getMe() retorna os dados do usuário incluindo user_roles para exibição de informações de perfil.
    Promise.all([getMe(), getAplicacoes()])
      .then(([meData, appsData]) => {              
        setMe(meData);
        // O backend já filtra as aplicações pelo role do usuário autenticado.
        // Caso o backend não filtre, é possível aplicar filtro local:

        const roles = meData.roles ?? [];
        const roleCodigos = new Set(roles.map((r: UserRole) => r.aplicacao_codigo));
        const appsDataFiltered = appsData.filter(
                                                  (a) => roleCodigos.has(a.codigointerno) && a.isshowinportal
                                                );
        setAppList(appsDataFiltered);
      })
      .catch(async (err) => {
          await logError(err, 'portal/dashboard/load');
          router.push("/portal/login");
        })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    await logout();
    router.push("/portal/login");
  }

  async function handleAppClick(app: Aplicacao) {
    setSwitching(app.codigointerno);
    try {
      await switchApp(app.codigointerno as "PORTAL" | "ACOES_PNGI" | "CARGA_ORG_LOT");
      if (app.codigointerno === "ACOES_PNGI") router.push("/acoes-pngi/dashboard");
      else if (app.codigointerno === "CARGA_ORG_LOT") router.push("/carga-org-lot/dashboard");
    } catch {
      setSwitching(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B3A6B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">

      {/* Topbar */}
      <header className="bg-[#1B3A6B] text-white shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
              <span className="text-lg font-bold">G</span>
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">GPP Plataform 2.0</p>
              <p className="text-xs text-white/60">Portal de Aplicações</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{me?.name || me?.username}</p>
              <p className="text-xs text-white/60">{me?.orgao || "SEGER/ES"}</p>
            </div>
            {me?.is_portal_admin && (
              <Badge className="bg-amber-400 text-amber-900 text-xs">Admin</Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white hover:bg-white/10"
            >
              <LogOut className="mr-1 h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-[#1B3A6B]" />
          <h2 className="text-xl font-bold text-slate-800">Suas Aplicações</h2>
        </div>

        {appList.map((app) => {
          const isBlocked = app.isappbloqueada;  // ← seu campo
          
          return (
            <Card
              key={app.codigointerno}
              className={`rounded-2xl shadow-sm transition-all duration-200 ${
                isBlocked
                  ? 'opacity-60 cursor-not-allowed border-2 border-orange-300 hover:shadow-md'
                  : 'cursor-pointer hover:shadow-lg hover:-translate-y-1'
              }`}
              onClick={isBlocked ? undefined : () => handleAppClick(app)}
            >
              <CardHeader>
                {/* Ícone com cor condicional */}
                <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${
                  isBlocked ? 'bg-orange-100 border-2 border-orange-300' : 'bg-gradient-to-br from-[#1B3A6B] to-blue-600'
                }`}>
                  <span className={`text-2xl font-bold ${
                    isBlocked ? 'text-orange-600' : 'text-white'
                  }`}>
                    {app.nomeaplicacao.charAt(0).toUpperCase()}
                  </span>
                </div>
                
                <CardTitle className="text-lg font-semibold text-slate-800 line-clamp-1">
                  {app.nomeaplicacao}
                </CardTitle>
                <CardDescription className="flex items-center gap-1 text-xs font-medium text-slate-500">
                  {app.codigointerno}
                  {app.isappproductionready && (
                    <Badge variant="secondary" className="ml-1 text-xs bg-green-100 text-green-800 border-green-200">
                      Production Ready
                    </Badge>
                  )}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                {isBlocked ? (
                  /* 🟡 APP BLOQUEADA */
                  <div className="flex items-center justify-center gap-2 p-3 bg-orange-50 rounded-xl border border-orange-200">
                    <div className="p-1 bg-orange-200 rounded-full">
                      <svg className="h-4 w-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-orange-800">Aplicação Bloqueada</span>
                  </div>
                ) : switching === app.codigointerno ? (
                  /* ⏳ CARREGANDO */
                  <div className="flex items-center justify-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-800">Acessando...</span>
                  </div>
                ) : (
                  /* 🟢 ATIVA */
                  <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium shadow-lg">
                    Ativa
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}


      </main>
    </div>
  );
}
