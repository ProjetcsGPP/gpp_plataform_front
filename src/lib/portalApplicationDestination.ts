import { APP_CONFIG, type AppContext } from "@/types/auth";

interface PortalApplicationDestination {
  codigointerno: string;
  base_url: string;
}

export function resolvePortalApplicationContext(
  applicationCode: string,
): AppContext | null {
  if (Object.prototype.hasOwnProperty.call(APP_CONFIG, applicationCode)) {
    return applicationCode as AppContext;
  }

  return null;
}

/**
 * Usa o caminho fornecido pelo backend sem navegar para a origem da API.
 * O caminho precisa pertencer ao AppContext informado pelo próprio DTO.
 */
export function resolvePortalApplicationDestination(
  application: PortalApplicationDestination,
  frontendOrigin: string,
): string | null {
  const appContext = resolvePortalApplicationContext(
    application.codigointerno,
  );
  const baseUrl = application.base_url.trim();

  if (!appContext || !baseUrl) return null;

  try {
    const target = new URL(baseUrl, frontendOrigin);
    if (target.protocol !== "http:" && target.protocol !== "https:") {
      return null;
    }

    const appRoot = `/${APP_CONFIG[appContext].slug}`;
    const belongsToApp =
      target.pathname === appRoot || target.pathname.startsWith(`${appRoot}/`);

    if (!belongsToApp) return null;

    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return null;
  }
}
