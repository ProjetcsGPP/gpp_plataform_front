import { LoginPage, type LoginTheme } from "@/components/auth/LoginPage";

const publicacoesTheme: LoginTheme = {
  appName: "Publicações Institucionais",
  subtitle: "SEGER — Governo do Espírito Santo",
  logoSymbol: "library_books",
  logoProdestSymbol: "pro-society",
  defaultAppContext: "PUB_INSTITUCIONAL",
  redirectMap: {
    PUB_INSTITUCIONAL: "/publicacoes",
  },
};

interface PublicacoesLoginPageProps {
  searchParams: Promise<{ reason?: string; redirect?: string }>;
}

export default async function PublicacoesLoginPage({
  searchParams,
}: PublicacoesLoginPageProps) {
  const params = await searchParams;
  const sessionExpired = params.reason === "session_expired";

  return (
    <LoginPage
      theme={publicacoesTheme}
      redirectTo={params.redirect}
      sessionExpiredMessage={
        sessionExpired ? "Sua sessão expirou. Faça login novamente." : undefined
      }
    />
  );
}
