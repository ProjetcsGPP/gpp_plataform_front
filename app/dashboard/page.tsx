import React from "react";
import DashboardNav from "../../components/DashboardNav";

export const metadata = {
  title: "Dashboard - GPP Plataforma",
};

export default function DashboardPage() {
  return (
    <main style={{ padding: 24 }}>
      <section style={{ maxWidth: 1100, margin: "24px auto" }}>
        <header style={{ marginBottom: 20 }}>
          <h1>Dashboard</h1>
          <p>Visão geral do portal</p>
        </header>

        <DashboardNav />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          <article
            style={{
              padding: 12,
              borderRadius: 8,
              border: "1px solid #eee",
            }}
          >
            <h3>Carga Org Lot</h3>
            <p>Gerencie e visualize os lotes de carga.</p>
            <a href="/dashboard/carga_org_lot">Acessar</a>
          </article>

          <article
            style={{
              padding: 12,
              borderRadius: 8,
              border: "1px solid #eee",
            }}
          >
            <h3>Ações PNGI</h3>
            <p>Painel de ações relacionadas ao PNGI.</p>
            <a href="/dashboard/acoes_pngi">Acessar</a>
          </article>
        </div>
      </section>
    </main>
  );
}
