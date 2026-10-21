import type { AppContext } from "@/types/auth";

export const meCacheKey = (appContext: AppContext) =>
  ["/accounts/me/", appContext] as const;

export const permissionsCacheKey = (appContext: AppContext) =>
  ["/accounts/me/permissions/", appContext] as const;
