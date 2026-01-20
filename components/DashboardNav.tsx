"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { authService } from "../services/api";

export default function DashboardNav() {
  const router = useRouter();

  const handleLogout = () => {
    authService.logout();
    router.push("/login");
  };

  const user = authService.getUser();

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 16px",
        background: "#f8f9fa",
        borderRadius: 8,
        marginBottom: 24,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <a href="/dashboard" style={{ fontWeight: 600, color: "#0b63ff" }}>
          Portal GPP
        </a>
        <span style={{ fontSize: 14, color: "#666" }}>
          {user?.name || "Usuário"}
        </span>
      </div>
      <button
        onClick={handleLogout}
        style={{
          padding: "6px 12px",
          background: "#dc3545",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
          fontSize: 14,
        }}
      >
        Sair
      </button>
    </nav>
  );
}
