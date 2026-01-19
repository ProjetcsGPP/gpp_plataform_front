import React from "react";
import DashboardNav from "../../../components/DashboardNav";

export const metadata = {
  title: "Ações PNGI - Dashboard",
};

export default function AcoesPngiPage() {
  return (
    <main style={{ padding: 24 }}>
      <section style={{ maxWidth: 1100, margin: "24px auto" }}>
        <header>
          <h1>Ações PNGI</h1>
          <p>Painel de ações relacionadas ao PNGI</p>
        </header>

        <DashboardNav />

        <div style={{ marginTop: 16 }}>
          <p>
            Integre aqui os endpoints do backend (por exemplo: GET/POST
            /api/acoes_pngi, etc.) e insira componentes para exibir e gerenciar
            as ações.
          </p>
        </div>
      </section>
    </main>
  );
}
