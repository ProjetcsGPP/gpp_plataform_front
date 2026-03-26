"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getAplicacoesPublicas, login } from "@/lib/auth";
import type { AplicacaoPublica } from "@/lib/auth";
import { Loader2, LogIn } from "lucide-react";

export default function PortalLoginPage() {
  const router = useRouter();
  const [apps, setApps] = useState<AplicacaoPublica[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [appContext, setAppContext] = useState("PORTAL");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Busca aplicações públicas (sem autenticação) para popular o seletor
    // A chamada a getAplicacoesPublicas já faz o GET ao backend e obtém o cookie csrftoken
    getAplicacoesPublicas()
      .then((data) => setApps(data))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password, appContext as "PORTAL" | "ACOES_PNGI" | "CARGA_ORG_LOT");
      if (appContext === "PORTAL") router.push("/portal/dashboard");
      else if (appContext === "ACOES_PNGI") router.push("/acoes-pngi/dashboard");
      else if (appContext === "CARGA_ORG_LOT") router.push("/carga-org-lot/dashboard");
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { detail?: string; code?: string } } };
      const status = e.response?.status;
      const detail = e.response?.data?.detail;
      const code = e.response?.data?.code;
      console.error("Login error:", status, code, detail);
      if (status === 401) setError("Usuário ou senha incorretos.");
      else if (status === 403) setError(detail ?? "Sem permissão para esta aplicação.");
      else if (status === 400) setError(detail ?? "Preencha todos os campos.");
      else setError(detail ?? "Erro ao realizar login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1B3A6B]">
            <span className="text-2xl font-bold text-white">G</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">GPP Plataform 2.0</h1>
          <p className="text-sm text-slate-500">SEGER — Governo do Espírito Santo</p>
        </div>

        <Card className="shadow-md rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg text-slate-700">Acesso ao Sistema</CardTitle>
            <CardDescription>Informe suas credenciais e selecione a aplicação</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="username">Usuário ou E-mail</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="usuário ou e-mail"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="app">Aplicação</Label>
                <select
                  id="app"
                  value={appContext}
                  onChange={(e) => setAppContext(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
                >
                  <option value="PORTAL">Portal GPP</option>
                  {apps.map((app) => (
                    <option key={app.codigointerno} value={app.codigointerno}>
                      {app.nomeaplicacao}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1B3A6B] hover:bg-[#2563EB] text-white"
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando...</>
                ) : (
                  <><LogIn className="mr-2 h-4 w-4" /> Entrar</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400">
          GPP Plataform 2.0 © {new Date().getFullYear()} SEGER/ES
        </p>
      </div>
    </div>
  );
}
