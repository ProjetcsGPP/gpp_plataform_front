"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardNav from "../../components/DashboardNav";
import { authService, portalService, Application } from "../../services/api";

export default function DashboardPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verifica autenticação
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }

    // Carrega aplicações
    loadApplications();
  }, [router]);

  async function loadApplications() {
    try {
      setLoading(true);
      const apps = await portalService.getApplications();
      setApplications(apps);
    } catch (err: any) {
      console.error("Erro ao carregar aplicações:", err);
      setError("Erro ao carregar aplicações");
    } finally {
      setLoading(false);
    }
  }

  const user = authService.getUser();

  return (
    <main style={{ padding: 24 }}>
      <section style={{ maxWidth: 1100, margin: "24px auto" }}>
        <DashboardNav />

        <header style={{ marginBottom: 20 }}>
          <h1>Dashboard</h1>
          <p>Bem-vindo, {user?.name}! Escolha uma aplicação para acessar.</p>
        </header>

        {loading && (
          <div style={{ textAlign: "center", padding: 40 }}>
            Carregando aplicações...
          </div>
        )}

        {error && (
          <div
            style={{
              padding: 16,
              background: "#fff3cd",
              border: "1px solid #ffc107",
              borderRadius: 8,
              color: "#856404",
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && applications.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: 40,
              background: "#f8f9fa",
              borderRadius: 8,
            }}
          >
            <p>Você não tem acesso a nenhuma aplicação.</p>
            <p style={{ fontSize: 14, color: "#666", marginTop: 8 }}>
              Entre em contato com o administrador para solicitar permissões.
            </p>
          </div>
        )}

        {!loading && !error && applications.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {applications.map((app) => (
              <article
                key={app.id}
                style={{
                  padding: 20,
                  borderRadius: 8,
                  border: "1px solid #e0e0e0",
                  background: "#fff",
                  transition: "all 0.2s",
                  cursor: "pointer",
                }}
                onClick={() => {
                  if (app.url) {
                    window.location.href = app.url;
                  }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(0,0,0,0.1)";
                  e.currentTarget.style.borderColor = "#0b63ff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "#e0e0e0";
                }}
              >
                <h3 style={{ marginBottom: 8, color: "#0b63ff" }}>
                  {app.nome}
                </h3>
                <p style={{ fontSize: 14, color: "#666", marginBottom: 12 }}>
                  Código: {app.codigo}
                </p>
                {app.url && (
                  <div
                    style={{
                      fontSize: 13,
                      color: "#0b63ff",
                      fontWeight: 500,
                    }}
                  >
                    Acessar →
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
