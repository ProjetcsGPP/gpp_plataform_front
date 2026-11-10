import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AxiosError } from "axios";
import type {
  AxiosAdapter,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

import api, {
  CSRF_BOOTSTRAP_URL,
  isAuthenticatedSessionFailure,
} from "@/lib/api";
import { logoutApp } from "@/lib/auth";
import { useNetworkActivityStore } from "@/store/networkActivityStore";

function success(config: InternalAxiosRequestConfig): AxiosResponse {
  return { data: {}, status: 200, statusText: "OK", headers: {}, config };
}

describe("contrato CSRF do Axios compartilhado", () => {
  const originalAdapter = api.defaults.adapter;

  beforeEach(() => {
    document.cookie = "csrftoken=; Max-Age=0; path=/";
    useNetworkActivityStore.setState({ pendingRequests: 0 });
  });

  afterEach(() => {
    api.defaults.adapter = originalAdapter;
    document.cookie = "csrftoken=; Max-Age=0; path=/";
  });

  it("faz bootstrap antes da primeira mutação e envia o token", async () => {
    const requests: InternalAxiosRequestConfig[] = [];
    const adapter: AxiosAdapter = async (config) => {
      requests.push(config);
      if (config.url === CSRF_BOOTSTRAP_URL) {
        document.cookie = "csrftoken=token-inicial; path=/";
      }
      return success(config);
    };
    api.defaults.adapter = adapter;

    await api.post("/accounts/login/", {}, { gppAuthMode: "public" });

    expect(requests.map((request) => request.url)).toEqual([
      CSRF_BOOTSTRAP_URL,
      "/accounts/login/",
    ]);
    expect(requests[1].headers.get("X-CSRFToken")).toBe("token-inicial");
    expect(api.defaults.withCredentials).toBe(true);
  });

  it("não repete o bootstrap quando o cookie já existe", async () => {
    document.cookie = "csrftoken=existente; path=/";
    const requests: InternalAxiosRequestConfig[] = [];
    const adapter: AxiosAdapter = async (config) => {
      requests.push(config);
      return success(config);
    };
    api.defaults.adapter = adapter;

    await api.patch("/recurso/1/", {});

    expect(requests).toHaveLength(1);
    expect(requests[0].headers.get("X-CSRFToken")).toBe("existente");
  });

  it("relê o cookie rotacionado antes da mutação seguinte", async () => {
    document.cookie = "csrftoken=antes-login; path=/";
    const requests: InternalAxiosRequestConfig[] = [];
    const adapter: AxiosAdapter = async (config) => {
      requests.push(config);
      if (config.url === "/accounts/login/") {
        document.cookie = "csrftoken=apos-login; path=/";
      }
      return success(config);
    };
    api.defaults.adapter = adapter;

    await api.post("/accounts/login/", {}, { gppAuthMode: "public" });
    await api.delete("/recurso/1/");

    expect(requests[0].headers.get("X-CSRFToken")).toBe("antes-login");
    expect(requests[1].headers.get("X-CSRFToken")).toBe("apos-login");
  });

  it("protege o logout seletivo com bootstrap CSRF", async () => {
    const requests: InternalAxiosRequestConfig[] = [];
    const adapter: AxiosAdapter = async (config) => {
      requests.push(config);
      if (config.url === CSRF_BOOTSTRAP_URL) {
        document.cookie = "csrftoken=logout-token; path=/";
      }
      return success(config);
    };
    api.defaults.adapter = adapter;

    await logoutApp("PORTAL");

    expect(requests.map((request) => request.url)).toEqual([
      CSRF_BOOTSTRAP_URL,
      "/accounts/logout/portal/",
    ]);
    expect(requests[1].headers.get("X-CSRFToken")).toBe("logout-token");
  });

  it("não envia a mutação quando o bootstrap falha", async () => {
    const requests: InternalAxiosRequestConfig[] = [];
    const adapter: AxiosAdapter = async (config) => {
      requests.push(config);
      return success(config);
    };
    api.defaults.adapter = adapter;

    await expect(api.post("/mutacao/", {})).rejects.toThrow(
      "CSRF bootstrap did not provide a token",
    );
    expect(requests.map((request) => request.url)).toEqual([CSRF_BOOTSTRAP_URL]);
  });

  it("não confunde falha pública de login com expiração de sessão", async () => {
    const adapter: AxiosAdapter = async (config) => {
      throw new AxiosError(
        "unauthorized",
        "ERR_BAD_REQUEST",
        config,
        undefined,
        { data: {}, status: 401, statusText: "Unauthorized", headers: {}, config },
      );
    };

    await expect(
      api.get("/accounts/login/", { adapter, gppAuthMode: "public" }),
    ).rejects.toMatchObject({ response: { status: 401 } });
  });

  it("não bloqueia globalmente consultas GET", async () => {
    const adapter: AxiosAdapter = async (config) => {
      expect(useNetworkActivityStore.getState().pendingRequests).toBe(0);
      return success(config);
    };

    await api.get("/accounts/authz/version/", { adapter });

    expect(useNetworkActivityStore.getState().pendingRequests).toBe(0);
  });

  it("bloqueia mutações enquanto a requisição está em andamento", async () => {
    document.cookie = "csrftoken=existente; path=/";
    const adapter: AxiosAdapter = async (config) => {
      expect(useNetworkActivityStore.getState().pendingRequests).toBe(1);
      return success(config);
    };

    await api.post("/recurso/", {}, { adapter });

    expect(useNetworkActivityStore.getState().pendingRequests).toBe(0);
  });

  it("permite solicitar bloqueio explícito em uma consulta", async () => {
    const adapter: AxiosAdapter = async (config) => {
      expect(useNetworkActivityStore.getState().pendingRequests).toBe(1);
      return success(config);
    };

    await api.get("/consulta-critica/", { adapter, gppBlockUi: true });

    expect(useNetworkActivityStore.getState().pendingRequests).toBe(0);
  });
});

describe("classificação de falhas de sessão", () => {
  it.each([
    [401, "authenticated", true],
    [401, undefined, true],
    [401, "public", false],
    [403, "authenticated", false],
    [429, "authenticated", false],
    [500, "authenticated", false],
  ] as const)("status %s em modo %s => %s", (status, mode, expected) => {
    expect(isAuthenticatedSessionFailure(status, mode)).toBe(expected);
  });

  it.each([
    "session_expired",
    "session_revoked",
    "inactive_user",
    "app_context_mismatch",
  ])("trata %s como falha autenticada sem depender do detalhe", () => {
    expect(isAuthenticatedSessionFailure(401, "authenticated")).toBe(true);
  });
});
