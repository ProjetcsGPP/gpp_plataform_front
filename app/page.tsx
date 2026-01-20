"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "../services/api";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Se já está logado, vai para dashboard
    if (authService.isAuthenticated()) {
      router.push("/dashboard");
    } else {
      // Se não está logado, vai para login
      router.push("/login");
    }
  }, [router]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div style={{ fontSize: 24, fontWeight: 600, color: "#0b63ff" }}>
        Portal GPP
      </div>
      <div style={{ fontSize: 14, color: "#666" }}>Carregando...</div>
    </div>
  );
}
