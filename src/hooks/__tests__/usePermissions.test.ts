// src/hooks/__tests__/usePermissions.test.ts

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePermissions } from "@/hooks/usePermissions";
import { usePermissionsStore } from "@/store/permissionsStore";
import { PERMISSIONS } from "@/lib/permissions";

describe("usePermissions", () => {
  beforeEach(() => {
    // reset da store antes de cada teste
    usePermissionsStore.setState({
      role: null,
      granted: [],
      isLoading: false,
      isHydrated: false,
    });
  });

  describe("estado inicial", () => {
    it("retorna valores padrão da store", () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.role).toBeNull();
      expect(result.current.granted).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isHydrated).toBe(false);
    });
  });

  describe("integração com store", () => {
    it("reflete permissões definidas na store", () => {
      act(() => {
        usePermissionsStore.setState({
          role: "ADMIN",
          granted: [PERMISSIONS.USER_VIEW],
          isLoading: false,
          isHydrated: true,
        });
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.role).toBe("ADMIN");
      expect(result.current.granted).toEqual([PERMISSIONS.USER_VIEW]);
      expect(result.current.can(PERMISSIONS.USER_VIEW)).toBe(true);
      expect(result.current.can(PERMISSIONS.USER_DELETE)).toBe(false);
    });
  });

  describe("reatividade", () => {
    it("atualiza automaticamente quando a store muda", () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.can(PERMISSIONS.USER_VIEW)).toBe(false);

      act(() => {
        usePermissionsStore.setState({
          role: "ADMIN",
          granted: [PERMISSIONS.USER_VIEW],
          isLoading: false,
          isHydrated: true,
        });
      });

      expect(result.current.can(PERMISSIONS.USER_VIEW)).toBe(true);
    });
  });

  describe("has / hasAny / hasAll", () => {
    beforeEach(() => {
      usePermissionsStore.setState({
        role: "ADMIN",
        granted: [PERMISSIONS.USER_VIEW, PERMISSIONS.USER_ADD],
        isLoading: false,
        isHydrated: true,
      });
    });

    it("has funciona corretamente", () => {
      const { result } = renderHook(() => usePermissions());

      expect(result.current.can(PERMISSIONS.USER_VIEW)).toBe(true);
      expect(result.current.can(PERMISSIONS.USER_DELETE)).toBe(false);
    });

    it("hasAny funciona corretamente", () => {
      const { result } = renderHook(() => usePermissions());

      expect(
        result.current.hasAny([PERMISSIONS.USER_DELETE, PERMISSIONS.USER_VIEW]),
      ).toBe(true);

      expect(
        result.current.hasAny([
          PERMISSIONS.USER_DELETE,
          PERMISSIONS.USER_CHANGE,
        ]),
      ).toBe(false);
    });

    it("hasAll funciona corretamente", () => {
      const { result } = renderHook(() => usePermissions());

      expect(
        result.current.hasAll([PERMISSIONS.USER_VIEW, PERMISSIONS.USER_ADD]),
      ).toBe(true);

      expect(
        result.current.hasAll([PERMISSIONS.USER_VIEW, PERMISSIONS.USER_DELETE]),
      ).toBe(false);
    });
  });

  describe("consistência com service", () => {
    it("can, hasAny e hasAll são coerentes entre si", () => {
      usePermissionsStore.setState({
        role: "ADMIN",
        granted: [PERMISSIONS.USER_VIEW],
        isLoading: false,
        isHydrated: true,
      });

      const { result } = renderHook(() => usePermissions());

      const perms = [PERMISSIONS.USER_VIEW, PERMISSIONS.USER_DELETE];

      expect(result.current.hasAny(perms)).toBe(
        perms.some((p) => result.current.can(p)),
      );

      expect(result.current.hasAll(perms)).toBe(
        perms.every((p) => result.current.can(p)),
      );
    });
  });

  describe("flags de estado", () => {
    it("expõe corretamente isLoading e isHydrated", () => {
      act(() => {
        usePermissionsStore.setState({
          role: null,
          granted: [],
          isLoading: true,
          isHydrated: false,
        });
      });

      const { result } = renderHook(() => usePermissions());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isHydrated).toBe(false);
    });
  });

  describe("isolamento entre renders", () => {
    it("não compartilha estado entre diferentes hooks", () => {
      const { result: r1 } = renderHook(() => usePermissions());
      const { result: r2 } = renderHook(() => usePermissions());

      act(() => {
        usePermissionsStore.setState({
          role: "ADMIN",
          granted: [PERMISSIONS.USER_VIEW],
          isLoading: false,
          isHydrated: true,
        });
      });

      expect(r1.current.can(PERMISSIONS.USER_VIEW)).toBe(true);
      expect(r2.current.can(PERMISSIONS.USER_VIEW)).toBe(true);
    });
  });
});
