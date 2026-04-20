"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import type { AppContext } from "@/types/auth";

interface AppThemeProviderProps {
  appContext: AppContext;
  children: React.ReactNode;
}

export function AppThemeProvider({
  appContext,
  children,
}: AppThemeProviderProps) {
  const setAppContext = useAuthStore((s) => s.setAppContext);

  useEffect(() => {
    setAppContext(appContext);
    document.body.setAttribute("data-app", appContext);

    return () => {
      document.body.removeAttribute("data-app");
    };
  }, [appContext, setAppContext]);

  return <>{children}</>;
}
