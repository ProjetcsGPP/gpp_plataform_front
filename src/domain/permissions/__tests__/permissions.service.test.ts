// src/domain/permissions/__tests__/permissions.service.test.ts

import { describe, it, expect } from "vitest";
import { buildPermissionContext } from "@/domain/permissions/permissions.service";
import { PERMISSIONS, type PermissionKey } from "@/lib/permissions";

describe("buildPermissionContext", () => {
  describe("sanitização", () => {
    it("filtra tokens inválidos vindos do backend", () => {
      const ctx = buildPermissionContext("ADMIN", [
        "view_user",
        "TOKEN_INVALIDO",
        "xss_inject",
        "add_user",
      ]);

      expect(ctx.granted).toEqual(["view_user", "add_user"]);
    });

    it("retorna granted vazio quando raw é array vazio", () => {
      const ctx = buildPermissionContext("ADMIN", []);
      expect(ctx.granted).toHaveLength(0);
    });

    it("retorna granted vazio quando todos os tokens são inválidos", () => {
      const ctx = buildPermissionContext("ADMIN", [
        "FAKE_PERM",
        "ANOTHER_FAKE",
      ]);

      expect(ctx.granted).toHaveLength(0);
    });

    it("sanitiza mantendo apenas válidos mesmo com mistura complexa", () => {
      const ctx = buildPermissionContext("ADMIN", [
        "view_user",
        "INVALID",
        "add_user",
        "INVALID2",
      ]);

      expect(ctx.granted).toEqual(["view_user", "add_user"]);
    });

    it("mantém duplicatas (comportamento atual explícito)", () => {
      const ctx = buildPermissionContext("ADMIN", ["view_user", "view_user"]);

      expect(ctx.granted).toEqual(["view_user", "view_user"]);
    });
  });

  describe("role", () => {
    it("expõe a role recebida", () => {
      const ctx = buildPermissionContext("PORTAL_ADMIN", ["view_user"]);
      expect(ctx.role).toBe("PORTAL_ADMIN");
    });

    it("aceita role null", () => {
      const ctx = buildPermissionContext(null, []);
      expect(ctx.role).toBeNull();
    });
  });

  describe("has / can", () => {
    const ctx = buildPermissionContext("ADMIN", [
      PERMISSIONS.USER_VIEW,
      PERMISSIONS.USER_ADD,
    ]);

    it("retorna true para permissão concedida", () => {
      expect(ctx.has(PERMISSIONS.USER_VIEW)).toBe(true);
    });

    it("retorna false para permissão não concedida", () => {
      expect(ctx.has(PERMISSIONS.USER_DELETE)).toBe(false);
    });

    it("can é alias funcional de has", () => {
      expect(ctx.can(PERMISSIONS.USER_VIEW)).toBe(
        ctx.has(PERMISSIONS.USER_VIEW),
      );

      expect(ctx.can(PERMISSIONS.USER_DELETE)).toBe(
        ctx.has(PERMISSIONS.USER_DELETE),
      );
    });
  });

  describe("hasAny", () => {
    const ctx = buildPermissionContext("ADMIN", [
      PERMISSIONS.USER_VIEW,
      PERMISSIONS.ROLE_VIEW,
    ]);

    it("retorna true quando ao menos uma permissão está concedida", () => {
      expect(ctx.hasAny([PERMISSIONS.USER_VIEW, PERMISSIONS.USER_DELETE])).toBe(
        true,
      );
    });

    it("retorna false quando nenhuma permissão está concedida", () => {
      expect(
        ctx.hasAny([PERMISSIONS.USER_DELETE, PERMISSIONS.USER_CHANGE]),
      ).toBe(false);
    });

    it("retorna false para array vazio", () => {
      expect(ctx.hasAny([])).toBe(false);
    });

    it("retorna true quando todas as permissões estão concedidas", () => {
      expect(ctx.hasAny([PERMISSIONS.USER_VIEW, PERMISSIONS.ROLE_VIEW])).toBe(
        true,
      );
    });
  });

  describe("hasAll", () => {
    const ctx = buildPermissionContext("ADMIN", [
      PERMISSIONS.USER_VIEW,
      PERMISSIONS.USER_ADD,
      PERMISSIONS.ROLE_VIEW,
    ]);

    it("retorna true quando todas as permissões estão concedidas", () => {
      expect(ctx.hasAll([PERMISSIONS.USER_VIEW, PERMISSIONS.USER_ADD])).toBe(
        true,
      );
    });

    it("retorna false quando qualquer permissão falta", () => {
      expect(ctx.hasAll([PERMISSIONS.USER_VIEW, PERMISSIONS.USER_DELETE])).toBe(
        false,
      );
    });

    it("retorna true para array vazio (vacuously true)", () => {
      expect(ctx.hasAll([])).toBe(true);
    });

    it("retorna false quando granted está vazio", () => {
      const emptyCtx = buildPermissionContext("ADMIN", []);
      expect(emptyCtx.hasAll([PERMISSIONS.USER_VIEW])).toBe(false);
    });
  });

  describe("consistência interna", () => {
    it("hasAny e hasAll são consistentes com has", () => {
      const ctx = buildPermissionContext("ADMIN", [PERMISSIONS.USER_VIEW]);

      const perms = [PERMISSIONS.USER_VIEW, PERMISSIONS.USER_DELETE];

      expect(ctx.hasAny(perms)).toBe(perms.some((p) => ctx.has(p)));

      expect(ctx.hasAll(perms)).toBe(perms.every((p) => ctx.has(p)));
    });
  });

  describe("imutabilidade", () => {
    it("não permite mutação do array granted", () => {
      const ctx = buildPermissionContext("ADMIN", ["view_user"]);

      expect(() => {
        (ctx.granted as PermissionKey[]).push("add_user");
      }).toThrow();
    });

    it("não permite sobrescrever propriedades do contexto", () => {
      const ctx = buildPermissionContext("ADMIN", ["view_user"]);

      expect(() => {
        (ctx as any).has = () => false;
      }).toThrow();
    });
  });

  describe("imutabilidade entre instâncias", () => {
    it("duas instâncias com os mesmos dados são independentes", () => {
      const ctx1 = buildPermissionContext("A", ["view_user"]);
      const ctx2 = buildPermissionContext("B", ["add_user"]);

      expect(ctx1.can(PERMISSIONS.USER_VIEW)).toBe(true);
      expect(ctx1.can(PERMISSIONS.USER_ADD)).toBe(false);

      expect(ctx2.can(PERMISSIONS.USER_VIEW)).toBe(false);
      expect(ctx2.can(PERMISSIONS.USER_ADD)).toBe(true);
    });
  });
});
