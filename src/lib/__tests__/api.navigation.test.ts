import { afterEach, describe, expect, it, vi } from "vitest";

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
