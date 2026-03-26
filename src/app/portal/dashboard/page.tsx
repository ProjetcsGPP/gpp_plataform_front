"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, getAplicacoes, logout, switchApp } from "@/lib/auth";
import type { MeResponse, Aplicacao } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Loader2, LayoutGrid } from "lucide-react";

export default function PortalDashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [apps, setApps] = useState<Aplicacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);

  useEffect(() => {
    // Ambas as chamadas exigem sessão autenticada.
    // getAplicacoes() retorna apenas as aplicações às quais o usuário tem acesso via roles (filtrado no backend).
    // getMe() retorna os dados do usuário incluindo user_roles para exibição de informações de perfil.
    Promise.all([getMe(), getAplicacoes()])
      .then(([meData, appsData]) => {
        setMe(meData);
        // O backend já filtra as aplicações pelo role do usuário autenticado.
        // Caso o backend não filtre, é possível aplicar filtro local:
        //setApps(appsData);

        const roleCodigos = new Set(meData.user_roles.map((r) => r.aplicacao_codigo));
        const appsDataFiltered = appsData.filter(
                                                  (a) => roleCodigos.has(a.codigointerno) && a.isshowinportal
                                                );
        setApps(appsDataFiltered);
      })
      .catch(() => router.push("/portal/login"))
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

        {apps.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-slate-500">Nenhuma aplicação disponível para o seu perfil.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {apps.map((app) => (
              <Card
                key={app.codigointerno}
                className="cursor-pointer rounded-2xl shadow-sm transition hover:shadow-md hover:-translate-y-0.5"
                onClick={() => handleAppClick(app)}
              >
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1B3A6B]/10">
                    <span className="text-xl font-bold text-[#1B3A6B]">
                      {app.nomeaplicacao.charAt(0)}
                    </span>
                  </div>
                  <CardTitle className="text-base text-slate-800">{app.nomeaplicacao}</CardTitle>
                  <CardDescription className="text-xs">{app.codigointerno}</CardDescription>
                </CardHeader>
                <CardContent>
                  {switching === app.codigointerno ? (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" /> Acessando...
                    </div>
                  ) : (
                    <Badge className="bg-emerald-100 text-emerald-700 text-xs">Ativo</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
