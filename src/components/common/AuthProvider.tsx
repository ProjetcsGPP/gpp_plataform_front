"use client";

import { useMe } from "@/hooks/useMe";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  useMe();

  return <>{children}</>;
}
