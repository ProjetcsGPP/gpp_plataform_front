// src/lib/api.ts
import axios from "axios";
import { APP_CONFIG } from "@/types/auth";
import { useAuthStore } from "@/store/authStore";
import { debugError, debugLog } from "@/lib/debug";
import { useNetworkActivityStore } from "@/store/networkActivityStore";
import type {
  Capability,
  NavigationMenusResponse,
} from "@/types/navigation";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
export const CSRF_BOOTSTRAP_URL = "/accounts/auth/csrf/";
let csrfBootstrap: Promise<string> | null = null;

export function readCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const value = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("csrftoken="))
    ?.split("=")
    .slice(1)
    .join("=");

  return value ? decodeURIComponent(value) : null;
}

export function isAuthenticatedSessionFailure(
  status: number | undefined,
  authMode: "public" | "authenticated" | undefined,
): boolean {
  return status === 401 && authMode !== "public";
}

export async function ensureCsrfCookie(): Promise<string> {
  const existing = readCsrfToken();
  if (existing) return existing;

  csrfBootstrap ??= api
    .get(CSRF_BOOTSTRAP_URL, { gppAuthMode: "public" })
    .then(() => {
      const token = readCsrfToken();
      if (!token) throw new Error("CSRF bootstrap did not provide a token");
      return token;
    })
    .finally(() => {
      csrfBootstrap = null;
    });

  return csrfBootstrap;
}

function diagnosticResponseData(data: unknown): unknown {
  if (!data || typeof data !== "object" || Array.isArray(data)) return data;
  const payload = data as Record<string, unknown>;
  const errors = payload.errors;
  if (!errors || typeof errors !== "object" || Array.isArray(errors)) {
    return data;
  }
  const record = errors as Record<string, unknown>;
  if (
    typeof record.code !== "string"
    || !record.code.startsWith("envio_organograma_")
  ) {
    return data;
  }
  return {
    success: payload.success,
    errors: {
      code: record.code,
      message: record.message,
      idenvioorganograma: record.idenvioorganograma,
    },
  };
}

// Garante barra final em toda URL
api.interceptors.request.use(
  async (config) => {
    useNetworkActivityStore.getState().beginRequest();
    if (config.url && !config.url.endsWith("/") && !config.url.includes("?")) {
      config.url += "/";
    }

    const method = config.method?.toUpperCase();
    const url = config.url;

    debugLog("api", "request", {
      method,
      url,
      withCredentials: config.withCredentials,
    });

    if (method && UNSAFE_METHODS.has(method) && typeof document !== "undefined") {
      await ensureCsrfCookie();
      // Login may rotate the cookie. Always read it again immediately before
      // every mutation instead of retaining an in-memory token.
      const csrf = readCsrfToken();

      debugLog("api", "csrf", {
        present: Boolean(csrf),
      });

      if (!csrf) throw new Error("CSRF token is unavailable");
      config.headers.set("X-CSRFToken", csrf);
    }

    return config;
  },
  (error) => {
    debugError("api", "request interceptor error", error);
    return Promise.reject(error);
  },
);

// Redireciona para o login da app correta em caso de 401.
api.interceptors.response.use(
  (response) => {
    useNetworkActivityStore.getState().endRequest();
    debugLog("api", "response", {
      method: response.config.method?.toUpperCase(),
      url: response.config.url,
      status: response.status,
    });

    return response;
  },
  (error) => {
    useNetworkActivityStore.getState().endRequest();
    const status = error.response?.status;
    const url = error.config?.url;
    const diagnostic = {
      method: error.config?.method?.toUpperCase(),
      url,
      status,
      data: diagnosticResponseData(error.response?.data),
      online: typeof navigator !== "undefined" ? navigator.onLine : undefined,
    };

    // Respostas 4xx fazem parte do fluxo esperado da aplicação e são tratadas
    // pelas telas. console.error faz o Next exibir um overlay vermelho mesmo
    // quando a rejeição foi capturada corretamente.
    const errorCode = error.response?.data?.errors?.code;
    const isHandledProdestFailure = (
      status === 502 || status === 503
    ) && typeof errorCode === "string"
      && errorCode.startsWith("envio_organograma_");
    if ((status && status >= 400 && status < 500) || isHandledProdestFailure) {
      debugLog("api", "response rejected", diagnostic);
    } else {
      debugError("api", "response error", diagnostic);
    }

    if (isAuthenticatedSessionFailure(status, error.config?.gppAuthMode)) {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        debugLog("auth", "401 ignorado porque o navegador está offline");
        return Promise.reject(error);
      }

      const appContext = useAuthStore.getState().appContext;

      debugLog("auth", "sessão não autorizada", {
        appContext,
        path:
          typeof window !== "undefined" ? window.location.pathname : undefined,
      });

      if (appContext) {
        const { loginPath } = APP_CONFIG[appContext];

        useAuthStore.getState().clearAuth();

        if (
          typeof window !== "undefined" &&
          !window.location.pathname.includes("/login")
        ) {
          const redirect = encodeURIComponent(
            `${window.location.pathname}${window.location.search}`,
          );
          window.location.href = `${loginPath}?reason=session_expired&redirect=${redirect}`;
        }
      } else if (typeof window !== "undefined") {
        const pathname = window.location.pathname;

        const match = Object.entries(APP_CONFIG).find(([, cfg]) =>
          pathname.startsWith(`/${cfg.slug}`),
        );

        if (match) {
          const [, cfg] = match;

          if (!pathname.includes("/login")) {
            const redirect = encodeURIComponent(
              `${window.location.pathname}${window.location.search}`,
            );
            window.location.href = `${cfg.loginPath}?reason=session_expired&redirect=${redirect}`;
          }
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
export { api };

export async function getCapabilities(): Promise<Capability[]> {
  const response = await api.get<Capability[]>("/accounts/capabilities/");
  return response.data;
}

export async function getNavigationMenus(): Promise<NavigationMenusResponse> {
  const response = await api.get<NavigationMenusResponse>("/accounts/menus/");
  return response.data;
}
