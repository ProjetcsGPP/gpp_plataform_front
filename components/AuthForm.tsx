"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "../services/api";

export default function AuthForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Faz login via JWT
      const authData = await authService.login(email, password);

      // Extrai informações do JWT (decode básico - não valida assinatura)
      const payload = JSON.parse(atob(authData.access.split(".")[1]));

      const user = {
        id: payload.user_id,
        name: payload.username,
        email: payload.useremail,
      };

      // Salva tokens e dados do usuário
      authService.saveAuth(authData, user);

      // Redireciona para dashboard
      router.push("/dashboard");
    } catch (err: any) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Credenciais inválidas";
      setError(message);
      console.error("Erro no login:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 420, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 12 }}>Entrar</h2>

      <label style={{ display: "block", marginBottom: 8 }}>
        <div style={{ fontSize: 13 }}>Email</div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", padding: 8, marginTop: 6 }}
        />
      </label>

      <label style={{ display: "block", marginBottom: 12 }}>
        <div style={{ fontSize: 13 }}>Senha</div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "100%", padding: 8, marginTop: 6 }}
        />
      </label>

      {error && (
        <div style={{ color: "crimson", marginBottom: 12, fontSize: 14 }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          padding: "10px 14px",
          background: loading ? "#ccc" : "#0b63ff",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
