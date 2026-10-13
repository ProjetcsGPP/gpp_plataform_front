// src/hooks/__tests__/useScreenGuard.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useScreenGuard } from "@/hooks/useScreenGuard";
import { PERMISSIONS } from "@/lib/permissions";

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: vi.fn(),
}));

import { usePermissions } from "@/hooks/usePermissions";

const mockUsePermissions = usePermissions as ReturnType<typeof vi.fn>;

function makeCtx(granted: string[], appContext = "PORTAL") {
  const set = new Set(granted);
  return {
    appContext,
    can: (p: string) => set.has(p),
    hasAny: (ps: string[]) => ps.some((p) => set.has(p)),
    hasAll: (ps: string[]) => ps.every((p) => set.has(p)),
    isLoading: false,
    isHydrated: true,
  };
}

beforeEach(() => {
  mockUsePermissions.mockReturnValue(
    makeCtx([PERMISSIONS.USER_VIEW, PERMISSIONS.USER_CHANGE]),
  );
});

describe("useScreenGuard", () => {
  it("permite acesso quando permissão única concedida", () => {
    const { result } = renderHook(() => useScreenGuard(PERMISSIONS.USER_VIEW));
    expect(result.current.allowed).toBe(true);
  });

  it("nega acesso quando permissão única não concedida", () => {
    const { result } = renderHook(() =>
      useScreenGuard(PERMISSIONS.USER_DELETE),
    );
    expect(result.current.allowed).toBe(false);
  });

  it("mode=all: nega se qualquer permissão faltar", () => {
    const { result } = renderHook(() =>
      useScreenGuard([PERMISSIONS.USER_VIEW, PERMISSIONS.USER_DELETE], "all"),
    );
    expect(result.current.allowed).toBe(false);
  });

  it("mode=all: permite se todas as permissões concedidas", () => {
    const { result } = renderHook(() =>
      useScreenGuard([PERMISSIONS.USER_VIEW, PERMISSIONS.USER_CHANGE], "all"),
    );
    expect(result.current.allowed).toBe(true);
  });

  it("mode=any: permite se ao menos uma permissão concedida", () => {
    const { result } = renderHook(() =>
      useScreenGuard([PERMISSIONS.USER_DELETE, PERMISSIONS.USER_VIEW], "any"),
    );
    expect(result.current.allowed).toBe(true);
  });

  it("mode=any: nega se nenhuma permissão concedida", () => {
    const { result } = renderHook(() =>
      useScreenGuard([PERMISSIONS.USER_DELETE, PERMISSIONS.ROLE_DELETE], "any"),
    );
    expect(result.current.allowed).toBe(false);
  });

  it("retorna allowed=false enquanto isHydrated=false", () => {
    mockUsePermissions.mockReturnValue({
      ...makeCtx([PERMISSIONS.USER_VIEW]),
      isLoading: true,
      isHydrated: false,
    });
    const { result } = renderHook(() => useScreenGuard(PERMISSIONS.USER_VIEW));
    expect(result.current.allowed).toBe(false);
    expect(result.current.isLoading).toBe(true);
  });

  it("expõe isHydrated corretamente", () => {
    const { result } = renderHook(() => useScreenGuard(PERMISSIONS.USER_VIEW));
    expect(result.current.isHydrated).toBe(true);
  });
});
