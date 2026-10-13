"use client";

import useSWR from "swr";

import { getNavigationMenus } from "@/lib/api";
import type { AppContext } from "@/types/auth";
import type { NavigationMenusResponse } from "@/types/navigation";

export const navigationMenusKey = (
  appContext: AppContext | null,
  version: number,
) =>
  appContext
    ? (["/accounts/menus/", appContext, version] as const)
    : null;

export function useNavigationMenus(
  appContext: AppContext | null,
  version: number,
) {
  return useSWR<NavigationMenusResponse>(
    navigationMenusKey(appContext, version),
    getNavigationMenus,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      shouldRetryOnError: true,
      errorRetryCount: 2,
      errorRetryInterval: 1_000,
    },
  );
}
