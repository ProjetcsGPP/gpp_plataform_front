"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth";

export default function CargaOrgLotDashboard() {
  const router = useRouter();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-app-gradient gap-4">
      <h1 className="text-2xl font-bold text-[#1B3A6B]">Carga Org/Lot</h1>
      <p className="text-slate-500">Dashboard em construção</p>
      <Button variant="outline" onClick={async () => { await logout(); router.push("/portal/login"); }}>
        Sair
      </Button>
    </div>
  );
}
