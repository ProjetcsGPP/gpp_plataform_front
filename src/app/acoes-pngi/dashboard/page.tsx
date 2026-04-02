"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logoutApp } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";

export default function AcoesPngiDashboard() {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-app-gradient gap-4">
      <h1 className="text-2xl font-bold text-[#1B3A6B]">Ações PNGI</h1>
      <p className="text-slate-500">Dashboard em construção</p>
      <Button
        variant="outline"
        onClick={async () => {
          await logoutApp('ACOES_PNGI');
          clearAuth();
          router.push("/acoes-pngi/login");
        }}
      >
        Sair
      </Button>
    </div>
  );
}
