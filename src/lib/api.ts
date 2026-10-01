// src/lib/api.ts
import axios from "axios";
import { APP_CONFIG } from "@/types/auth";
import { useAuthStore } from "@/store/authStore";
import { debugError, debugLog } from "@/lib/debug";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Garante barra final em toda URL
api.interceptors.request.use(
  (config) => {
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

    if (
      method &&
      ["POST", "PUT", "PATCH", "DELETE"].includes(method) &&
      typeof document !== "undefined"
    ) {
      const csrf = document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith("csrftoken="))
        ?.split("=")
        .slice(1)
        .join("=");

      debugLog("api", "csrf", {
        present: Boolean(csrf),
      });

      if (csrf) {
        config.headers["X-CSRFToken"] = decodeURIComponent(csrf);
      }
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
    debugLog("api", "response", {
      method: response.config.method?.toUpperCase(),
      url: response.config.url,
      status: response.status,
    });

    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;
    const isLogout = url?.includes("/accounts/logout");

    debugError("api", "response error", {
      method: error.config?.method?.toUpperCase(),
      url,
      status,
      data: error.response?.data,
      online: typeof navigator !== "undefined" ? navigator.onLine : undefined,
    });

    if (!isLogout && status === 401) {
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
          window.location.href = `${loginPath}?reason=session_expired`;
        }
      } else if (typeof window !== "undefined") {
        const pathname = window.location.pathname;

        const match = Object.entries(APP_CONFIG).find(([, cfg]) =>
          pathname.startsWith(`/${cfg.slug}`),
        );

        if (match) {
          const [, cfg] = match;

          if (!pathname.includes("/login")) {
            window.location.href = `${cfg.loginPath}?reason=session_expired`;
          }
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
export { api };
