import { afterEach, describe, expect, it, vi } from "vitest";
import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";

import api, { getCapabilities, getNavigationMenus } from "@/lib/api";

describe("API de navegação", () => {
  afterEach(() => vi.restoreAllMocks());

  it("usa o cliente compartilhado com cookies para capabilities", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: [] });

    await expect(getCapabilities()).resolves.toEqual([]);

    expect(api.defaults.withCredentials).toBe(true);
    expect(get).toHaveBeenCalledWith("/accounts/capabilities/");
  });

  it("consulta menus sem permitir appContext por query string", async () => {
    const payload = { app_context: "PORTAL", items: [] };
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: payload });

    await expect(getNavigationMenus()).resolves.toEqual(payload);

    expect(get).toHaveBeenCalledWith("/accounts/menus/");
  });
});

describe("Content-Type do cliente compartilhado", () => {
  function captureAdapter(
    captured: InternalAxiosRequestConfig[],
  ): AxiosAdapter {
    return async (config) => {
      captured.push(config);
      return {
        data: {},
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    };
  }

  it("não força Content-Type global", () => {
    expect(api.defaults.headers.common["Content-Type"]).toBeUndefined();
  });

  it("mantém a serialização JSON automática para objetos comuns", async () => {
    const captured: InternalAxiosRequestConfig[] = [];
    await api.post(
      "/teste-json/",
      { nome: "Patriarca" },
      { adapter: captureAdapter(captured) },
    );

    expect(captured[0].headers.getContentType()).toContain("application/json");
    expect(captured[0].data).toBe('{"nome":"Patriarca"}');
  });

  it("preserva FormData sem inserir application/json", async () => {
    const captured: InternalAxiosRequestConfig[] = [];
    const form = new FormData();
    const file = new File(["conteúdo"], "organograma.xlsx");
    form.append("arquivo", file);

    await api.post("/teste-form-data/", form, {
      adapter: captureAdapter(captured),
    });

    expect(captured[0].data).toBe(form);
    expect(captured[0].data.get("arquivo")).toBe(file);
    expect(captured[0].headers.getContentType()).not.toContain(
      "application/json",
    );
  });
});
