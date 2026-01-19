"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

type LoginResponse = {
  ok: boolean;
  token?: string;
  message?: string;
};

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
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data: LoginResponse = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.message || "Erro ao autenticar");
        setLoading(false);
        return;
      }

      // Se o backend retornar um token em JSON, você pode salvá-lo:
      // localStorage.setItem("token", data.token || "");
      // Redireciona para o dashboard
      router.push("/dashboard");
    } catch (err) {
      setError("Erro de rede");
      console.error(err);
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
        <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          padding: "10px 14px",
          background: "#0b63ff",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
