import type { Metadata } from "next";
import React from "react";
import DashboardNav from "../../../components/DashboardNav";

export const metadata: Metadata = {
  title: "Carga Org Lot - Dashboard",
};

export default function CargaOrgLotPage() {
  return (
    <main style={{ padding: 24 }}>
      <section style={{ maxWidth: 1100, margin: "24px auto" }}>
        <header>
          <h1>Carga Org Lot</h1>
          <p>Página de carga/visualização de lotes</p>
        </header>

        <DashboardNav />

        <div style={{ marginTop: 16 }}>
          <p>
            Aqui você deve integrar a listagem e os endpoints do backend que
            retornam os lotes (ex.: GET /api/carga_org_lot).
          </p>

          <div
            style={{
              marginTop: 12,
              padding: 12,
              border: "1px dashed #ddd",
              borderRadius: 8,
            }}
          >
            <em>
              Componente de listagem / upload ainda precisa ser implementado.
            </em>
          </div>
        </div>
      </section>
    </main>
  );
}
