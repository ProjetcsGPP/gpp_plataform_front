// src/hooks/__tests__/useScreenGuard.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useScreenGuard } from "@/hooks/useScreenGuard";

// Mock do usePermissions
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: vi.fn(),
}));

import { usePermissions } from "@/hooks/usePermissions";

const mockUsePermissions = usePermissions as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockUsePermissions.mockReturnValue({
    can: (p: string) => ["user.view", "user.change"].includes(p),
    isLoading: false,
    isHydrated: true,
  });
});

describe("useScreenGuard", () => {
  it("permite acesso quando permissão única concedida", () => {
    const { result } = renderHook(() => useScreenGuard("user.view"));
    expect(result.current.allowed).toBe(true);
  });

  it("nega acesso quando permissão única não concedida", () => {
    const { result } = renderHook(() => useScreenGuard("user.delete"));
    expect(result.current.allowed).toBe(false);
  });

  it("mode=all: nega se qualquer permissão faltar", () => {
    const { result } = renderHook(() =>
      useScreenGuard(["user.view", "user.delete"], "all"),
    );
    expect(result.current.allowed).toBe(false);
  });

  it("mode=all: permite se todas as permissões concedidas", () => {
    const { result } = renderHook(() =>
      useScreenGuard(["user.view", "user.change"], "all"),
    );
    expect(result.current.allowed).toBe(true);
  });

  it("mode=any: permite se ao menos uma permissão concedida", () => {
    const { result } = renderHook(() =>
      useScreenGuard(["user.delete", "user.view"], "any"),
    );
    expect(result.current.allowed).toBe(true);
  });

  it("mode=any: nega se nenhuma permissão concedida", () => {
    const { result } = renderHook(() =>
      useScreenGuard(["user.delete", "admin.manage"], "any"),
    );
    expect(result.current.allowed).toBe(false);
  });

  it("retorna allowed=false enquanto isLoading=true", () => {
    mockUsePermissions.mockReturnValue({
      can: () => true,
      isLoading: true,
      isHydrated: false,
    });
    const { result } = renderHook(() => useScreenGuard("user.view"));
    expect(result.current.allowed).toBe(false);
    expect(result.current.isLoading).toBe(true);
  });
});
