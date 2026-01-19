"use client";
import React from "react";
import Link from "next/link";

export default function DashboardNav() {
  return (
    <nav style={{ marginBottom: 20 }}>
      <Link href="/dashboard" style={{ marginRight: 12 }}>
        Início
      </Link>
      <Link href="/dashboard/carga_org_lot" style={{ marginRight: 12 }}>
        Carga Org Lot
      </Link>
      <Link href="/dashboard/acoes_pngi" style={{ marginRight: 12 }}>
        Ações PNGI
      </Link>
      <Link href="/logout" style={{ marginLeft: 24, color: "crimson" }}>
        Sair
      </Link>
    </nav>
  );
}
