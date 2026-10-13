import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useNavigationMenus } from "@/hooks/useNavigationMenus";
import type { AppContext } from "@/types/auth";

const useSWRMock = vi.hoisted(() =>
  vi.fn((key: unknown, fetcher?: unknown, config?: unknown) => {
    void key;
    void fetcher;
    void config;
    return { data: undefined };
  }),
);

vi.mock("swr", () => ({ default: useSWRMock }));

describe("useNavigationMenus", () => {
  beforeEach(() => useSWRMock.mockClear());

  it("inclui appContext na chave e troca a consulta quando ele muda", () => {
    const { rerender } = renderHook(
      ({ appContext }) => useNavigationMenus(appContext, 0),
      { initialProps: { appContext: "PORTAL" as AppContext } },
    );

    expect(useSWRMock.mock.calls.at(-1)?.[0]).toEqual([
      "/accounts/menus/",
      "PORTAL",
      0,
    ]);
    expect(useSWRMock.mock.calls.at(-1)?.[2]).toMatchObject({
      shouldRetryOnError: true,
      errorRetryCount: 2,
    });

    rerender({ appContext: "ACOES_PNGI" });

    expect(useSWRMock.mock.calls.at(-1)?.[0]).toEqual([
      "/accounts/menus/",
      "ACOES_PNGI",
      0,
    ]);
  });

  it("não consulta sem appContext", () => {
    renderHook(() => useNavigationMenus(null, 0));
    expect(useSWRMock.mock.calls.at(-1)?.[0]).toBeNull();
  });
});
