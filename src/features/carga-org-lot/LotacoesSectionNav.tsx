"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, BriefcaseBusiness, Files, Layers3, ListChecks, Users } from "lucide-react";

const entries = [
  { href: "/carga-org-lot/lotacoes", label: "Planilhas", icon: Files },
  { href: "/carga-org-lot/lotacoes/conjuntos", label: "Conjuntos", icon: Layers3 },
  { href: "/carga-org-lot/lotacoes/pendencias", label: "Pendências", icon: ListChecks },
  { href: "/carga-org-lot/lotacoes/vigentes", label: "Lotações vigentes", icon: Users },
  { href: "/carga-org-lot/lotacoes/descartados", label: "Descartados", icon: AlertTriangle },
  { href: "/carga-org-lot/cargos", label: "Cargos", icon: BriefcaseBusiness },
];

export function LotacoesSectionNav() {
  const pathname = usePathname() ?? "";
  return <nav aria-label="Áreas de lotação" className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">{entries.map(({ href, label, icon: Icon }) => { const active = href === "/carga-org-lot/lotacoes" ? pathname === href || pathname === `${href}/importar` : pathname.startsWith(href); return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-app-primary text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}><Icon className="size-4" />{label}</Link>; })}</nav>;
}
