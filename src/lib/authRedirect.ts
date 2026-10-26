import { APP_CONFIG, type AppContext } from "@/types/auth";

export function resolvePostLoginRedirect(
  candidate: string | undefined,
  appContext: AppContext,
  fallback: string,
): string {
  if (!candidate || typeof window === "undefined") return fallback;
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return fallback;
  if (candidate.includes("\\")) return fallback;

  try {
    const target = new URL(candidate, window.location.origin);
    const appRoot = `/${APP_CONFIG[appContext].slug}`;
    const belongsToApp =
      target.pathname === appRoot || target.pathname.startsWith(`${appRoot}/`);
    const isLogin = target.pathname === APP_CONFIG[appContext].loginPath;

    if (target.origin !== window.location.origin || !belongsToApp || isLogin) {
      return fallback;
    }

    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return fallback;
  }
}
