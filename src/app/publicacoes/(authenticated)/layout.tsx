import { PublicacoesShell } from "@/features/publicacoes/PublicacoesShell";

export default function PublicacoesAuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicacoesShell>{children}</PublicacoesShell>;
}
