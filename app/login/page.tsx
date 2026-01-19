import type { Metadata } from "next";
import React from "react";
import AuthForm from "../../components/AuthForm";

export const metadata: Metadata = {
  title: "Login - GPP Plataforma",
};

export default function LoginPage() {
  return (
    <main style={{ padding: 24 }}>
      <section style={{ maxWidth: 920, margin: "24px auto" }}>
        <div
          style={{
            display: "flex",
            gap: 24,
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 320 }}>
            <h1>Bem‑vindo ao Portal GPP</h1>
            <p>Faça login para acessar o painel e as funcionalidades.</p>
            <AuthForm />
          </div>

          <div style={{ width: 300, minWidth: 240 }}>
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                background: "#f6f8fb",
              }}
            >
              <h3>Informações</h3>
              <p style={{ fontSize: 14 }}>
                Use credenciais válidas ou integre o endpoint /api/auth/login ao
                seu backend.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
